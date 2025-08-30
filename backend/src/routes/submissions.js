const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireKYCVerification } = require('../middleware/auth');
const { validateVerification, validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get all production submissions (admin only)
router.get('/', authenticateToken, requireRole('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    let query = `
      SELECT ps.*, p.plant_name, p.location as plant_location, 
             u.email as producer_email, v.organization_name as verifier_name
      FROM production_submissions ps
      JOIN producers p ON ps.producer_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN verifiers v ON ps.verifier_id = v.id
    `;
    const params = [];

    if (status) {
      query += ' WHERE ps.status = $1';
      params.push(status);
    }

    query += ` ORDER BY ps.${sort} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = status 
      ? 'SELECT COUNT(*) FROM production_submissions WHERE status = $1'
      : 'SELECT COUNT(*) FROM production_submissions';
    const countParams = status ? [status] : [];
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      submissions: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions',
      code: 'FETCH_SUBMISSIONS_ERROR'
    });
  }
});

// Get pending submissions for verifiers
router.get('/pending', authenticateToken, requireRole('verifier'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(`
      SELECT ps.*, p.plant_name, p.location as plant_location, p.renewable_source,
             u.email as producer_email, u.company_name as producer_company
      FROM production_submissions ps
      JOIN producers p ON ps.producer_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE ps.status = 'pending'
      ORDER BY ps.submission_time ASC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM production_submissions WHERE status = $1',
      ['pending']
    );
    const total = parseInt(countResult.rows[0].count);

    res.json({
      submissions: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get pending submissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch pending submissions',
      code: 'FETCH_PENDING_ERROR'
    });
  }
});

// Get submission by ID
router.get('/:id', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT ps.*, p.plant_name, p.location as plant_location, p.renewable_source,
             u.email as producer_email, u.company_name as producer_company,
             v.organization_name as verifier_name
      FROM production_submissions ps
      JOIN producers p ON ps.producer_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN verifiers v ON ps.verifier_id = v.id
      WHERE ps.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND'
      });
    }

    const submission = result.rows[0];

    // Check authorization
    const hasAccess = req.user.role === 'admin' || 
                     req.user.role === 'verifier' ||
                     (req.user.role === 'producer' && submission.producer_email === req.user.email);

    if (!hasAccess) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({ submission });

  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      error: 'Failed to fetch submission',
      code: 'FETCH_SUBMISSION_ERROR'
    });
  }
});

// Verify production submission
router.post('/:id/verify', authenticateToken, requireRole('verifier'), requireKYCVerification, validateUUID, validateVerification, async (req, res) => {
  try {
    const { id } = req.params;
    const { data_hash, is_valid, verification_notes } = req.body;

    // Get verifier info
    const verifierResult = await pool.query(
      'SELECT id as verifier_id FROM verifiers WHERE user_id = $1 AND is_active = true',
      [req.user.id]
    );

    if (verifierResult.rows.length === 0) {
      return res.status(403).json({
        error: 'Verifier not found or inactive',
        code: 'VERIFIER_NOT_FOUND'
      });
    }

    const verifierId = verifierResult.rows[0].verifier_id;

    // Get submission details
    const submissionResult = await pool.query(
      'SELECT * FROM production_submissions WHERE id = $1 AND data_hash = $2',
      [id, data_hash]
    );

    if (submissionResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Submission not found or data hash mismatch',
        code: 'SUBMISSION_NOT_FOUND'
      });
    }

    const submission = submissionResult.rows[0];

    if (submission.status !== 'pending') {
      return res.status(400).json({
        error: 'Submission already verified',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Update submission with verification
    const status = is_valid ? 'verified' : 'rejected';
    const result = await pool.query(`
      UPDATE production_submissions 
      SET status = $1, verifier_id = $2, verification_time = NOW(), 
          verification_notes = $3, is_verified = $4, updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [status, verifierId, verification_notes, is_valid, id]);

    // Update verifier statistics
    await pool.query(`
      UPDATE verifiers 
      SET total_verifications = total_verifications + 1,
          successful_verifications = successful_verifications + $1,
          updated_at = NOW()
      WHERE id = $2
    `, [is_valid ? 1 : 0, verifierId]);

    // Log verification
    await auditLog(
      req.user.id,
      is_valid ? 'production_verified' : 'production_rejected',
      'production_submission',
      id,
      { status: 'pending' },
      { status, is_valid, verification_notes },
      req
    );

    res.json({
      message: `Production data ${is_valid ? 'verified' : 'rejected'} successfully`,
      submission: result.rows[0]
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({
      error: 'Failed to verify submission',
      code: 'VERIFICATION_ERROR'
    });
  }
});

// Get submission statistics
router.get('/stats/overview', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
        COUNT(*) FILTER (WHERE status = 'verified') as verified_submissions,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'verified'), 0) as total_verified_amount,
        COALESCE(AVG(EXTRACT(EPOCH FROM (verification_time - submission_time))/3600) FILTER (WHERE verification_time IS NOT NULL), 0) as avg_verification_time_hours
      FROM production_submissions
    `);

    // Get monthly submission trends
    const monthlyTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('month', submission_time) as month,
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status = 'verified') as verified_submissions,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'verified'), 0) as verified_amount
      FROM production_submissions 
      WHERE submission_time >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', submission_time)
      ORDER BY month DESC
    `);

    // Get top producers by verified submissions
    const topProducers = await pool.query(`
      SELECT 
        p.plant_name,
        p.location,
        COUNT(*) as verified_submissions,
        COALESCE(SUM(ps.amount::bigint), 0) as total_verified_amount
      FROM production_submissions ps
      JOIN producers p ON ps.producer_id = p.id
      WHERE ps.status = 'verified'
      GROUP BY p.id, p.plant_name, p.location
      ORDER BY verified_submissions DESC
      LIMIT 10
    `);

    res.json({
      overview: stats.rows[0],
      monthly_trends: monthlyTrends.rows,
      top_producers: topProducers.rows
    });

  } catch (error) {
    console.error('Get submission stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch submission statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

module.exports = router;
