const { ethers } = require('hardhat');

async function checkSystemState() {
  console.log('🔍 Checking Green Hydrogen Credit System State...\n');

  try {
    // Get signers
    const [owner, producer, verifier, buyer] = await ethers.getSigners();
    console.log('👥 Available Accounts:');
    console.log(`   Owner: ${owner.address}`);
    console.log(`   Producer: ${producer.address}`);
    console.log(`   Verifier: ${verifier.address}`);
    console.log(`   Buyer: ${buyer.address}\n`);

    // Contract addresses (update these with your deployed addresses)
    const contractAddresses = {
      oracle: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
      creditV2: '0x9A676e781A523b5d0C0e43731313A708CB607508',
      marketplace: '0x0B306BF915C4d645ff596e518fAf3F9669b97016'
    };

    console.log('📋 Contract Addresses:');
    console.log(`   Oracle: ${contractAddresses.oracle}`);
    console.log(`   Credit V2: ${contractAddresses.creditV2}`);
    console.log(`   Marketplace: ${contractAddresses.marketplace}\n`);

    // Get contract instances
    const ProductionOracle = await ethers.getContractFactory('ProductionOracle');
    const HydrogenCreditV2 = await ethers.getContractFactory('HydrogenCreditV2');
    const HydrogenCreditMarketplace = await ethers.getContractFactory('HydrogenCreditMarketplace');

    let oracle, creditV2, marketplace;

    try {
      oracle = ProductionOracle.attach(contractAddresses.oracle);
      creditV2 = HydrogenCreditV2.attach(contractAddresses.creditV2);
      marketplace = HydrogenCreditMarketplace.attach(contractAddresses.marketplace);
      console.log('✅ All contracts connected successfully\n');
    } catch (error) {
      console.log('❌ Error connecting to contracts. Please deploy contracts first.');
      console.log('   Run: npx hardhat run scripts/deploy.js --network localhost\n');
      return;
    }

    // Check Oracle state
    console.log('🔮 Oracle Contract State:');
    try {
      const activeVerifiers = await oracle.getActiveVerifiers();
      const pendingVerifications = await oracle.getPendingVerifications();
      const verificationFee = await oracle.verificationFee();
      
      console.log(`   Active Verifiers: ${activeVerifiers.length}`);
      console.log(`   Pending Verifications: ${pendingVerifications.length}`);
      console.log(`   Verification Fee: ${ethers.formatEther(verificationFee)} ETH`);
      
      if (activeVerifiers.length > 0) {
        console.log('   Verifier Addresses:');
        activeVerifiers.forEach((addr, i) => {
          console.log(`     ${i + 1}. ${addr}`);
        });
      }
    } catch (error) {
      console.log(`   ❌ Error reading oracle state: ${error.message}`);
    }
    console.log('');

    // Check Credit V2 state
    console.log('🪙 Credit V2 Contract State:');
    try {
      const name = await creditV2.name();
      const symbol = await creditV2.symbol();
      const totalSupply = await creditV2.totalSupply();
      const contractStats = await creditV2.getContractStats();
      const allProducers = await creditV2.getAllProducers();
      
      console.log(`   Token Name: ${name}`);
      console.log(`   Token Symbol: ${symbol}`);
      console.log(`   Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
      console.log(`   Total Batches: ${contractStats.totalBatches}`);
      console.log(`   Total Retired: ${ethers.formatEther(contractStats.totalRetired)} ${symbol}`);
      console.log(`   Registered Producers: ${contractStats.producerCount}`);
      console.log(`   Verified Producers: ${contractStats.verifiedProducerCount}`);
      
      if (allProducers.length > 0) {
        console.log('   Producer Addresses:');
        for (let i = 0; i < allProducers.length; i++) {
          const producerInfo = await creditV2.getProducer(allProducers[i]);
          const balance = await creditV2.balanceOf(allProducers[i]);
          console.log(`     ${i + 1}. ${allProducers[i]}`);
          console.log(`        Plant: ${producerInfo.plantId}`);
          console.log(`        Location: ${producerInfo.location}`);
          console.log(`        Source: ${producerInfo.renewableSource}`);
          console.log(`        Balance: ${ethers.formatEther(balance)} ${symbol}`);
          console.log(`        Active: ${producerInfo.isActive}`);
          console.log(`        Verified: ${producerInfo.isVerified}`);
        }
      }
    } catch (error) {
      console.log(`   ❌ Error reading credit contract state: ${error.message}`);
    }
    console.log('');

    // Check Marketplace state
    console.log('🏪 Marketplace Contract State:');
    try {
      const marketplaceStats = await marketplace.getMarketplaceStats();
      console.log(`   Total Listings: ${marketplaceStats.totalListings}`);
      console.log(`   Active Listings: ${marketplaceStats.activeListings}`);
      console.log(`   Total Volume: ${ethers.formatEther(marketplaceStats.totalVolume)} tokens`);
      console.log(`   Platform Fee: ${marketplaceStats.platformFee / 100}%`);
    } catch (error) {
      console.log(`   ❌ Error reading marketplace state: ${error.message}`);
    }
    console.log('');

    // Check account balances
    console.log('💰 Account Balances:');
    const accounts = [
      { name: 'Owner', address: owner.address },
      { name: 'Producer', address: producer.address },
      { name: 'Verifier', address: verifier.address },
      { name: 'Buyer', address: buyer.address }
    ];

    for (const account of accounts) {
      try {
        const ethBalance = await ethers.provider.getBalance(account.address);
        const tokenBalance = await creditV2.balanceOf(account.address);
        console.log(`   ${account.name}:`);
        console.log(`     ETH: ${ethers.formatEther(ethBalance)} ETH`);
        console.log(`     HGC: ${ethers.formatEther(tokenBalance)} HGC`);
      } catch (error) {
        console.log(`   ${account.name}: Error reading balance`);
      }
    }
    console.log('');

    // System readiness check
    console.log('🚀 System Readiness:');
    const checks = [
      { name: 'Contracts Deployed', status: true },
      { name: 'Oracle Has Verifiers', status: activeVerifiers?.length > 0 },
      { name: 'Credit Contract Active', status: totalSupply !== undefined },
      { name: 'Marketplace Active', status: marketplace !== undefined }
    ];

    checks.forEach(check => {
      console.log(`   ${check.status ? '✅' : '❌'} ${check.name}`);
    });

    const allReady = checks.every(check => check.status);
    console.log(`\n${allReady ? '🎉' : '⚠️'} System Status: ${allReady ? 'READY' : 'NEEDS SETUP'}`);

    if (!allReady) {
      console.log('\n📝 Setup Steps Needed:');
      if (!checks[1].status) {
        console.log('   • Add verifiers to oracle contract');
      }
      console.log('   • Register producers');
      console.log('   • Verify producer KYC status');
    }

  } catch (error) {
    console.error('❌ Error checking system state:', error);
  }
}

// Run if called directly
if (require.main === module) {
  checkSystemState()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { checkSystemState };
