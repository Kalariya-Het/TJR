const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  console.log('🚀 Starting database migrations...');
  
  try {
    // Read the migrations SQL file
    const migrationsPath = path.join(__dirname, 'migrations.sql');
    const migrationSQL = fs.readFileSync(migrationsPath, 'utf8');
    
    // Execute the migrations
    await pool.query(migrationSQL);
    
    console.log('✅ Database migrations completed successfully!');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    console.log(`\n🎯 Total tables created: ${result.rows.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('\n✅ Migration process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };
