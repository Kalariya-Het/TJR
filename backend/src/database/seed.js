const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await pool.query('DELETE FROM audit_logs');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM api_keys');
    await pool.query('DELETE FROM marketplace_purchases');
    await pool.query('DELETE FROM marketplace_listings');
    await pool.query('DELETE FROM credit_transactions');
    await pool.query('DELETE FROM credit_batches');
    await pool.query('DELETE FROM production_submissions');
    await pool.query('DELETE FROM verifiers');
    await pool.query('DELETE FROM producers');
    await pool.query('DELETE FROM users');
    
    // Seed Users
    console.log('👥 Seeding users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = [
      {
        email: 'admin@greenhydrogen.com',
        role: 'admin',
        wallet_address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        first_name: 'System',
        last_name: 'Administrator',
        is_verified: true,
        kyc_status: 'approved'
      },
      {
        email: 'producer1@solar.com',
        role: 'producer',
        wallet_address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        first_name: 'Hans',
        last_name: 'Mueller',
        company_name: 'Solar Hydrogen GmbH',
        is_verified: true,
        kyc_status: 'approved'
      },
      {
        email: 'producer2@wind.com',
        role: 'producer',
        wallet_address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        first_name: 'Anna',
        last_name: 'Schmidt',
        company_name: 'Wind Power Hydrogen Ltd',
        is_verified: true,
        kyc_status: 'approved'
      },
      {
        email: 'verifier1@tuv.com',
        role: 'verifier',
        wallet_address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        first_name: 'Klaus',
        last_name: 'Weber',
        company_name: 'TÜV SÜD',
        is_verified: true,
        kyc_status: 'approved'
      },
      {
        email: 'verifier2@bureau.com',
        role: 'verifier',
        wallet_address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        first_name: 'Marie',
        last_name: 'Dubois',
        company_name: 'Bureau Veritas',
        is_verified: true,
        kyc_status: 'approved'
      },
      {
        email: 'buyer1@corp.com',
        role: 'buyer',
        wallet_address: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
        first_name: 'John',
        last_name: 'Smith',
        company_name: 'Green Corp Industries',
        is_verified: true,
        kyc_status: 'approved'
      }
    ];
    
    const userIds = [];
    for (const user of users) {
      const result = await pool.query(`
        INSERT INTO users (email, password_hash, role, wallet_address, first_name, last_name, company_name, is_verified, kyc_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [user.email, hashedPassword, user.role, user.wallet_address, user.first_name, user.last_name, user.company_name, user.is_verified, user.kyc_status]);
      
      userIds.push({ ...user, id: result.rows[0].id });
    }
    
    console.log(`✅ Created ${userIds.length} users`);
    
    // Seed Producers
    console.log('🏭 Seeding producers...');
    const producer1 = userIds.find(u => u.role === 'producer' && u.email === 'producer1@solar.com');
    const producer2 = userIds.find(u => u.role === 'producer' && u.email === 'producer2@wind.com');
    
    const producers = [
      {
        user_id: producer1.id,
        wallet_address: producer1.wallet_address,
        plant_id: 'SOLAR-PLANT-V2-001',
        plant_name: 'Munich Solar Hydrogen Facility',
        location: 'Munich, Germany',
        country: 'Germany',
        renewable_source: 'Solar',
        capacity_kg_per_month: 5000,
        certification_body: 'TÜV SÜD',
        certification_number: 'TUV-2024-001',
        monthly_production_limit: '5000000000000000000', // 5000 * 10^18 (reduced for bigint compatibility)
        is_verified: true
      },
      {
        user_id: producer2.id,
        wallet_address: producer2.wallet_address,
        plant_id: 'WIND-PLANT-V2-002',
        plant_name: 'Hamburg Wind Hydrogen Plant',
        location: 'Hamburg, Germany',
        country: 'Germany',
        renewable_source: 'Wind',
        capacity_kg_per_month: 8000,
        certification_body: 'Bureau Veritas',
        certification_number: 'BV-2024-002',
        monthly_production_limit: '8000000000000000000', // 8000 * 10^18 (reduced for bigint compatibility)
        is_verified: true
      }
    ];
    
    const producerIds = [];
    for (const producer of producers) {
      const result = await pool.query(`
        INSERT INTO producers (user_id, wallet_address, plant_id, plant_name, location, country, renewable_source, 
                             capacity_kg_per_month, certification_body, certification_number, monthly_production_limit, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [producer.user_id, producer.wallet_address, producer.plant_id, producer.plant_name, producer.location, 
          producer.country, producer.renewable_source, producer.capacity_kg_per_month, producer.certification_body, 
          producer.certification_number, producer.monthly_production_limit, producer.is_verified]);
      
      producerIds.push({ ...producer, id: result.rows[0].id });
    }
    
    console.log(`✅ Created ${producerIds.length} producers`);
    
    // Seed Verifiers
    console.log('✅ Seeding verifiers...');
    const verifier1 = userIds.find(u => u.role === 'verifier' && u.email === 'verifier1@tuv.com');
    const verifier2 = userIds.find(u => u.role === 'verifier' && u.email === 'verifier2@bureau.com');
    
    const verifiers = [
      {
        user_id: verifier1.id,
        wallet_address: verifier1.wallet_address,
        organization_name: 'TÜV SÜD',
        organization_type: 'Technical Inspection Association',
        accreditation_body: 'DAkkS',
        accreditation_number: 'D-ZE-19033-01-00',
        specialization: ['hydrogen_production', 'renewable_energy', 'emissions_verification'],
        reputation_score: 100
      },
      {
        user_id: verifier2.id,
        wallet_address: verifier2.wallet_address,
        organization_name: 'Bureau Veritas',
        organization_type: 'International Certification Body',
        accreditation_body: 'COFRAC',
        accreditation_number: 'COFRAC-1-1084',
        specialization: ['carbon_credits', 'environmental_management', 'sustainability'],
        reputation_score: 100
      }
    ];
    
    const verifierIds = [];
    for (const verifier of verifiers) {
      const result = await pool.query(`
        INSERT INTO verifiers (user_id, wallet_address, organization_name, organization_type, accreditation_body, 
                             accreditation_number, specialization, reputation_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, user_id
      `, [verifier.user_id, verifier.wallet_address, verifier.organization_name, verifier.organization_type, 
          verifier.accreditation_body, verifier.accreditation_number, verifier.specialization, verifier.reputation_score]);
      
      verifierIds.push({ ...verifier, id: result.rows[0].id, user_id: result.rows[0].user_id });
    }
    
    console.log(`✅ Created ${verifiers.length} verifiers`);
    
    // Seed sample production submissions
    console.log('📊 Seeding production submissions...');
    const sampleSubmissions = [
      {
        producer_id: producerIds[0].id,
        data_hash: '0x16ad23f5589cf38dbe63026daa8196ff9c430b1db088e00940ce7971bbfd3d23',
        plant_id: 'SOLAR-PLANT-V2-001',
        amount: '1000000000000000000', // 1000 * 10^18 (reduced for bigint compatibility)
        production_time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        ipfs_hash: 'QmTestHash123456789abcdef',
        verification_fee: '10000000000000000', // 0.01 ETH
        status: 'verified',
        verifier_id: verifierIds.find(v => v.user_id === userIds.find(u => u.email === 'verifier1@tuv.com').id).id,
        verification_time: new Date(),
        verification_notes: 'Production data verified through IoT sensors and third-party audit',
        is_verified: true
      },
      {
        producer_id: producerIds[1].id,
        data_hash: '0xa89d3d73588dd51c68e31f3e3620be75e22e01e6d75a0a41b38b9826ca223d02',
        plant_id: 'WIND-PLANT-V2-002',
        amount: '1500000000000000000', // 1500 * 10^18 (reduced for bigint compatibility)
        production_time: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        ipfs_hash: 'QmTestHash987654321fedcba',
        verification_fee: '10000000000000000', // 0.01 ETH
        status: 'pending',
        is_verified: false
      }
    ];
    
    for (const submission of sampleSubmissions) {
      await pool.query(`
        INSERT INTO production_submissions (producer_id, data_hash, plant_id, amount, production_time, 
                                          ipfs_hash, verification_fee, status, verifier_id, verification_time, 
                                          verification_notes, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [submission.producer_id, submission.data_hash, submission.plant_id, submission.amount, 
          submission.production_time, submission.ipfs_hash, submission.verification_fee, submission.status,
          submission.verifier_id, submission.verification_time, submission.verification_notes, submission.is_verified]);
    }
    
    console.log(`✅ Created ${sampleSubmissions.length} production submissions`);
    
    // Seed sample notifications
    console.log('🔔 Seeding notifications...');
    const notifications = [
      {
        user_id: producer1.id,
        type: 'production_verified',
        title: 'Production Data Verified',
        message: 'Your production data for 1000 kg has been verified and credits have been issued.',
        data: { amount: '1000', batch_id: 1 }
      },
      {
        user_id: producer2.id,
        type: 'verification_pending',
        title: 'Verification Pending',
        message: 'Your production data submission is pending verification.',
        data: { amount: '1500', submission_id: 2 }
      }
    ];
    
    for (const notification of notifications) {
      await pool.query(`
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES ($1, $2, $3, $4, $5)
      `, [notification.user_id, notification.type, notification.title, notification.message, JSON.stringify(notification.data)]);
    }
    
    console.log(`✅ Created ${notifications.length} notifications`);
    
    // Verify seeding
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM producers) as producers,
        (SELECT COUNT(*) FROM verifiers) as verifiers,
        (SELECT COUNT(*) FROM production_submissions) as submissions,
        (SELECT COUNT(*) FROM notifications) as notifications
    `);
    
    console.log('\n📊 Database seeding completed successfully!');
    console.log('Final counts:');
    console.log(`  - Users: ${stats.rows[0].users}`);
    console.log(`  - Producers: ${stats.rows[0].producers}`);
    console.log(`  - Verifiers: ${stats.rows[0].verifiers}`);
    console.log(`  - Production Submissions: ${stats.rows[0].submissions}`);
    console.log(`  - Notifications: ${stats.rows[0].notifications}`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✅ Seeding process completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding process failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
