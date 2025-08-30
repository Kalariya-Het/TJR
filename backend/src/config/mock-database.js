// Mock database for demo mode when PostgreSQL is not available
const mockData = {
  users: [
    {
      id: 1,
      email: 'producer1@example.com',
      role: 'producer',
      created_at: new Date('2024-01-01'),
      is_active: true
    },
    {
      id: 2,
      email: 'producer2@example.com',
      role: 'producer',
      created_at: new Date('2024-01-02'),
      is_active: true
    },
    {
      id: 3,
      email: 'verifier1@example.com',
      role: 'verifier',
      created_at: new Date('2024-01-03'),
      is_active: true
    }
  ],
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

// Mock query function
const mockQuery = async (text, params = []) => {
  console.log('Mock query:', text);
  
  // Simple query parsing for common patterns
  if (text.includes('SELECT COUNT(*) FROM users')) {
    return { rows: [{ count: mockData.users.length }] };
  }
  
  if (text.includes('SELECT COUNT(*) FROM producers')) {
    return { rows: [{ count: mockData.producers.length }] };
  }
  
  if (text.includes('SELECT * FROM producers')) {
    return { rows: mockData.producers };
  }
  
  if (text.includes('SELECT * FROM marketplace_listings')) {
    return { rows: mockData.marketplace_listings };
  }
  
  if (text.includes('SELECT NOW()')) {
    return { 
      rows: [{ 
        current_time: new Date(),
        pg_version: 'Mock PostgreSQL 14.0 (Demo Mode)'
      }] 
    };
  }
  
  // Default response
  return { rows: [], rowCount: 0 };
};

// Mock pool object
const mockPool = {
  query: mockQuery,
  connect: async () => ({
    query: mockQuery,
    release: () => {}
  }),
  on: (event, callback) => {
    if (event === 'connect') {
      console.log('Mock database connected (demo mode)');
    }
  },
  end: (callback) => {
    console.log('Mock database pool closed');
    if (callback) callback();
  }
};

module.exports = {
  pool: mockPool,
  query: mockQuery,
  getClient: async () => mockPool.connect(),
  beginTransaction: async () => mockPool.connect(),
  commitTransaction: async (client) => client.release(),
  rollbackTransaction: async (client) => client.release(),
  mockData
};
