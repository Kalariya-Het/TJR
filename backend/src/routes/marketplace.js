const express = require('express');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validateMarketplaceListing, validatePagination, validateUUID } = require('../middleware/validation');
const { auditLog } = require('../middleware/logging');

const router = express.Router();

// Get all marketplace listings
router.get('/listings', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || 'active';
    const renewable_source = req.query.renewable_source;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    let query = `
      SELECT ml.*, u.company_name as seller_company
      FROM marketplace_listings ml
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.status = $1
    `;
    const params = [status];

    if (renewable_source) {
      query += ` AND ml.renewable_source = $${params.length + 1}`;
      params.push(renewable_source);
    }

    query += ` ORDER BY ml.${sort} ${order} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Count query
    let countQuery = 'SELECT COUNT(*) FROM marketplace_listings ml WHERE ml.status = $1';
    const countParams = [status];

    if (renewable_source) {
      countQuery += ` AND ml.renewable_source = $${countParams.length + 1}`;
      countParams.push(renewable_source);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      listings: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get marketplace listings error:', error);
    res.status(500).json({
      error: 'Failed to fetch marketplace listings',
      code: 'FETCH_LISTINGS_ERROR'
    });
  }
});

// Get listing by ID
router.get('/listings/:id', validateUUID, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT ml.*, u.company_name as seller_company, u.email as seller_email
      FROM marketplace_listings ml
      JOIN users u ON ml.seller_id = u.id
      WHERE ml.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Listing not found',
        code: 'LISTING_NOT_FOUND'
      });
    }

    res.json({ listing: result.rows[0] });

  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      error: 'Failed to fetch listing',
      code: 'FETCH_LISTING_ERROR'
    });
  }
});

// Create new marketplace listing
router.post('/listings', authenticateToken, validateMarketplaceListing, async (req, res) => {
  try {
    const {
      amount,
      price_per_credit,
      renewable_source,
      production_date,
      location,
      certification,
      expires_at
    } = req.body;

    if (!req.user.wallet_address) {
      return res.status(400).json({
        error: 'Wallet address required',
        code: 'WALLET_ADDRESS_REQUIRED'
      });
    }

    const total_price = BigInt(amount) * BigInt(price_per_credit);
    const listing_id = Math.floor(Math.random() * 1000000); // Simplified ID generation

    const result = await pool.query(`
      INSERT INTO marketplace_listings (
        listing_id, seller_id, seller_address, amount, price_per_credit, total_price,
        renewable_source, production_date, location, certification, expires_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      listing_id, req.user.id, req.user.wallet_address, amount, price_per_credit,
      total_price.toString(), renewable_source, production_date, location, certification, expires_at
    ]);

    // Log listing creation
    await auditLog(
      req.user.id,
      'marketplace_listing_created',
      'marketplace_listing',
      result.rows[0].id,
      null,
      result.rows[0],
      req
    );

    res.status(201).json({
      message: 'Marketplace listing created successfully',
      listing: result.rows[0]
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      error: 'Failed to create listing',
      code: 'CREATE_LISTING_ERROR'
    });
  }
});

