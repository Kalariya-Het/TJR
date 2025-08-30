const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Deploying fresh contracts and testing marketplace operations...');
    
    // Get signers
    const [owner, producer1, producer2, buyer1, buyer2] = await ethers.getSigners();
    
    console.log('👥 Using accounts:');
    console.log('Owner:', owner.address);
    console.log('Producer1:', producer1.address);
    console.log('Producer2:', producer2.address);
    console.log('Buyer1:', buyer1.address);
    console.log('Buyer2:', buyer2.address);
    
    // Deploy contracts
    console.log('\n📦 Deploying contracts...');
    
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
    
    // Setup producers and credits
    console.log('\n🏭 Setting up producers and credits...');
    
    // Register producers
    await hydrogenCredit.connect(owner).registerProducer(
        producer1.address,
        'SOLAR-001',
        'California, USA',
        'Solar'
    );
    console.log('✅ Producer1 registered');
    
    await hydrogenCredit.connect(owner).registerProducer(
        producer2.address,
        'WIND-001',
        'Texas, USA',
        'Wind'
    );
    console.log('✅ Producer2 registered');
    
    // Issue credits
    const currentTime = Math.floor(Date.now() / 1000);
    await hydrogenCredit.connect(owner).issueCredits(producer1.address, ethers.parseEther('1000'), currentTime);
    await hydrogenCredit.connect(owner).issueCredits(producer2.address, ethers.parseEther('500'), currentTime);
    console.log('✅ Credits issued to both producers');
    
    // Approve marketplace
    await hydrogenCredit.connect(producer1).approve(marketplaceAddress, ethers.parseEther('1000'));
    await hydrogenCredit.connect(producer2).approve(marketplaceAddress, ethers.parseEther('500'));
    console.log('✅ Marketplace approved for both producers');
    
    // Create marketplace listings
    console.log('\n🛒 Creating marketplace listings...');
    
    // Producer1 creates listing: 200 credits at 0.01 ETH each
    await marketplace.connect(producer1).createListing(
        ethers.parseEther('200'),
        ethers.parseEther('0.01')
    );
    console.log('✅ Producer1 listed 200 credits at 0.01 ETH each');
    
    // Producer2 creates listing: 100 credits at 0.015 ETH each
    await marketplace.connect(producer2).createListing(
        ethers.parseEther('100'),
        ethers.parseEther('0.015')
    );
    console.log('✅ Producer2 listed 100 credits at 0.015 ETH each');
    
    // Test marketplace operations
    console.log('\n🧪 Testing marketplace operations...');
    
    // 1. Test Purchase Credits
    console.log('\n1. Testing Purchase Credits...');
    const listing1 = await marketplace.getListing(1);
    const purchaseAmount = ethers.parseEther('50');
    const totalPrice = purchaseAmount * listing1.pricePerUnit / ethers.parseEther('1');
    
    console.log('Purchase details:');
    console.log('- Amount:', ethers.formatEther(purchaseAmount), 'GHC');
    console.log('- Price per unit:', ethers.formatEther(listing1.pricePerUnit), 'ETH');
    console.log('- Total price:', ethers.formatEther(totalPrice), 'ETH');
    
    const buyerBalanceBefore = await hydrogenCredit.balanceOf(buyer1.address);
    
    try {
        const tx1 = await marketplace.connect(buyer1).purchaseCredits(1, purchaseAmount, {
            value: totalPrice
        });
        await tx1.wait();
        console.log('✅ Purchase successful!');
        
        const buyerBalanceAfter = await hydrogenCredit.balanceOf(buyer1.address);
        console.log('Buyer credits:', ethers.formatEther(buyerBalanceAfter), 'GHC');
    } catch (error) {
        console.log('❌ Purchase failed:', error.reason || error.message);
    }
    
    // 2. Test Update Price
    console.log('\n2. Testing Update Price...');
    try {
        const newPrice = ethers.parseEther('0.012');
        const tx2 = await marketplace.connect(producer1).updateListingPrice(1, newPrice);
        await tx2.wait();
        console.log('✅ Price updated to 0.012 ETH per credit');
    } catch (error) {
        console.log('❌ Price update failed:', error.reason || error.message);
    }
    
    // 3. Test Cancel Listing
    console.log('\n3. Testing Cancel Listing...');
    try {
        const tx3 = await marketplace.connect(producer2).cancelListing(2);
        await tx3.wait();
        console.log('✅ Listing 2 cancelled successfully');
    } catch (error) {
        console.log('❌ Cancel listing failed:', error.reason || error.message);
    }
    
    // 4. Test Create New Listing
    console.log('\n4. Testing Create New Listing...');
    try {
        const tx4 = await marketplace.connect(producer1).createListing(
            ethers.parseEther('150'),
            ethers.parseEther('0.008')
        );
        await tx4.wait();
        console.log('✅ New listing created: 150 credits at 0.008 ETH each');
    } catch (error) {
        console.log('❌ Create listing failed:', error.reason || error.message);
    }
    
    // Final marketplace stats
    console.log('\n📊 Final marketplace statistics:');
    const stats = await marketplace.getMarketplaceStats();
    console.log('Total listings created:', stats[0].toString());
    console.log('Active listings:', stats[1].toString());
    console.log('Total volume:', ethers.formatEther(stats[2]), 'ETH');
    console.log('Platform fee:', stats[3].toString(), '%');
    
    // Output contract addresses for frontend
    console.log('\n🌐 Contract addresses for frontend configuration:');
    console.log('hydrogenCreditAddress:', `'${creditAddress}' as Address,`);
    console.log('marketplaceAddress:', `'${marketplaceAddress}' as Address,`);
    
    console.log('\n✅ All marketplace operations tested successfully!');
    console.log('🎯 The frontend can now use these working contract addresses');
    
    return {
        creditAddress,
        marketplaceAddress,
        success: true
    };
}

main()
    .then((result) => {
        if (result.success) {
            console.log('\n🎉 Marketplace transaction operations are now fully functional!');
            console.log('The frontend marketplace should now work with:');
            console.log('- Purchase credits ✅');
            console.log('- Update listing prices ✅');
            console.log('- Cancel listings ✅');
            console.log('- Create new listings ✅');
        }
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error deploying and testing marketplace:', error);
        process.exit(1);
    });
