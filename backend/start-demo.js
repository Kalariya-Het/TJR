const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(morgan('combined'));

// Mock database for demo
const mockDatabase = {
  users: [
    {
      id: '1',
      email: 'admin@greenhydrogen.com',
      role: 'admin',
      wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      first_name: 'System',
      last_name: 'Administrator',
      is_verified: true,
      kyc_status: 'approved'
    },
    {
      id: '2',
      email: 'producer1@solar.com',
      role: 'producer',
      wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      first_name: 'Hans',
      last_name: 'Mueller',
      company_name: 'Solar Hydrogen GmbH',
      is_verified: true,
      kyc_status: 'approved'
    }
  ],
  producers: [
    {
      id: '1',
      user_id: '2',
      wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      plant_id: 'SOLAR-PLANT-V2-001',
      plant_name: 'Munich Solar Hydrogen Facility',
      location: 'Munich, Germany',
      renewable_source: 'Solar',
      capacity_kg_per_month: 5000,
      is_verified: true
    }
  ],
  submissions: [
    {
      id: '1',
      producer_id: '1',
      data_hash: '0x16ad23f5589cf38dbe63026daa8196ff9c430b1db088e00940ce7971bbfd3d23',
      plant_id: 'SOLAR-PLANT-V2-001',
      amount: '1000000000000000000000',
      status: 'verified',
      verification_time: new Date().toISOString()
    }
  ]
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'demo',
    database: 'mock',
    blockchain: {
      oracle: process.env.ORACLE_CONTRACT_ADDRESS,
      credit: process.env.CREDIT_CONTRACT_ADDRESS,
      marketplace: process.env.MARKETPLACE_CONTRACT_ADDRESS
    }
  });
});

// Demo API endpoints
app.get('/api/auth/profile', (req, res) => {
  res.json({
    user: mockDatabase.users[0],
    message: 'Demo mode - using mock data'
  });
});

app.get('/api/producers', (req, res) => {
  res.json({
    producers: mockDatabase.producers,
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    message: 'Demo mode - using mock data'
  });
});

app.get('/api/submissions', (req, res) => {
  res.json({
    submissions: mockDatabase.submissions,
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    message: 'Demo mode - using mock data'
  });
});

app.get('/api/admin/dashboard', (req, res) => {
  res.json({
    users: {
      total_users: 2,
      producers: 1,
      verifiers: 1,
      active_users: 2,
      verified_users: 2
    },
    production: {
      total_submissions: 1,
      verified_submissions: 1,
      pending_submissions: 0,
      total_verified_production: '1000000000000000000000'
    },
    credits: {
      total_batches: 1,
      total_credits_issued: '1000000000000000000000',
      total_retired_credits: '0'
    },
    message: 'Demo mode - using mock data'
  });
});

// Catch all for API routes
app.use('/api/*', (req, res) => {
  res.json({
    message: 'Demo API endpoint',
    method: req.method,
    path: req.path,
    note: 'This is a demo server with mock data. Full database integration available when PostgreSQL is configured.'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    available_endpoints: [
      'GET /health',
      'GET /api/auth/profile',
      'GET /api/producers',
      'GET /api/submissions',
      'GET /api/admin/dashboard'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Demo server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Green Hydrogen Backend Demo Server running on port ${PORT}`);
  console.log(`📊 Environment: Demo Mode (Mock Data)`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Demo: http://localhost:${PORT}/api/admin/dashboard`);
  console.log('\n📋 Available Demo Endpoints:');
  console.log('  - GET /health - System health check');
  console.log('  - GET /api/auth/profile - User profile demo');
  console.log('  - GET /api/producers - Producers list demo');
  console.log('  - GET /api/submissions - Submissions demo');
  console.log('  - GET /api/admin/dashboard - Admin dashboard demo');
  console.log('\n💡 To use full database features:');
  console.log('  1. Install PostgreSQL or use Docker: docker-compose up -d postgres');
  console.log('  2. Run migrations: npm run migrate');
  console.log('  3. Seed data: npm run seed');
  console.log('  4. Start full server: npm run dev');
});

module.exports = app;
