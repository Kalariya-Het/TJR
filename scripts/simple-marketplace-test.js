const { ethers } = require('hardhat');

async function main() {
    console.log('🛒 Testing marketplace functionality...');
    
    // Get signers
    const [owner, producer1, producer2, buyer1] = await ethers.getSigners();
    
    // Contract addresses from recent deployment
    const HYDROGEN_CREDIT_ADDRESS = '0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB';
    const MARKETPLACE_ADDRESS = '0x9E545E3C0baAB3E08CdfD552C960A1050f373042';
    
    // Get contract instances
    const hydrogenCredit = await ethers.getContractAt('HydrogenCredit', HYDROGEN_CREDIT_ADDRESS);
    const marketplace = await ethers.getContractAt('HydrogenCreditMarketplace', MARKETPLACE_ADDRESS);
    
    console.log('📋 Contract addresses:');
    console.log('HydrogenCredit:', HYDROGEN_CREDIT_ADDRESS);
    console.log('HydrogenCreditMarketplace:', MARKETPLACE_ADDRESS);
    
    // Register producers with correct parameters
    console.log('\n🏭 Setting up producers...');
    
    await hydrogenCredit.connect(owner).registerProducer(
        producer1.address,
        'SOLAR-001',
        'California, USA',
        'Solar'
    );
    console.log('✅ Producer 1 registered:', producer1.address);
    
    await hydrogenCredit.connect(owner).registerProducer(
        producer2.address,
        'WIND-001', 
        'Texas, USA',
        'Wind'
    );
    console.log('✅ Producer 2 registered:', producer2.address);
    
    // Issue credits to producers
    console.log('\n💰 Issuing credits...');
    const currentTime = Math.floor(Date.now() / 1000);
    
    await hydrogenCredit.connect(owner).issueCredits(
        producer1.address, 
        ethers.parseEther('500'),
        currentTime
    );
    console.log('✅ 500 credits issued to Producer 1');
    
    await hydrogenCredit.connect(owner).issueCredits(
        producer2.address, 
        ethers.parseEther('300'),
        currentTime
    );
    console.log('✅ 300 credits issued to Producer 2');
    
    // Check balances
    const producer1Balance = await hydrogenCredit.balanceOf(producer1.address);
    const producer2Balance = await hydrogenCredit.balanceOf(producer2.address);
    console.log('Producer 1 balance:', ethers.formatEther(producer1Balance), 'GHC');
    console.log('Producer 2 balance:', ethers.formatEther(producer2Balance), 'GHC');
    
    // Approve marketplace to spend tokens
    console.log('\n🔓 Approving marketplace...');
    await hydrogenCredit.connect(producer1).approve(MARKETPLACE_ADDRESS, ethers.parseEther('500'));
    await hydrogenCredit.connect(producer2).approve(MARKETPLACE_ADDRESS, ethers.parseEther('300'));
    console.log('✅ Marketplace approved for both producers');
    
    // Create marketplace listings
    console.log('\n🛒 Creating marketplace listings...');
    
    // Producer 1 creates listing: 200 credits at 0.05 ETH each
    const tx1 = await marketplace.connect(producer1).createListing(
        ethers.parseEther('200'),
        ethers.parseEther('0.05')
    );
    await tx1.wait();
    console.log('✅ Producer 1 listed 200 credits at 0.05 ETH each');
    
    // Producer 2 creates listing: 150 credits at 0.045 ETH each  
    const tx2 = await marketplace.connect(producer2).createListing(
        ethers.parseEther('150'),
        ethers.parseEther('0.045')
    );
    await tx2.wait();
    console.log('✅ Producer 2 listed 150 credits at 0.045 ETH each');
    
    // Test purchase transaction
    console.log('\n💳 Testing purchase transaction...');
    const purchaseAmount = ethers.parseEther('50'); // Buy 50 credits
    const pricePerUnit = ethers.parseEther('0.05');
    const totalPrice = purchaseAmount * pricePerUnit / ethers.parseEther('1');
    
    const buyerBalanceBefore = await ethers.provider.getBalance(buyer1.address);
    console.log('Buyer balance before:', ethers.formatEther(buyerBalanceBefore), 'ETH');
    
    const tx3 = await marketplace.connect(buyer1).purchaseCredits(1, purchaseAmount, {
        value: totalPrice
    });
    await tx3.wait();
    console.log('✅ Buyer purchased 50 credits from listing 1');
    
    const buyerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
    const buyerCreditBalance = await hydrogenCredit.balanceOf(buyer1.address);
    console.log('Buyer balance after:', ethers.formatEther(buyerBalanceAfter), 'ETH');
    console.log('Buyer credit balance:', ethers.formatEther(buyerCreditBalance), 'GHC');
    
    // Test price update
    console.log('\n💰 Testing price update...');
    const tx4 = await marketplace.connect(producer1).updateListingPrice(1, ethers.parseEther('0.06'));
    await tx4.wait();
    console.log('✅ Producer 1 updated listing 1 price to 0.06 ETH');
    
    // Check marketplace stats
    console.log('\n📊 Final Marketplace Statistics:');
    const stats = await marketplace.getMarketplaceStats();
    console.log('Total listings created:', stats[0].toString());
    console.log('Active listings:', stats[1].toString());
    console.log('Total volume:', ethers.formatEther(stats[2]), 'ETH');
    console.log('Platform fee:', stats[3].toString(), '%');
    
    console.log('\n✅ Marketplace test completed successfully!');
    console.log('🌐 All marketplace operations are working correctly');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error testing marketplace:', error);
        process.exit(1);
    });
