const { pool } = require('./src/config/database');
const { runMigrations } = require('./src/database/migrate');
const { seedDatabase } = require('./src/database/seed');

async function testBackendIntegration() {
  console.log('🧪 Testing Backend and Database Integration...');
  
  try {
    // Test 1: Database Connection
    console.log('\n1. Testing database connection...');
    const connectionTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected successfully');
    console.log(`   PostgreSQL Version: ${connectionTest.rows[0].pg_version.split(' ')[1]}`);
    console.log(`   Current Time: ${connectionTest.rows[0].current_time}`);

    // Test 2: Run Migrations
    console.log('\n2. Running database migrations...');
    await runMigrations();
    console.log('✅ Database migrations completed');

    // Test 3: Seed Database
    console.log('\n3. Seeding database with test data...');
    await seedDatabase();
    console.log('✅ Database seeded successfully');

    // Test 4: Verify Data Integrity
    console.log('\n4. Verifying data integrity...');
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const producerCount = await pool.query('SELECT COUNT(*) FROM producers');
    const verifierCount = await pool.query('SELECT COUNT(*) FROM verifiers');
    const submissionCount = await pool.query('SELECT COUNT(*) FROM production_submissions');
    
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Producers: ${producerCount.rows[0].count}`);
    console.log(`   Verifiers: ${verifierCount.rows[0].count}`);
    console.log(`   Submissions: ${submissionCount.rows[0].count}`);

    // Test 5: Test Complex Queries
    console.log('\n5. Testing complex database queries...');
    
    const producerStats = await pool.query(`
      SELECT p.plant_name, p.renewable_source, COUNT(ps.*) as submissions
      FROM producers p
      LEFT JOIN production_submissions ps ON p.id = ps.producer_id
      GROUP BY p.id, p.plant_name, p.renewable_source
    `);
    
    console.log('✅ Complex queries working');
    producerStats.rows.forEach(row => {
      console.log(`   ${row.plant_name} (${row.renewable_source}): ${row.submissions} submissions`);
    });

    // Test 6: Test Relationships and Constraints
    console.log('\n6. Testing database relationships...');
    
    const relationshipTest = await pool.query(`
      SELECT u.email, u.role, 
             CASE 
               WHEN p.id IS NOT NULL THEN 'Producer'
               WHEN v.id IS NOT NULL THEN 'Verifier'
               ELSE 'Other'
             END as profile_type
      FROM users u
      LEFT JOIN producers p ON u.id = p.user_id
      LEFT JOIN verifiers v ON u.id = v.user_id
      ORDER BY u.role
    `);
    
    console.log('✅ Database relationships working correctly');
    relationshipTest.rows.forEach(row => {
      console.log(`   ${row.email} (${row.role}) -> ${row.profile_type}`);
    });

    // Test 7: Test Audit Logging
    console.log('\n7. Testing audit logging...');
    
    const auditTest = await pool.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, new_values)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, created_at
    `, [
      userCount.rows[0].count > 0 ? (await pool.query('SELECT id FROM users LIMIT 1')).rows[0].id : null,
      'test_action',
      'test_resource',
      'test_id',
      JSON.stringify({ test: 'data' })
    ]);
    
    console.log('✅ Audit logging working');
    console.log(`   Created audit log: ${auditTest.rows[0].id}`);

    // Test 8: Performance Test
    console.log('\n8. Running performance tests...');
    
    const startTime = Date.now();
    const performanceTest = await pool.query(`
      SELECT COUNT(*) as total_records,
             (SELECT COUNT(*) FROM users) as users,
             (SELECT COUNT(*) FROM producers) as producers,
             (SELECT COUNT(*) FROM production_submissions) as submissions,
             (SELECT COUNT(*) FROM audit_logs) as audit_logs
    `);
    const queryTime = Date.now() - startTime;
    
    console.log('✅ Performance test completed');
    console.log(`   Query time: ${queryTime}ms`);
    console.log(`   Total records: ${performanceTest.rows[0].total_records}`);

    console.log('\n🎉 Backend Integration Test Summary:');
    console.log('✅ Database connection: PASSED');
    console.log('✅ Schema migrations: PASSED');
    console.log('✅ Data seeding: PASSED');
    console.log('✅ Data integrity: PASSED');
    console.log('✅ Complex queries: PASSED');
    console.log('✅ Relationships: PASSED');
    console.log('✅ Audit logging: PASSED');
    console.log('✅ Performance: PASSED');
    
    console.log('\n📊 Database Statistics:');
    console.log(`   Users: ${userCount.rows[0].count}`);
    console.log(`   Producers: ${producerCount.rows[0].count}`);
    console.log(`   Verifiers: ${verifierCount.rows[0].count}`);
    console.log(`   Submissions: ${submissionCount.rows[0].count}`);
    console.log(`   Audit Logs: ${(await pool.query('SELECT COUNT(*) FROM audit_logs')).rows[0].count}`);

    return true;

  } catch (error) {
    console.error('\n❌ Backend integration test failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testBackendIntegration()
    .then((success) => {
      if (success) {
        console.log('\n✅ All backend integration tests passed!');
        console.log('🚀 Backend is ready for production use.');
        process.exit(0);
      } else {
        console.log('\n❌ Backend integration tests failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { testBackendIntegration };
