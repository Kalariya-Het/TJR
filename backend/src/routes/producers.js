const express = require('express');
const { ethers } = require('ethers');
const { pool } = require('../config/database');
const { authenticateToken, requireRole, requireKYCVerification } = require('../middleware/auth');
const { validateProducerRegistration, validateProductionSubmission, validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get all producers (admin only)
router.get('/', authenticateToken, requireRole('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    const result = await pool.query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.company_name, u.is_verified as user_verified
      FROM producers p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.${sort} ${order}
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM producers');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      producers: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get producers error:', error);
    res.status(500).json({
      error: 'Failed to fetch producers',
      code: 'FETCH_PRODUCERS_ERROR'
    });
  }
});

// Get producer by ID
router.get('/:id', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.*, u.email, u.first_name, u.last_name, u.company_name, u.is_verified as user_verified
      FROM producers p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Producer not found',
        code: 'PRODUCER_NOT_FOUND'
      });
    }

    const producer = result.rows[0];

    // Check authorization - admin or own producer
    if (req.user.role !== 'admin' && req.user.id !== producer.user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    res.json({ producer });

  } catch (error) {
    console.error('Get producer error:', error);
    res.status(500).json({
      error: 'Failed to fetch producer',
      code: 'FETCH_PRODUCER_ERROR'
    });
  }
});

// Register new producer
router.post('/', authenticateToken, requireRole(['admin', 'producer']), requireKYCVerification, validateProducerRegistration, async (req, res) => {
  try {
    const {
      plant_id,
      plant_name,
      location,
      country,
      renewable_source,
      capacity_kg_per_month,
      monthly_production_limit,
      certification_body,
      certification_number
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

    // Check if producer already exists
    const existingProducer = await pool.query(
      'SELECT id FROM producers WHERE plant_id = $1 OR wallet_address = $2',
      [plant_id, wallet_address]
    );

    if (existingProducer.rows.length > 0) {
      return res.status(409).json({
        error: 'Producer already exists with this plant ID or wallet address',
        code: 'PRODUCER_EXISTS'
      });
    }

    // Insert new producer
    const result = await pool.query(`
      INSERT INTO producers (
        user_id, wallet_address, plant_id, plant_name, location, country, 
        renewable_source, capacity_kg_per_month, monthly_production_limit,
        certification_body, certification_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      user_id, wallet_address, plant_id, plant_name, location, country,
      renewable_source, capacity_kg_per_month, monthly_production_limit,
      certification_body, certification_number
    ]);

    const producer = result.rows[0];

    // Log producer registration
    await auditLog(
      req.user.id,
      'producer_registered',
      'producer',
      producer.id,
      null,
      producer,
      req
    );

    res.status(201).json({
      message: 'Producer registered successfully',
      producer
    });

  } catch (error) {
    console.error('Producer registration error:', error);
    res.status(500).json({
      error: 'Failed to register producer',
      code: 'PRODUCER_REGISTRATION_ERROR'
    });
  }
});

// Update producer
router.put('/:id', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plant_name,
      location,
      country,
      capacity_kg_per_month,
      certification_body,
      certification_number
    } = req.body;

    // Get current producer data
    const currentResult = await pool.query(
      'SELECT * FROM producers WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Producer not found',
        code: 'PRODUCER_NOT_FOUND'
      });
    }

    const currentProducer = currentResult.rows[0];

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== currentProducer.user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Update producer
    const result = await pool.query(`
      UPDATE producers 
      SET plant_name = $1, location = $2, country = $3, capacity_kg_per_month = $4,
          certification_body = $5, certification_number = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `, [plant_name, location, country, capacity_kg_per_month, certification_body, certification_number, id]);

    // Log producer update
    await auditLog(
      req.user.id,
      'producer_updated',
      'producer',
      id,
      currentProducer,
      result.rows[0],
      req
    );

    res.json({
      message: 'Producer updated successfully',
      producer: result.rows[0]
    });

  } catch (error) {
    console.error('Producer update error:', error);
    res.status(500).json({
      error: 'Failed to update producer',
      code: 'PRODUCER_UPDATE_ERROR'
    });
  }
});

// Get producer's production submissions
router.get('/:id/submissions', authenticateToken, validateUUID, validatePagination, async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    // Check if producer exists and user has access
    const producerResult = await pool.query(
      'SELECT user_id FROM producers WHERE id = $1',
      [id]
    );

    if (producerResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Producer not found',
        code: 'PRODUCER_NOT_FOUND'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== producerResult.rows[0].user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    let query = `
      SELECT ps.*, v.organization_name as verifier_name
      FROM production_submissions ps
      LEFT JOIN verifiers v ON ps.verifier_id = v.id
      WHERE ps.producer_id = $1
    `;
    const params = [id];

    if (status) {
      query += ' AND ps.status = $2';
      params.push(status);
    }

    query += ' ORDER BY ps.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = status 
      ? 'SELECT COUNT(*) FROM production_submissions WHERE producer_id = $1 AND status = $2'
      : 'SELECT COUNT(*) FROM production_submissions WHERE producer_id = $1';
    const countParams = status ? [id, status] : [id];
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
    console.error('Get producer submissions error:', error);
    res.status(500).json({
      error: 'Failed to fetch submissions',
      code: 'FETCH_SUBMISSIONS_ERROR'
    });
  }
});

// Submit production data
router.post('/:id/submissions', authenticateToken, requireRole('producer'), requireKYCVerification, validateUUID, validateProductionSubmission, async (req, res) => {
  try {
    const { id } = req.params;
    const { plant_id, amount, production_time, ipfs_hash } = req.body;

    // Verify producer ownership
    const producerResult = await pool.query(
      'SELECT user_id, plant_id as producer_plant_id, monthly_production_limit, is_verified FROM producers WHERE id = $1',
      [id]
    );

    if (producerResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Producer not found',
        code: 'PRODUCER_NOT_FOUND'
      });
    }

    const producer = producerResult.rows[0];

    // Check authorization
    if (req.user.id !== producer.user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Verify producer is verified
    if (!producer.is_verified) {
      return res.status(403).json({
        error: 'Producer not verified',
        code: 'PRODUCER_NOT_VERIFIED'
      });
    }

    // Verify plant ID matches
    if (plant_id !== producer.producer_plant_id) {
      return res.status(400).json({
        error: 'Plant ID mismatch',
        code: 'PLANT_ID_MISMATCH'
      });
    }

    // Check monthly production limit
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyProductionResult = await pool.query(`
      SELECT COALESCE(SUM(amount::bigint), 0) as monthly_total
      FROM production_submissions 
      WHERE producer_id = $1 AND DATE_TRUNC('month', production_time) = DATE_TRUNC('month', $2::timestamp)
      AND status = 'verified'
    `, [id, production_time]);

    const monthlyTotal = parseInt(monthlyProductionResult.rows[0].monthly_total);
    const amountBigInt = BigInt(amount);
    const limitBigInt = BigInt(producer.monthly_production_limit);

    if (BigInt(monthlyTotal) + amountBigInt > limitBigInt) {
      return res.status(400).json({
        error: 'Monthly production limit exceeded',
        code: 'MONTHLY_LIMIT_EXCEEDED',
        details: {
          limit: producer.monthly_production_limit,
          current: monthlyTotal.toString(),
          requested: amount
        }
      });
    }

    // Generate data hash to match the smart contract
    const dataHash = ethers.solidityPackedKeccak256(
      ['address', 'string', 'uint256', 'uint256', 'string'],
      [producer.wallet_address, plant_id, amount, production_time, ipfs_hash]
    );

    // Insert production submission
    const result = await pool.query(`
      INSERT INTO production_submissions (
        producer_id, data_hash, plant_id, amount, production_time, 
        ipfs_hash, verification_fee, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      id, dataHash, plant_id, amount, production_time,
      ipfs_hash, '10000000000000000', 'pending' // 0.01 ETH verification fee
    ]);

    const submission = result.rows[0];

    // Log submission
    await auditLog(
      req.user.id,
      'production_submitted',
      'production_submission',
      submission.id,
      null,
      submission,
      req
    );

    res.status(201).json({
      message: 'Production data submitted successfully',
      submission
    });

  } catch (error) {
    console.error('Production submission error:', error);
    res.status(500).json({
      error: 'Failed to submit production data',
      code: 'SUBMISSION_ERROR'
    });
  }
});

// Get producer statistics
router.get('/:id/stats', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if producer exists and user has access
    const producerResult = await pool.query(
      'SELECT user_id, total_produced, monthly_production_limit FROM producers WHERE id = $1',
      [id]
    );

    if (producerResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Producer not found',
        code: 'PRODUCER_NOT_FOUND'
      });
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== producerResult.rows[0].user_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Get submission statistics
    const submissionStats = await pool.query(`
      SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status = 'verified') as verified_submissions,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_submissions,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'verified'), 0) as total_verified_amount
      FROM production_submissions 
      WHERE producer_id = $1
    `, [id]);

    // Get monthly production for current month
    const currentMonthStats = await pool.query(`
      SELECT COALESCE(SUM(amount::bigint), 0) as current_month_production
      FROM production_submissions 
      WHERE producer_id = $1 
      AND DATE_TRUNC('month', production_time) = DATE_TRUNC('month', NOW())
      AND status = 'verified'
    `, [id]);

    // Get credit batch statistics
    const creditStats = await pool.query(`
      SELECT 
        COUNT(*) as total_batches,
        COALESCE(SUM(amount::bigint), 0) as total_credits_issued,
        COUNT(*) FILTER (WHERE is_retired = true) as retired_batches,
        COALESCE(SUM(amount::bigint) FILTER (WHERE is_retired = true), 0) as total_retired_credits
      FROM credit_batches 
      WHERE producer_id = $1
    `, [id]);

    const stats = {
      producer: producerResult.rows[0],
      submissions: submissionStats.rows[0],
      current_month: currentMonthStats.rows[0],
      credits: creditStats.rows[0]
    };

    res.json({ stats });

  } catch (error) {
    console.error('Get producer stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch producer statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

// Verify/unverify producer (admin only)
router.patch('/:id/verification', authenticateToken, requireRole('admin'), validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    if (typeof is_verified !== 'boolean') {
      return res.status(400).json({
        error: 'is_verified must be boolean',
        code: 'INVALID_VERIFICATION_STATUS'
      });
    }

    // Get current producer data
    const currentResult = await pool.query(
      'SELECT * FROM producers WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Producer not found',
        code: 'PRODUCER_NOT_FOUND'
      });
    }

    // Update verification status
    const result = await pool.query(`
      UPDATE producers 
      SET is_verified = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [is_verified, id]);

    // Log verification change
    await auditLog(
      req.user.id,
      is_verified ? 'producer_verified' : 'producer_unverified',
      'producer',
      id,
      { is_verified: currentResult.rows[0].is_verified },
      { is_verified },
      req
    );

    res.json({
      message: `Producer ${is_verified ? 'verified' : 'unverified'} successfully`,
      producer: result.rows[0]
    });

  } catch (error) {
    console.error('Producer verification error:', error);
    res.status(500).json({
      error: 'Failed to update producer verification',
      code: 'VERIFICATION_UPDATE_ERROR'
    });
  }
});

module.exports = router;
