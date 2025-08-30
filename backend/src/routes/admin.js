const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get system dashboard statistics
router.get('/dashboard', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // User statistics
    const userStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'producer') as producers,
        COUNT(*) FILTER (WHERE role = 'verifier') as verifiers,
        COUNT(*) FILTER (WHERE role = 'buyer') as buyers,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d
      FROM users
    `);

    // Production statistics
    const productionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
        COUNT(*) FILTER (WHERE status = 'verified') as verified_submissions,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'verified'), 0) as total_verified_production
      FROM production_submissions
    `);

    // Credit statistics
    const creditStats = await pool.query(`
      SELECT 
        COUNT(*) as total_batches,
        COALESCE(SUM(amount::bigint), 0) as total_credits_issued,
        COUNT(*) FILTER (WHERE is_retired = true) as retired_batches,
        COALESCE(SUM(amount::bigint) FILTER (WHERE is_retired = true), 0) as total_retired_credits
      FROM credit_batches
    `);

    // Marketplace statistics
    const marketplaceStats = await pool.query(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE status = 'active') as active_listings,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'active'), 0) as available_credits,
        (SELECT COUNT(*) FROM marketplace_purchases) as total_purchases,
        (SELECT COALESCE(SUM(total_price::bigint), 0) FROM marketplace_purchases) as total_volume
      FROM marketplace_listings
    `);

    // Recent activity
    const recentActivity = await pool.query(`
      SELECT 'user_registration' as type, email as description, created_at
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 'production_submission' as type, 
             CONCAT('Plant: ', plant_id, ' - ', amount, ' kg') as description, 
             submission_time as created_at
      FROM production_submissions 
      WHERE submission_time >= NOW() - INTERVAL '7 days'
      UNION ALL
      SELECT 'credit_batch' as type,
             CONCAT('Batch #', batch_id, ' - ', amount, ' credits') as description,
             issuance_time as created_at
      FROM credit_batches
      WHERE issuance_time >= NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      users: userStats.rows[0],
      production: productionStats.rows[0],
      credits: creditStats.rows[0],
      marketplace: marketplaceStats.rows[0],
      recent_activity: recentActivity.rows
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard statistics',
      code: 'FETCH_DASHBOARD_ERROR'
    });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireRole('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const role = req.query.role;
    const is_active = req.query.is_active;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    let query = 'SELECT id, email, role, wallet_address, first_name, last_name, company_name, is_active, is_verified, kyc_status, created_at, last_login FROM users';
    const params = [];
    const conditions = [];

    if (role) {
      conditions.push(`role = $${params.length + 1}`);
      params.push(role);
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = $${params.length + 1}`);
      params.push(is_active === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY ${sort} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count query
    let countQuery = 'SELECT COUNT(*) FROM users';
    const countParams = [];
    const countConditions = [];

    if (role) {
      countConditions.push(`role = $${countParams.length + 1}`);
      countParams.push(role);
    }

    if (is_active !== undefined) {
      countConditions.push(`is_active = $${countParams.length + 1}`);
      countParams.push(is_active === 'true');
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      users: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      code: 'FETCH_USERS_ERROR'
    });
  }
});

// Update user status (activate/deactivate)
router.patch('/users/:id/status', authenticateToken, requireRole('admin'), validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: 'is_active must be boolean',
        code: 'INVALID_STATUS'
      });
    }

    // Get current user data
    const currentResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update user status
    const result = await pool.query(`
      UPDATE users 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id, email, role, is_active, updated_at
    `, [is_active, id]);

    // Log status change
    await auditLog(
      req.user.id,
      is_active ? 'user_activated' : 'user_deactivated',
      'user',
      id,
      { is_active: currentResult.rows[0].is_active },
      { is_active },
      req
    );

    res.json({
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Failed to update user status',
      code: 'UPDATE_STATUS_ERROR'
    });
  }
});

// Update user KYC status
router.patch('/users/:id/kyc', authenticateToken, requireRole('admin'), validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { kyc_status, is_verified } = req.body;

    const validKycStatuses = ['pending', 'approved', 'rejected', 'under_review'];
    if (!validKycStatuses.includes(kyc_status)) {
      return res.status(400).json({
        error: 'Invalid KYC status',
        code: 'INVALID_KYC_STATUS',
        valid_statuses: validKycStatuses
      });
    }

    // Get current user data
    const currentResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Update KYC status
    const result = await pool.query(`
      UPDATE users 
      SET kyc_status = $1, is_verified = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING id, email, role, kyc_status, is_verified, updated_at
    `, [kyc_status, is_verified, id]);

    // Log KYC status change
    await auditLog(
      req.user.id,
      'kyc_status_updated',
      'user',
      id,
      { 
        kyc_status: currentResult.rows[0].kyc_status,
        is_verified: currentResult.rows[0].is_verified
      },
      { kyc_status, is_verified },
      req
    );

    res.json({
      message: 'KYC status updated successfully',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({
      error: 'Failed to update KYC status',
      code: 'UPDATE_KYC_ERROR'
    });
  }
});

// Get audit logs
router.get('/audit-logs', authenticateToken, requireRole('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const action = req.query.action;
    const resource_type = req.query.resource_type;
    const user_id = req.query.user_id;

    let query = `
      SELECT al.*, u.email as user_email, u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    const params = [];
    const conditions = [];

    if (action) {
      conditions.push(`al.action = $${params.length + 1}`);
      params.push(action);
    }

    if (resource_type) {
      conditions.push(`al.resource_type = $${params.length + 1}`);
      params.push(resource_type);
    }

    if (user_id) {
      conditions.push(`al.user_id = $${params.length + 1}`);
      params.push(user_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count query
    let countQuery = 'SELECT COUNT(*) FROM audit_logs al';
    const countParams = [];
    const countConditions = [];

    if (action) {
      countConditions.push(`al.action = $${countParams.length + 1}`);
      countParams.push(action);
    }

    if (resource_type) {
      countConditions.push(`al.resource_type = $${countParams.length + 1}`);
      countParams.push(resource_type);
    }

    if (user_id) {
      countConditions.push(`al.user_id = $${countParams.length + 1}`);
      countParams.push(user_id);
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      audit_logs: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({
      error: 'Failed to fetch audit logs',
      code: 'FETCH_AUDIT_LOGS_ERROR'
    });
  }
});

// Get system health metrics
router.get('/health', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // Database connection health
    const dbHealth = await pool.query('SELECT NOW() as timestamp');
    
    // Recent error counts
    const errorCounts = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour') as errors_1h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') as errors_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as errors_7d
      FROM audit_logs 
      WHERE action LIKE '%error%' OR action LIKE '%failed%'
    `);

    // Active sessions
    const activeSessions = await pool.query(`
      SELECT COUNT(*) as active_users
      FROM users 
      WHERE last_login >= NOW() - INTERVAL '24 hours'
    `);

    // Pending verifications
    const pendingWork = await pool.query(`
      SELECT 
        COUNT(*) as pending_submissions
      FROM production_submissions 
      WHERE status = 'pending'
    `);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        timestamp: dbHealth.rows[0].timestamp
      },
      errors: errorCounts.rows[0],
      activity: activeSessions.rows[0],
      pending_work: pendingWork.rows[0]
    });

  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Failed to fetch system health',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

module.exports = router;
