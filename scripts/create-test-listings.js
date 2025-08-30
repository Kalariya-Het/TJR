const { ethers } = require('hardhat');

async function main() {
    console.log('🛒 Creating test marketplace listings...');
    
    // Get signers
    const [owner, producer1, producer2, buyer1, buyer2] = await ethers.getSigners();
    
    // Contract addresses from recent deployment
    const HYDROGEN_CREDIT_ADDRESS = '0xc5a5C42992dECbae36851359345FE25997F5C42d';
    const MARKETPLACE_ADDRESS = '0x67d269191c92Caf3cD7723F116c85e6E9bf55933';
    
    // Get contract instances
    const hydrogenCredit = await ethers.getContractAt('HydrogenCredit', HYDROGEN_CREDIT_ADDRESS);
    const marketplace = await ethers.getContractAt('HydrogenCreditMarketplace', MARKETPLACE_ADDRESS);
    
    console.log('📋 Contract addresses:');
    console.log('HydrogenCredit:', HYDROGEN_CREDIT_ADDRESS);
    console.log('HydrogenCreditMarketplace:', MARKETPLACE_ADDRESS);
    
    // Register producers and issue credits
    console.log('\n🏭 Setting up producers...');
    
    // Register producer1
    await hydrogenCredit.connect(owner).registerProducer(
        producer1.address,
        'Solar Farm Alpha',
        'California, USA',
        'Solar',
        ethers.parseEther('1000'), // 1000 capacity
        true // KYC verified
    );
    console.log('✅ Producer 1 registered:', producer1.address);
    
    // Register producer2
    await hydrogenCredit.connect(owner).registerProducer(
        producer2.address,
        'Wind Farm Beta',
        'Texas, USA',
        'Wind',
        ethers.parseEther('750'), // 750 capacity
        true // KYC verified
    );
    console.log('✅ Producer 2 registered:', producer2.address);
    
    // Issue credits to producers
    console.log('\n💰 Issuing credits...');
    await hydrogenCredit.connect(owner).issueCredits(producer1.address, ethers.parseEther('500'));
    console.log('✅ 500 credits issued to Producer 1');
    
    await hydrogenCredit.connect(owner).issueCredits(producer2.address, ethers.parseEther('300'));
    console.log('✅ 300 credits issued to Producer 2');
    
    // Approve marketplace to spend tokens
    console.log('\n🔓 Approving marketplace...');
    await hydrogenCredit.connect(producer1).approve(MARKETPLACE_ADDRESS, ethers.parseEther('500'));
    await hydrogenCredit.connect(producer2).approve(MARKETPLACE_ADDRESS, ethers.parseEther('300'));
    console.log('✅ Marketplace approved for both producers');
    
    // Create marketplace listings
    console.log('\n🛒 Creating marketplace listings...');
    
    // Producer 1 creates listing: 200 credits at 0.05 ETH each
    await marketplace.connect(producer1).createListing(
        ethers.parseEther('200'),
        ethers.parseEther('0.05')
    );
    console.log('✅ Producer 1 listed 200 credits at 0.05 ETH each');
    
    // Producer 2 creates listing: 150 credits at 0.045 ETH each
    await marketplace.connect(producer2).createListing(
        ethers.parseEther('150'),
        ethers.parseEther('0.045')
    );
    console.log('✅ Producer 2 listed 150 credits at 0.045 ETH each');
    
    // Producer 1 creates another listing: 100 credits at 0.055 ETH each
    await marketplace.connect(producer1).createListing(
        ethers.parseEther('100'),
        ethers.parseEther('0.055')
    );
    console.log('✅ Producer 1 listed 100 more credits at 0.055 ETH each');
    
    // Check marketplace stats
    console.log('\n📊 Marketplace Statistics:');
    const stats = await marketplace.getMarketplaceStats();
    console.log('Total listings created:', stats[0].toString());
    console.log('Active listings:', stats[1].toString());
    console.log('Total volume:', ethers.formatEther(stats[2]), 'ETH');
    console.log('Platform fee:', stats[3].toString(), '%');
    
    // Check balances
    console.log('\n💰 Final Balances:');
    const producer1Balance = await hydrogenCredit.balanceOf(producer1.address);
    const producer2Balance = await hydrogenCredit.balanceOf(producer2.address);
    console.log('Producer 1 balance:', ethers.formatEther(producer1Balance), 'GHC');
    console.log('Producer 2 balance:', ethers.formatEther(producer2Balance), 'GHC');
    
    console.log('\n✅ Test listings created successfully!');
    console.log('🌐 Frontend should now show real marketplace listings');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error creating test listings:', error);
        process.exit(1);
    });
