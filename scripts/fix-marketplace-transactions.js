const { ethers } = require('hardhat');

async function main() {
    console.log('🔧 Fixing marketplace transaction operations...');
    
    // Get signers
    const [owner, producer1, buyer1] = await ethers.getSigners();
    
    console.log('👥 Using accounts:');
    console.log('Owner:', owner.address);
    console.log('Producer:', producer1.address);
    console.log('Buyer:', buyer1.address);
    
    // Deploy fresh contracts for testing
    console.log('\n📦 Deploying fresh contracts...');
    
    // Deploy HydrogenCredit
    const HydrogenCredit = await ethers.getContractFactory('HydrogenCredit');
    const hydrogenCredit = await HydrogenCredit.deploy(
        'Green Hydrogen Credit',
        'GHC', 
        owner.address
    );
    await hydrogenCredit.waitForDeployment();
    const creditAddress = await hydrogenCredit.getAddress();
    console.log('✅ HydrogenCredit deployed to:', creditAddress);
    
    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory('HydrogenCreditMarketplace');
    const marketplace = await Marketplace.deploy(creditAddress, owner.address, owner.address);
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log('✅ Marketplace deployed to:', marketplaceAddress);
    
    // Setup producer and credits
    console.log('\n🏭 Setting up producer and credits...');
    
    // Register producer
    await hydrogenCredit.connect(owner).registerProducer(
        producer1.address,
        'TEST-001',
        'Test Location',
        'Solar'
    );
    console.log('✅ Producer registered');
    
    // Issue credits
    const currentTime = Math.floor(Date.now() / 1000);
    await hydrogenCredit.connect(owner).issueCredits(
        producer1.address,
        ethers.parseEther('1000'),
        currentTime
    );
    console.log('✅ 1000 credits issued to producer');
    
    // Check balance
    const balance = await hydrogenCredit.balanceOf(producer1.address);
    console.log('Producer balance:', ethers.formatEther(balance), 'GHC');
    
    // Approve marketplace
    await hydrogenCredit.connect(producer1).approve(marketplaceAddress, ethers.parseEther('1000'));
    console.log('✅ Marketplace approved');
    
    // Test marketplace operations
    console.log('\n🛒 Testing marketplace operations...');
    
    // 1. Create listing
    console.log('1. Creating listing...');
    const tx1 = await marketplace.connect(producer1).createListing(
        ethers.parseEther('500'), // 500 credits
        ethers.parseEther('0.01')  // 0.01 ETH per credit
    );
    await tx1.wait();
    console.log('✅ Listing created successfully');
    
    // Check marketplace stats
    const stats = await marketplace.getMarketplaceStats();
    console.log('Total listings:', stats[0].toString());
    console.log('Active listings:', stats[1].toString());
    
    // 2. Test purchase
    console.log('\n2. Testing purchase...');
    
    // Get the actual listing data first
    const listing = await marketplace.getListing(1);
    console.log('Listing price per unit:', ethers.formatEther(listing.pricePerUnit), 'ETH');
    console.log('Listing amount available:', ethers.formatEther(listing.amount), 'GHC');
    
    const purchaseAmount = ethers.parseEther('10'); // Buy 10 credits (smaller amount)
    const actualPricePerUnit = listing.pricePerUnit;
    // Contract expects: amount * pricePerUnit (no division needed)
    const totalPrice = purchaseAmount * actualPricePerUnit / ethers.parseEther('1');
    
    // Add some extra to account for platform fees
    const totalPriceWithBuffer = totalPrice + ethers.parseEther('0.01');
    console.log('Purchase amount:', ethers.formatEther(purchaseAmount), 'GHC');
    console.log('Actual price per unit:', ethers.formatEther(actualPricePerUnit), 'ETH');
    console.log('Total price calculated:', ethers.formatEther(totalPrice), 'ETH');
    
    const buyerBalanceBefore = await ethers.provider.getBalance(buyer1.address);
    console.log('Buyer ETH before:', ethers.formatEther(buyerBalanceBefore));
    
    const tx2 = await marketplace.connect(buyer1).purchaseCredits(1, purchaseAmount, {
        value: totalPrice
    });
    await tx2.wait();
    console.log('✅ Purchase completed successfully');
    
    const buyerBalanceAfter = await ethers.provider.getBalance(buyer1.address);
    const buyerCredits = await hydrogenCredit.balanceOf(buyer1.address);
    console.log('Buyer ETH after:', ethers.formatEther(buyerBalanceAfter));
    console.log('Buyer credits:', ethers.formatEther(buyerCredits), 'GHC');
    
    // 3. Test price update
    console.log('\n3. Testing price update...');
    const tx3 = await marketplace.connect(producer1).updateListingPrice(1, ethers.parseEther('0.015'));
    await tx3.wait();
    console.log('✅ Price updated successfully');
    
    // 4. Test cancel listing (create new listing first)
    console.log('\n4. Testing cancel listing...');
    const tx4 = await marketplace.connect(producer1).createListing(
        ethers.parseEther('200'),
        ethers.parseEther('0.02')
    );
    await tx4.wait();
    
    const tx5 = await marketplace.connect(producer1).cancelListing(2);
    await tx5.wait();
    console.log('✅ Listing cancelled successfully');
    
    // Final stats
    console.log('\n📊 Final marketplace stats:');
    const finalStats = await marketplace.getMarketplaceStats();
    console.log('Total listings created:', finalStats[0].toString());
    console.log('Active listings:', finalStats[1].toString());
    console.log('Total volume:', ethers.formatEther(finalStats[2]), 'ETH');
    
    // Output contract addresses for frontend
    console.log('\n🌐 Contract addresses for frontend:');
    console.log('HydrogenCredit:', creditAddress);
    console.log('Marketplace:', marketplaceAddress);
    
    console.log('\n✅ All marketplace operations working correctly!');
    console.log('🎯 Frontend can now use these addresses for real transactions');
    
    return {
        creditAddress,
        marketplaceAddress
    };
}

main()
    .then((addresses) => {
        console.log('\n📝 Update frontend config with these addresses:');
        console.log(`hydrogenCreditAddress: '${addresses.creditAddress}' as Address,`);
        console.log(`marketplaceAddress: '${addresses.marketplaceAddress}' as Address,`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error fixing marketplace:', error);
        process.exit(1);
    });
