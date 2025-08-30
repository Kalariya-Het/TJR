const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateCreditRetirement, validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get all credit batches (admin only)
router.get('/batches', authenticateToken, requireRole('admin'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'issuance_time';
    const order = req.query.order || 'desc';

    const result = await pool.query(`
      SELECT cb.*, p.plant_name, p.location as plant_location,
             u.email as producer_email, u.company_name as producer_company
      FROM credit_batches cb
      JOIN producers p ON cb.producer_id = p.id
      JOIN users u ON p.user_id = u.id
      ORDER BY cb.${sort} ${order}
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query('SELECT COUNT(*) FROM credit_batches');
    const total = parseInt(countResult.rows[0].count);

    res.json({
      batches: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get credit batches error:', error);
    res.status(500).json({
      error: 'Failed to fetch credit batches',
      code: 'FETCH_BATCHES_ERROR'
    });
  }
});

// Get credit batch by ID
router.get('/batches/:id', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT cb.*, p.plant_name, p.location as plant_location, p.renewable_source,
             u.email as producer_email, u.company_name as producer_company,
             ps.ipfs_hash as submission_ipfs_hash, ps.verification_notes
      FROM credit_batches cb
      JOIN producers p ON cb.producer_id = p.id
      JOIN users u ON p.user_id = u.id
      LEFT JOIN production_submissions ps ON cb.production_submission_id = ps.id
      WHERE cb.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Credit batch not found',
        code: 'BATCH_NOT_FOUND'
      });
    }

    res.json({ batch: result.rows[0] });

  } catch (error) {
    console.error('Get credit batch error:', error);
    res.status(500).json({
      error: 'Failed to fetch credit batch',
      code: 'FETCH_BATCH_ERROR'
    });
  }
});

// Get user's credit balance and batches
router.get('/balance/:address', authenticateToken, async (req, res) => {
  try {
    const { address } = req.params;

    // Validate Ethereum address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address',
        code: 'INVALID_ADDRESS'
      });
    }

    // Get user's credit batches (if they are a producer)
    const batchesResult = await pool.query(`
      SELECT cb.*, p.plant_name
      FROM credit_batches cb
      JOIN producers p ON cb.producer_id = p.id
      WHERE p.wallet_address = $1
      ORDER BY cb.issuance_time DESC
    `, [address]);

    // Get transaction history for this address
    const transactionsResult = await pool.query(`
      SELECT ct.*, cb.plant_id, cb.renewable_source
      FROM credit_transactions ct
      LEFT JOIN credit_batches cb ON ct.batch_id = cb.batch_id
      WHERE ct.from_address = $1 OR ct.to_address = $1
      ORDER BY ct.created_at DESC
      LIMIT 50
    `, [address]);

    // Calculate balances
    const totalIssued = batchesResult.rows.reduce((sum, batch) => 
      sum + BigInt(batch.amount), BigInt(0)
    );

    const totalRetired = batchesResult.rows
      .filter(batch => batch.is_retired)
      .reduce((sum, batch) => sum + BigInt(batch.amount), BigInt(0));

    res.json({
      address,
      balances: {
        total_issued: totalIssued.toString(),
        total_retired: totalRetired.toString(),
        available: (totalIssued - totalRetired).toString()
      },
      batches: batchesResult.rows,
      recent_transactions: transactionsResult.rows
    });

  } catch (error) {
    console.error('Get credit balance error:', error);
    res.status(500).json({
      error: 'Failed to fetch credit balance',
      code: 'FETCH_BALANCE_ERROR'
    });
  }
});

// Retire credits
router.post('/retire', authenticateToken, validateCreditRetirement, async (req, res) => {
  try {
    const { amount, reason, batch_ids } = req.body;

    if (!req.user.wallet_address) {
      return res.status(400).json({
        error: 'Wallet address required',
        code: 'WALLET_ADDRESS_REQUIRED'
      });
    }

    // Validate batch ownership if specific batches are provided
    if (batch_ids && batch_ids.length > 0) {
      const ownershipResult = await pool.query(`
        SELECT cb.batch_id, cb.amount, cb.is_retired
        FROM credit_batches cb
        JOIN producers p ON cb.producer_id = p.id
        WHERE cb.batch_id = ANY($1) AND p.wallet_address = $2
      `, [batch_ids, req.user.wallet_address]);

      if (ownershipResult.rows.length !== batch_ids.length) {
        return res.status(403).json({
          error: 'Invalid batch ownership',
          code: 'INVALID_BATCH_OWNERSHIP'
        });
      }

      // Check if any batches are already retired
      const retiredBatches = ownershipResult.rows.filter(batch => batch.is_retired);
      if (retiredBatches.length > 0) {
        return res.status(400).json({
          error: 'Some batches are already retired',
          code: 'BATCHES_ALREADY_RETIRED',
          retired_batches: retiredBatches.map(b => b.batch_id)
        });
      }

      // Verify total amount matches
      const totalBatchAmount = ownershipResult.rows.reduce((sum, batch) => 
        sum + BigInt(batch.amount), BigInt(0)
      );

      if (totalBatchAmount.toString() !== amount) {
        return res.status(400).json({
          error: 'Amount mismatch with selected batches',
          code: 'AMOUNT_MISMATCH'
        });
      }
    }

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Mark batches as retired
      if (batch_ids && batch_ids.length > 0) {
        await client.query(`
          UPDATE credit_batches 
          SET is_retired = true, retirement_reason = $1, retirement_time = NOW(), updated_at = NOW()
          WHERE batch_id = ANY($2)
        `, [reason, batch_ids]);
      }

      // Record retirement transaction
      const transactionHash = '0x' + require('crypto')
        .createHash('sha256')
        .update(`retirement-${req.user.wallet_address}-${amount}-${Date.now()}`)
        .digest('hex');

      await client.query(`
        INSERT INTO credit_transactions (
          transaction_hash, transaction_type, from_address, amount, reason
        )
        VALUES ($1, $2, $3, $4, $5)
      `, [transactionHash, 'retirement', req.user.wallet_address, amount, reason]);

      await client.query('COMMIT');

      // Log retirement
      await auditLog(
        req.user.id,
        'credits_retired',
        'credit_retirement',
        transactionHash,
        null,
        { amount, reason, batch_ids },
        req
      );

      res.json({
        message: 'Credits retired successfully',
        transaction_hash: transactionHash,
        amount,
        reason,
        retired_batches: batch_ids
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Credit retirement error:', error);
    res.status(500).json({
      error: 'Failed to retire credits',
      code: 'RETIREMENT_ERROR'
    });
  }
});

// Get credit statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Overall statistics
    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_batches,
        COALESCE(SUM(amount::bigint), 0) as total_credits_issued,
        COUNT(*) FILTER (WHERE is_retired = true) as retired_batches,
        COALESCE(SUM(amount::bigint) FILTER (WHERE is_retired = true), 0) as total_retired_credits,
        COUNT(DISTINCT producer_id) as active_producers
      FROM credit_batches
    `);

    // Monthly issuance trends
    const monthlyTrends = await pool.query(`
      SELECT 
        DATE_TRUNC('month', issuance_time) as month,
        COUNT(*) as batches_issued,
        COALESCE(SUM(amount::bigint), 0) as credits_issued,
        COUNT(DISTINCT producer_id) as active_producers
      FROM credit_batches 
      WHERE issuance_time >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', issuance_time)
      ORDER BY month DESC
    `);

    // By renewable source
    const sourceBreakdown = await pool.query(`
      SELECT 
        renewable_source,
        COUNT(*) as batches,
        COALESCE(SUM(amount::bigint), 0) as total_credits
      FROM credit_batches
      GROUP BY renewable_source
      ORDER BY total_credits DESC
    `);

    // Top producers
    const topProducers = await pool.query(`
      SELECT 
        p.plant_name,
        p.location,
        p.renewable_source,
        COUNT(cb.*) as batches_issued,
        COALESCE(SUM(cb.amount::bigint), 0) as total_credits
      FROM credit_batches cb
      JOIN producers p ON cb.producer_id = p.id
      GROUP BY p.id, p.plant_name, p.location, p.renewable_source
      ORDER BY total_credits DESC
      LIMIT 10
    `);

    // User-specific stats if not admin
    let userStats = null;
    if (req.user.role !== 'admin' && req.user.wallet_address) {
      const userStatsResult = await pool.query(`
        SELECT 
          COUNT(cb.*) as user_batches,
          COALESCE(SUM(cb.amount::bigint), 0) as user_total_credits,
          COUNT(cb.*) FILTER (WHERE cb.is_retired = true) as user_retired_batches,
          COALESCE(SUM(cb.amount::bigint) FILTER (WHERE cb.is_retired = true), 0) as user_retired_credits
        FROM credit_batches cb
        JOIN producers p ON cb.producer_id = p.id
        WHERE p.wallet_address = $1
      `, [req.user.wallet_address]);

      userStats = userStatsResult.rows[0];
    }

    res.json({
      overall: overallStats.rows[0],
      monthly_trends: monthlyTrends.rows,
      by_source: sourceBreakdown.rows,
      top_producers: topProducers.rows,
      ...(userStats && { user_stats: userStats })
    });

  } catch (error) {
    console.error('Get credit stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch credit statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const type = req.query.type;
    const address = req.query.address;

    let query = `
      SELECT ct.*, cb.plant_id, cb.renewable_source
      FROM credit_transactions ct
      LEFT JOIN credit_batches cb ON ct.batch_id = cb.batch_id
    `;
    const params = [];
    const conditions = [];

    if (type) {
      conditions.push(`ct.transaction_type = $${params.length + 1}`);
      params.push(type);
    }

    if (address) {
      conditions.push(`(ct.from_address = $${params.length + 1} OR ct.to_address = $${params.length + 1})`);
      params.push(address);
    } else if (req.user.role !== 'admin' && req.user.wallet_address) {
      // Non-admin users can only see their own transactions
      conditions.push(`(ct.from_address = $${params.length + 1} OR ct.to_address = $${params.length + 1})`);
      params.push(req.user.wallet_address);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY ct.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count query
    let countQuery = 'SELECT COUNT(*) FROM credit_transactions ct';
    const countParams = [];
    const countConditions = [];

    if (type) {
      countConditions.push(`ct.transaction_type = $${countParams.length + 1}`);
      countParams.push(type);
    }

    if (address) {
      countConditions.push(`(ct.from_address = $${countParams.length + 1} OR ct.to_address = $${countParams.length + 1})`);
      countParams.push(address);
    } else if (req.user.role !== 'admin' && req.user.wallet_address) {
      countConditions.push(`(ct.from_address = $${countParams.length + 1} OR ct.to_address = $${countParams.length + 1})`);
      countParams.push(req.user.wallet_address);
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      transactions: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      code: 'FETCH_TRANSACTIONS_ERROR'
    });
  }
});

module.exports = router;
