const { Pool } = require('pg');
require('dotenv').config();

// Check if we should use mock database
if (process.env.USE_MOCK_DATABASE === 'true') {
  console.log('🔄 Using mock database (demo mode)');
  module.exports = require('./mock-database');
  return;
}

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'green_hydrogen_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a client from the pool
const getClient = async () => {
  return await pool.connect();
};

// Helper function to begin transaction
const beginTransaction = async () => {
  const client = await getClient();
  await client.query('BEGIN');
  return client;
};

// Helper function to commit transaction
const commitTransaction = async (client) => {
  await client.query('COMMIT');
  client.release();
};

// Helper function to rollback transaction
const rollbackTransaction = async (client) => {
  await client.query('ROLLBACK');
  client.release();
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, closing database pool...');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = {
  pool,
  query,
  getClient,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};
