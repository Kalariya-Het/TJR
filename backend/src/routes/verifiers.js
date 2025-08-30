const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireKYCVerification } = require('../middleware/auth');
const { validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get all verifiers (admin only)
router.get('/', authenticateToken, requireRole('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    const result = await pool.query(`
      SELECT v.*, u.email, u.first_name, u.last_name, u.company_name, u.is_verified as user_verified
      FROM verifiers v
      JOIN users u ON v.user_id = u.id
      ORDER BY v.${sort} ${order}
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM verifiers');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      verifiers: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get verifiers error:', error);
    res.status(500).json({
      error: 'Failed to fetch verifiers',
      code: 'FETCH_VERIFIERS_ERROR'
    });
  }
});

// Get verifier by ID
router.get('/:id', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT v.*, u.email, u.first_name, u.last_name, u.company_name, u.is_verified as user_verified
      FROM verifiers v
      JOIN users u ON v.user_id = u.id
      WHERE v.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Verifier not found',
        code: 'VERIFIER_NOT_FOUND'
      });
    }

    const verifier = result.rows[0];

    // Check authorization - admin or own verifier
    if (req.user.role !== 'admin' && req.user.id !== verifier.user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({ verifier });

  } catch (error) {
    console.error('Get verifier error:', error);
    res.status(500).json({
      error: 'Failed to fetch verifier',
      code: 'FETCH_VERIFIER_ERROR'
    });
  }
});

