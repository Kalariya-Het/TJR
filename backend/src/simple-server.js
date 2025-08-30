const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json());

// Mock data for demo
const mockData = {
  producers: [
    {
      id: 1,
      user_id: 1,
      plant_name: 'Solar Farm Alpha',
      location: 'California, USA',
      renewable_source: 'Solar',
      capacity_mw: 100,
      monthly_limit: 1000,
      kyc_verified: true,
      wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      created_at: new Date('2024-01-01')
    },
    {
      id: 2,
      user_id: 2,
      plant_name: 'Wind Farm Beta',
      location: 'Texas, USA',
      renewable_source: 'Wind',
      capacity_mw: 150,
      monthly_limit: 1500,
      kyc_verified: true,
      wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      created_at: new Date('2024-01-02')
    }
  ],
  marketplace_listings: [
    {
      id: 1,
      listing_id: 1,
      seller_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      amount: '100',
      price_per_unit: '0.00001',
      is_active: true,
      created_at: new Date('2024-08-30')
    },
    {
      id: 2,
      listing_id: 2,
      seller_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      amount: '50',
      price_per_unit: '0.00002',
      is_active: true,
      created_at: new Date('2024-08-30')
    },
    {
      id: 3,
      listing_id: 3,
      seller_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      amount: '10',
      price_per_unit: '0.000001',
      is_active: true,
      created_at: new Date('2024-08-30')
    }
  ]
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'mock',
    blockchain: {
      credit: process.env.CREDIT_CONTRACT_ADDRESS,
      marketplace: process.env.MARKETPLACE_CONTRACT_ADDRESS
    }
  });
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Green Hydrogen Credit System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      producers: '/api/producers',
      marketplace: '/api/marketplace/listings',
      stats: '/api/marketplace/stats'
    },
    note: 'Running in demo mode with mock data'
  });
});

app.get('/api/producers', (req, res) => {
  res.json({
    success: true,
    data: mockData.producers,
    count: mockData.producers.length
  });
});

app.get('/api/marketplace/listings', (req, res) => {
  res.json({
    success: true,
    data: mockData.marketplace_listings,
    count: mockData.marketplace_listings.length
  });
});

app.get('/api/marketplace/stats', (req, res) => {
  const activeListings = mockData.marketplace_listings.filter(l => l.is_active);
  const totalVolume = activeListings.reduce((sum, listing) => sum + parseFloat(listing.amount), 0);
  
  res.json({
    success: true,
    data: {
      totalListings: mockData.marketplace_listings.length,
      activeListings: activeListings.length,
      totalVolume: totalVolume,
      platformFee: 2.5
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Green Hydrogen Credit System API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: 'mock',
    endpoints: {
      health: '/health',
      api: '/api',
      producers: '/api/producers',
      marketplace: '/api/marketplace/listings'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    code: error.code || 'INTERNAL_SERVER_ERROR'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Green Hydrogen API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔄 Using mock database (demo mode)`);
});