// Update marketplace listing
router.put('/listings/:id', authenticateToken, validateUUID, async (req, res) => {
  try {
    const { id } = req.params;
    const { price_per_credit, expires_at, status } = req.body;

    // Get current listing
    const currentResult = await pool.query(
      'SELECT * FROM marketplace_listings WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Listing not found',
        code: 'LISTING_NOT_FOUND'
      });
    }

    const currentListing = currentResult.rows[0];

    // Check authorization
    if (req.user.role !== 'admin' && req.user.id !== currentListing.seller_id) {
      return res.status(403).json({
        error: 'Access denied',
        code: 'ACCESS_DENIED'
      });
    }

    // Update listing
    const total_price = price_per_credit ? 
      BigInt(currentListing.amount) * BigInt(price_per_credit) : 
      currentListing.total_price;

    const result = await pool.query(`
      UPDATE marketplace_listings 
      SET price_per_credit = COALESCE($1, price_per_credit),
          total_price = $2,
          expires_at = COALESCE($3, expires_at),
          status = COALESCE($4, status),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [price_per_credit, total_price.toString(), expires_at, status, id]);

    // Log listing update
    await auditLog(
      req.user.id,
      'marketplace_listing_updated',
      'marketplace_listing',
      id,
      currentListing,
      result.rows[0],
      req
    );

    res.json({
      message: 'Listing updated successfully',
      listing: result.rows[0]
    });

  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      error: 'Failed to update listing',
      code: 'UPDATE_LISTING_ERROR'
    });
  }
});

// Record marketplace purchase
router.post('/purchases', authenticateToken, async (req, res) => {
  try {
    const {
      listing_id,
      amount,
      price_per_credit,
      transaction_hash,
      block_number
    } = req.body;

    if (!req.user.wallet_address) {
      return res.status(400).json({
        error: 'Wallet address required',
        code: 'WALLET_ADDRESS_REQUIRED'
      });
    }

    // Get listing details
    const listingResult = await pool.query(
      'SELECT * FROM marketplace_listings WHERE listing_id = $1 AND status = $2',
      [listing_id, 'active']
    );

    if (listingResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Active listing not found',
        code: 'LISTING_NOT_FOUND'
      });
    }

    const listing = listingResult.rows[0];
    const total_price = BigInt(amount) * BigInt(price_per_credit);

    // Begin transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record purchase
      await client.query(`
        INSERT INTO marketplace_purchases (
          listing_id, buyer_id, buyer_address, seller_address,
          amount, price_per_credit, total_price, transaction_hash, block_number
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        listing_id, req.user.id, req.user.wallet_address, listing.seller_address,
        amount, price_per_credit, total_price.toString(), transaction_hash, block_number
      ]);

      // Update listing status if fully purchased
      if (BigInt(amount) >= BigInt(listing.amount)) {
        await client.query(
          'UPDATE marketplace_listings SET status = $1, updated_at = NOW() WHERE listing_id = $2',
          ['sold', listing_id]
        );
      } else {
        // Reduce available amount
        const newAmount = BigInt(listing.amount) - BigInt(amount);
        await client.query(
          'UPDATE marketplace_listings SET amount = $1, updated_at = NOW() WHERE listing_id = $2',
          [newAmount.toString(), listing_id]
        );
      }

      // Record transaction
      await client.query(`
        INSERT INTO credit_transactions (
          transaction_hash, transaction_type, from_address, to_address,
          amount, block_number
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        transaction_hash, 'transfer', listing.seller_address, req.user.wallet_address,
        amount, block_number
      ]);

      await client.query('COMMIT');

      // Log purchase
      await auditLog(
        req.user.id,
        'marketplace_purchase',
        'marketplace_purchase',
        transaction_hash,
        null,
        { listing_id, amount, price_per_credit, total_price: total_price.toString() },
        req
      );

      res.json({
        message: 'Purchase recorded successfully',
        transaction_hash,
        amount,
        total_price: total_price.toString()
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Record purchase error:', error);
    res.status(500).json({
      error: 'Failed to record purchase',
      code: 'RECORD_PURCHASE_ERROR'
    });
  }
});

// Get user's marketplace activity
router.get('/activity', authenticateToken, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    if (!req.user.wallet_address) {
      return res.status(400).json({
        error: 'Wallet address required',
        code: 'WALLET_ADDRESS_REQUIRED'
      });
    }

    // Get user's listings
    const listingsResult = await pool.query(`
      SELECT 'listing' as type, id, listing_id, amount, price_per_credit, 
             status, created_at, updated_at
      FROM marketplace_listings
      WHERE seller_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    // Get user's purchases
    const purchasesResult = await pool.query(`
      SELECT 'purchase' as type, id, listing_id, amount, price_per_credit,
             total_price, transaction_hash, purchase_time as created_at
      FROM marketplace_purchases
      WHERE buyer_id = $1
      ORDER BY purchase_time DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    // Combine and sort by date
    const activity = [...listingsResult.rows, ...purchasesResult.rows]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    res.json({
      activity,
      pagination: {
        page,
        limit,
        total: listingsResult.rows.length + purchasesResult.rows.length,
        pages: Math.ceil((listingsResult.rows.length + purchasesResult.rows.length) / limit)
      }
    });

  } catch (error) {
    console.error('Get marketplace activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch marketplace activity',
      code: 'FETCH_ACTIVITY_ERROR'
    });
  }
});

// Get marketplace statistics
router.get('/stats', async (req, res) => {
  try {
    // Overall marketplace stats
    const overallStats = await pool.query(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(*) FILTER (WHERE status = 'active') as active_listings,
        COUNT(*) FILTER (WHERE status = 'sold') as sold_listings,
        COALESCE(SUM(amount::bigint) FILTER (WHERE status = 'active'), 0) as total_available_credits,
        COALESCE(AVG(price_per_credit::bigint), 0) as avg_price_per_credit
      FROM marketplace_listings
    `);

    // Purchase statistics
    const purchaseStats = await pool.query(`
      SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(amount::bigint), 0) as total_credits_traded,
        COALESCE(SUM(total_price::bigint), 0) as total_volume,
        COALESCE(AVG(price_per_credit::bigint), 0) as avg_purchase_price
      FROM marketplace_purchases
    `);

    // Monthly trading volume
    const monthlyVolume = await pool.query(`
      SELECT 
        DATE_TRUNC('month', purchase_time) as month,
        COUNT(*) as purchases,
        COALESCE(SUM(amount::bigint), 0) as credits_traded,
        COALESCE(SUM(total_price::bigint), 0) as volume
      FROM marketplace_purchases 
      WHERE purchase_time >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', purchase_time)
      ORDER BY month DESC
    `);

    // Price trends by renewable source
    const priceBySource = await pool.query(`
      SELECT 
        renewable_source,
        COUNT(*) as listings,
        COALESCE(AVG(price_per_credit::bigint), 0) as avg_price,
        COALESCE(SUM(amount::bigint), 0) as total_credits
      FROM marketplace_listings
      WHERE renewable_source IS NOT NULL
      GROUP BY renewable_source
      ORDER BY avg_price DESC
    `);

    res.json({
      overall: overallStats.rows[0],
      purchases: purchaseStats.rows[0],
      monthly_volume: monthlyVolume.rows,
      price_by_source: priceBySource.rows
    });

  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch marketplace statistics',
      code: 'FETCH_STATS_ERROR'
    });
  }
});

module.exports = router;
