const express = require('express');
const { pool } = require('../../config/database');
const { authenticateToken, requireRole } = require('../../middleware/auth');
const { validateUUID, validatePagination } = require('../../middleware/validation');
const { auditLog } = require('../../middleware/logging');

const router = express.Router();

// All routes in this file are protected and require admin role
router.use(authenticateToken, requireRole('admin'));

// Get all KYC submissions
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let query = 'SELECT id, email, role, first_name, last_name, company_name, kyc_status, is_verified, created_at FROM users';
    const params = [];

    if (status) {
      query += ' WHERE kyc_status = $1';
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = status ? 'SELECT COUNT(*) FROM users WHERE kyc_status = $1' : 'SELECT COUNT(*) FROM users';
    const countParams = status ? [status] : [];
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
    console.error('Get KYC submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC submissions' });
  }
});

// Get KYC submission for a single user
router.get('/:id', validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT id, email, role, first_name, last_name, company_name, phone, wallet_address, kyc_status, is_verified, created_at, updated_at FROM users WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Get KYC submission error:', error);
    res.status(500).json({ error: 'Failed to fetch KYC submission' });
  }
});

// Update KYC status for a user
router.put('/:id', validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { kyc_status, is_verified } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(kyc_status) || typeof is_verified !== 'boolean') {
      return res.status(400).json({ error: 'Invalid kyc_status or is_verified value' });
    }

    const currentResult = await pool.query('SELECT kyc_status, is_verified FROM users WHERE id = $1', [id]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await pool.query('UPDATE users SET kyc_status = $1, is_verified = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, kyc_status, is_verified', [kyc_status, is_verified, id]);

    await auditLog(req.user.id, 'kyc_status_updated', 'user', id, currentResult.rows[0], { kyc_status, is_verified }, req);

    res.json({
      message: `User KYC status updated successfully`,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Update KYC status error:', error);
    res.status(500).json({ error: 'Failed to update KYC status' });
  }
});

module.exports = router;
