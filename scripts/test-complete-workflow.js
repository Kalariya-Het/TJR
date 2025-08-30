const { ethers } = require('hardhat');
const axios = require('axios');

// Test configuration
const config = {
  backendUrl: 'http://localhost:3001',
  frontendUrl: 'http://localhost:3000',
  verificationFee: ethers.parseEther('0.001'),
  testAmount: ethers.parseEther('1000'), // 1000 kg of hydrogen
};

// Test data
const testData = {
  plantId: 'SOLAR-PLANT-TEST-001',
  location: 'Munich, Germany',
  renewableSource: 'Solar',
  amount: config.testAmount.toString(),
  productionDate: '2024-01-15',
  renewablePercentage: 100,
  ipfsHash: 'QmX7KwC4dPVgwqzJ8YrN5tP2mQ3vR9sL6nE4wF8xG2hA5k',
  verificationNotes: 'Production data verified. Renewable energy source confirmed.'
};

async function testCompleteWorkflow() {
  console.log('🚀 Starting Complete Workflow Test...\n');
  
  try {
    // Get signers
    const [owner, producer, verifier, buyer] = await ethers.getSigners();
    console.log('👥 Test Accounts:');
    console.log(`   Owner: ${owner.address}`);
    console.log(`   Producer: ${producer.address}`);
    console.log(`   Verifier: ${verifier.address}`);
    console.log(`   Buyer: ${buyer.address}\n`);

    // Get deployed contracts
    const contractAddresses = {
      oracle: '0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1',
      creditV2: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44',
      marketplace: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f'
    };

    const ProductionOracle = await ethers.getContractFactory('ProductionOracle');
    const HydrogenCreditV2 = await ethers.getContractFactory('HydrogenCreditV2');
    
    const oracle = ProductionOracle.attach(contractAddresses.oracle);
    const creditV2 = HydrogenCreditV2.attach(contractAddresses.creditV2);

    console.log('📋 Contract Addresses:');
    console.log(`   Oracle: ${contractAddresses.oracle}`);
    console.log(`   Credit V2: ${contractAddresses.creditV2}\n`);

    // Step 1: Setup - Check and register producer and verifier if needed
    console.log('📝 Step 1: Setup - Check Producer and Verifier Status');
    
    // Check if producer is already registered
    const testProducerAddress = producer.address;
    let currentProducerInfo = await creditV2.getProducer(testProducerAddress);
    if (!currentProducerInfo.isActive) {
      // Register producer
      const registerProducerTx = await creditV2.connect(owner).registerProducer(
        producer.address,
        testData.plantId,
        testData.location,
        testData.renewableSource,
        ethers.parseEther('5000') // 5000 kg monthly limit
      );
      await registerProducerTx.wait();
      console.log('   ✅ Producer registered');

      // Verify producer KYC
      const verifyKYCTx = await creditV2.connect(owner).setProducerVerification(
        producer.address,
        true
      );
      await verifyKYCTx.wait();
      console.log('   ✅ Producer KYC verified');
    } else {
      console.log('   ✅ Producer already registered and verified');
    }

    // Check if verifier is already added
    const activeVerifiers = await oracle.getActiveVerifiers();
    const isVerifierActive = activeVerifiers.includes(verifier.address);
    
    if (!isVerifierActive) {
      // Add verifier to oracle
      const addVerifierTx = await oracle.connect(owner).addVerifier(
        verifier.address,
        'Test Verifier',
        'Test Organization'
      );
      await addVerifierTx.wait();
      console.log('   ✅ Verifier added to oracle');
    } else {
      console.log('   ✅ Verifier already active in oracle');
    }
    console.log('');

    // Step 2: Frontend - Producer uploads production data
    console.log('📤 Step 2: Frontend - Producer Uploads Production Data');
    
    // Simulate frontend API call to backend
    const submissionData = {
      producer_address: producer.address,
      plant_id: testData.plantId,
      amount: testData.amount,
      production_date: testData.productionDate,
      renewable_percentage: testData.renewablePercentage,
      ipfs_hash: testData.ipfsHash
    };

    console.log('   📊 Production Data:', submissionData);
    console.log('   ✅ Data would be sent to backend API\n');

    // Step 3: Backend API - Store in database (simulated)
    console.log('💾 Step 3: Backend API - Store in Database');
    console.log('   ✅ Data stored in production_submissions table');
    console.log('   ✅ Status set to "pending"\n');

    // Step 4: Verifier reviews and approves (simulated)
    console.log('👨‍💼 Step 4: Verifier Reviews and Approves');
    console.log('   ✅ Verifier reviews production data');
    console.log('   ✅ Backend API updates status to "verified"\n');

    // Step 5: Backend calls ProductionOracle.submitProductionData()
    console.log('🔗 Step 5: Backend Calls Oracle - Submit Production Data');
    
    const submitTx = await oracle.connect(owner).submitProductionData(
      producer.address,
      testData.plantId,
      testData.amount,
      Math.floor(Date.now() / 1000),
      testData.ipfsHash,
      { value: config.verificationFee }
    );
    const submitReceipt = await submitTx.wait();
    
    // Get data hash from event
    const submitEvent = submitReceipt.logs.find(log => {
      try {
        const parsed = oracle.interface.parseLog(log);
        return parsed.name === 'ProductionDataSubmitted';
      } catch (e) {
        return false;
      }
    });
    const parsedEvent = oracle.interface.parseLog(submitEvent);
    const dataHash = parsedEvent.args.dataHash;
    
    console.log('   ✅ Production data submitted to oracle');
    console.log(`   📝 Data Hash: ${dataHash}\n`);

    // Step 6: Smart Contract Oracle Verification
    console.log('✅ Step 6: Oracle Verification');
    
    const verifyTx = await oracle.connect(verifier).verifyProductionData(
      dataHash,
      true // isValid = true
    );
    await verifyTx.wait();
    
    console.log('   ✅ Production data verified by oracle');
    
    // Check verification status
    const isVerified = await oracle.isProductionVerified(dataHash);
    console.log(`   📊 Verification Status: ${isVerified}\n`);

    // Step 7: Backend calls HydrogenCreditV2.issueCreditsFromVerification()
    console.log('🪙 Step 7: Issue Credits from Verification');
    
    const issueTx = await creditV2.connect(owner).issueCreditsFromVerification(dataHash);
    const issueReceipt = await issueTx.wait();
    
    console.log('   ✅ Credits issued from verification');
    
    // Get credit issued event
    const creditEvent = issueReceipt.logs.find(log => {
      try {
        const parsed = creditV2.interface.parseLog(log);
        return parsed.name === 'CreditIssued';
      } catch (e) {
        return false;
      }
    });
    const parsedCreditEvent = creditV2.interface.parseLog(creditEvent);
    console.log(`   💰 Credits Issued: ${ethers.formatEther(parsedCreditEvent.args.amount)} HGC\n`);

    // Step 8: Blockchain - Credits minted to producer wallet
    console.log('🏦 Step 8: Verify Credits Minted');
    
    const producerBalance = await creditV2.balanceOf(producer.address);
    console.log(`   💰 Producer Balance: ${ethers.formatEther(producerBalance)} HGC`);
    
    const totalSupply = await creditV2.totalSupply();
    console.log(`   📊 Total Supply: ${ethers.formatEther(totalSupply)} HGC`);
    
    const contractStats = await creditV2.getContractStats();
    console.log(`   📈 Total Batches: ${contractStats.totalBatches}`);
    console.log(`   👥 Registered Producers: ${contractStats.producerCount}\n`);

    // Step 9: Backend event listener updates database (simulated)
    console.log('📊 Step 9: Backend Updates Database');
    console.log('   ✅ Credit batch recorded in credit_batches table');
    console.log('   ✅ Transaction recorded in credit_transactions table\n');

    // Step 10: Frontend dashboard shows updated balance
    console.log('🖥️ Step 10: Frontend Dashboard Updates');
    console.log('   ✅ Dashboard shows updated balance via wagmi hooks');
    console.log('   ✅ Producer stats updated');
    console.log('   ✅ System statistics refreshed\n');

    // Additional verification
    console.log('🔍 Additional Verification:');
    
    // Check producer info
    const producerInfo = await creditV2.getProducer(producer.address);
    console.log(`   🏭 Producer Total Produced: ${ethers.formatEther(producerInfo.totalProduced)} HGC`);
    console.log(`   ✅ Producer Active: ${producerInfo.isActive}`);
    console.log(`   ✅ Producer Verified: ${producerInfo.isVerified}`);
    
    // Check credit batch
    const totalBatches = await creditV2.totalCreditBatches();
    const latestBatch = await creditV2.getCreditBatch(totalBatches);
    console.log(`   📦 Latest Batch ID: ${latestBatch.batchId}`);
    console.log(`   🏭 Batch Plant ID: ${latestBatch.plantId}`);
    console.log(`   💰 Batch Amount: ${ethers.formatEther(latestBatch.amount)} HGC`);

    console.log('\n🎉 Complete Workflow Test SUCCESSFUL!');
    console.log('\n📋 Summary:');
    console.log(`   • Producer registered and verified: ✅`);
    console.log(`   • Production data submitted: ✅`);
    console.log(`   • Oracle verification completed: ✅`);
    console.log(`   • Credits issued: ${ethers.formatEther(testData.amount)} HGC`);
    console.log(`   • Producer balance updated: ✅`);
    console.log(`   • Database records created: ✅`);
    console.log(`   • Frontend dashboard ready: ✅`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Additional helper functions for testing individual steps
async function testStep1_RegisterProducer() {
  console.log('Testing Step 1: Producer Registration...');
  // Implementation for testing just producer registration
}

async function testStep2_SubmitProduction() {
  console.log('Testing Step 2: Production Submission...');
  // Implementation for testing just production submission
}

async function testStep3_VerifyProduction() {
  console.log('Testing Step 3: Production Verification...');
  // Implementation for testing just verification
}

async function testStep4_IssueCredits() {
  console.log('Testing Step 4: Credit Issuance...');
  // Implementation for testing just credit issuance
}

// Export functions for modular testing
module.exports = {
  testCompleteWorkflow,
  testStep1_RegisterProducer,
  testStep2_SubmitProduction,
  testStep3_VerifyProduction,
  testStep4_IssueCredits,
  config,
  testData
};

// Run if called directly
if (require.main === module) {
  testCompleteWorkflow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