// Register new verifier
router.post('/', authenticateToken, requireRole(['admin', 'verifier']), requireKYCVerification, async (req, res) => {
  try {
    const {
      organization_name,
      organization_type,
      accreditation_body,
      accreditation_number,
      specialization
    } = req.body;

    // For non-admin users, use their own user_id and wallet_address
    const user_id = req.user.role === 'admin' ? req.body.user_id : req.user.id;
    const wallet_address = req.user.role === 'admin' ? req.body.wallet_address : req.user.wallet_address;

    if (!wallet_address) {
      return res.status(400).json({
        error: 'Wallet address required',
        code: 'WALLET_ADDRESS_REQUIRED'
      });
    }

    // Check if verifier already exists
    const existingVerifier = await pool.query(
      'SELECT id FROM verifiers WHERE wallet_address = $1',
      [wallet_address]
    );

    if (existingVerifier.rows.length > 0) {
      return res.status(409).json({
        error: 'Verifier already exists with this wallet address',
        code: 'VERIFIER_EXISTS'
      });
    }

    // Insert new verifier
    const result = await pool.query(`
      INSERT INTO verifiers (
        user_id, wallet_address, organization_name, organization_type,
        accreditation_body, accreditation_number, specialization
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      user_id, wallet_address, organization_name, organization_type,
      accreditation_body, accreditation_number, specialization
    ]);

    const verifier = result.rows[0];

    // Log verifier registration
    await auditLog(
      req.user.id,
      'verifier_registered',
      'verifier',
      verifier.id,
      null,
      verifier,
      req
    );

    res.status(201).json({
      message: 'Verifier registered successfully',
      verifier
    });

  } catch (error) {
    console.error('Verifier registration error:', error);
    res.status(500).json({
      error: 'Failed to register verifier',
      code: 'VERIFIER_REGISTRATION_ERROR'
    });
  }
});

// Get verifier's verification history
router.get('/:id/verifications', authenticateToken, validateUUID, validatePagination, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    // Check if verifier exists and user has access
    const verifierResult = await pool.query(
      'SELECT user_id FROM verifiers WHERE id = $1',
      [id]
    );

    if (verifierResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Verifier not found',
        code: 'VERIFIER_NOT_FOUND'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== verifierResult.rows[0].user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    let query = `
      SELECT ps.*, p.plant_name, p.location as plant_location
      FROM production_submissions ps
      JOIN producers p ON ps.producer_id = p.id
      WHERE ps.verifier_id = $1
    `;
    const params = [id];

    if (status) {
      query += ' AND ps.status = $2';
      params.push(status);
    }

    query += ' ORDER BY ps.verification_time DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = status 
      ? 'SELECT COUNT(*) FROM production_submissions WHERE verifier_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM production_submissions WHERE verifier_id = $1';
    const countParams = status ? [id, status] : [id];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      verifications: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get verifier verifications error:', error);
    res.status(500).json({
      error: 'Failed to fetch verifications',
      code: 'FETCH_VERIFICATIONS_ERROR'
    });
  }
});

// Get verifier statistics
router.get('/:id/stats', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if verifier exists and user has access
    const verifierResult = await pool.query(
      'SELECT user_id, reputation_score, total_verifications, successful_verifications FROM verifiers WHERE id = $1',
      [id]
    );

    if (verifierResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Verifier not found',
        code: 'VERIFIER_NOT_FOUND'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== verifierResult.rows[0].user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get verification statistics
    const verificationStats = await pool.query(`
      SELECT 
        COUNT(*) as total_verifications,
        COUNT(*) FILTER (WHERE status = 'verified') as approved_verifications,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_verifications,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'verified'), 0) as total_verified_amount,
        COALESCE(AVG(EXTRACT(EPOCH FROM (verification_time - submission_time))/3600) FILTER (WHERE verification_time IS NOT NULL), 0) as avg_verification_time_hours
      FROM production_submissions 
      WHERE verifier_id = $1
    `, [id]);

    // Get monthly verification counts for the last 12 months
    const monthlyStats = await pool.query(`
      SELECT 
        DATE_TRUNC('month', verification_time) as month,
        COUNT(*) as verifications_count,
        COUNT(*) FILTER (WHERE status = 'verified') as approved_count
      FROM production_submissions 
      WHERE verifier_id = $1 
      AND verification_time >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', verification_time)
      ORDER BY month DESC
    `, [id]);

    const stats = {
      verifier: verifierResult.rows[0],
      overall: verificationStats.rows[0],
      monthly: monthlyStats.rows
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get verifier stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch verifier statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

// Update verifier reputation (admin only)
router.patch('/:id/reputation', authenticateToken, requireRole('admin'), validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { reputation_score, reason } = req.body;

    if (typeof reputation_score !== 'number' || reputation_score < 0 || reputation_score > 100) {
      return res.status(400).json({
        error: 'Reputation score must be between 0 and 100',
        code: 'INVALID_REPUTATION_SCORE'
      });
    }

    // Get current verifier data
    const currentResult = await pool.query(
      'SELECT * FROM verifiers WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Verifier not found',
        code: 'VERIFIER_NOT_FOUND'
      });
    }

    // Update reputation score
    const result = await pool.query(`
      UPDATE verifiers 
      SET reputation_score = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [reputation_score, id]);

    // Log reputation change
    await auditLog(
      req.user.id,
      'verifier_reputation_updated',
      'verifier',
      id,
      { reputation_score: currentResult.rows[0].reputation_score },
      { reputation_score, reason },
      req
    );

    res.json({
      message: 'Verifier reputation updated successfully',
      verifier: result.rows[0]
    });

  } catch (error) {
    console.error('Verifier reputation update error:', error);
    res.status(500).json({
      error: 'Failed to update verifier reputation',
      code: 'REPUTATION_UPDATE_ERROR'
    });
  }
});

// Activate/deactivate verifier (admin only)
router.patch('/:id/status', authenticateToken, requireRole('admin'), validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({
        error: 'is_active must be boolean',
        code: 'INVALID_STATUS'
      });
    }

    // Get current verifier data
    const currentResult = await pool.query(
      'SELECT * FROM verifiers WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Verifier not found',
        code: 'VERIFIER_NOT_FOUND'
      });
    }

    // Update status
    const result = await pool.query(`
      UPDATE verifiers 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [is_active, id]);

    // Log status change
    await auditLog(
      req.user.id,
      is_active ? 'verifier_activated' : 'verifier_deactivated',
      'verifier',
      id,
      { is_active: currentResult.rows[0].is_active },
      { is_active },
      req
    );

    res.json({
      message: `Verifier ${is_active ? 'activated' : 'deactivated'} successfully`,
      verifier: result.rows[0]
    });

  } catch (error) {
    console.error('Verifier status update error:', error);
    res.status(500).json({
      error: 'Failed to update verifier status',
      code: 'STATUS_UPDATE_ERROR'
    });
  }
});

module.exports = router;
