const express = require('express');
const { query } = require('../config/database');
const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const dbTest = await query('SELECT NOW() as current_time');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: process.env.USE_MOCK_DATABASE === 'true' ? 'mock' : 'postgresql',
      blockchain: {
        credit: process.env.CREDIT_CONTRACT_ADDRESS,
        marketplace: process.env.MARKETPLACE_CONTRACT_ADDRESS
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Get all producers
router.get('/producers', async (req, res) => {
  try {
    const result = await query('SELECT * FROM producers ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user by wallet address (public endpoint for profile fetching)
router.get('/users/by-wallet/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const result = await query(
      'SELECT id, email, role, wallet_address, first_name, last_name, company_name, is_active, is_verified, kyc_status FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found for this wallet address',
        code: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Get user by wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user by wallet address',
      code: 'FETCH_USER_BY_WALLET_ERROR'
    });
  }
});

// Get marketplace listings
router.get('/marketplace/listings', async (req, res) => {
  try {
    const result = await query('SELECT * FROM marketplace_listings WHERE is_active = true ORDER BY created_at DESC');
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get marketplace stats
router.get('/marketplace/stats', async (req, res) => {
  try {
    const totalListings = await query('SELECT COUNT(*) as count FROM marketplace_listings');
    const activeListings = await query('SELECT COUNT(*) as count FROM marketplace_listings WHERE is_active = true');
    const totalVolume = await query('SELECT SUM(CAST(amount as DECIMAL)) as volume FROM marketplace_listings WHERE is_active = true');
    
    res.json({
      success: true,
      data: {
        totalListings: parseInt(totalListings.rows[0].count),
        activeListings: parseInt(activeListings.rows[0].count),
        totalVolume: parseFloat(totalVolume.rows[0].volume || 0),
        platformFee: 2.5
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Demo endpoint for testing
router.get('/', (req, res) => {
  res.json({
    message: 'Green Hydrogen Credit System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      producers: '/api/producers',
      marketplace: '/api/marketplace/listings',
      stats: '/api/marketplace/stats'
    },
    note: process.env.USE_MOCK_DATABASE === 'true' 
      ? 'Running in demo mode with mock data' 
      : 'Connected to PostgreSQL database'
  });
});

module.exports = router;
