const { ethers } = require('hardhat');

async function main() {
    console.log('💰 Deploying marketplace with very affordable GHC prices for testing...');
    
    // Get signers
    const [owner, producer1, producer2, buyer1] = await ethers.getSigners();
    
    console.log('👥 Using accounts:');
    console.log('Owner:', owner.address);
    console.log('Producer1:', producer1.address);
    console.log('Producer2:', producer2.address);
    console.log('Buyer1:', buyer1.address);
    
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
        'SOLAR-CHEAP',
        'California, USA',
        'Solar'
    );
    console.log('✅ Producer1 registered');
    
    await hydrogenCredit.connect(owner).registerProducer(
        producer2.address,
        'WIND-CHEAP',
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
    
    // Create VERY CHEAP marketplace listings for easy testing
    console.log('\n🛒 Creating super affordable marketplace listings...');
    
    // Producer1: 100 GHC at 0.00001 ETH each (Total: 0.001 ETH for 100 GHC!)
    await marketplace.connect(producer1).createListing(
        ethers.parseEther('100'),
        ethers.parseEther('0.00001')  // Extremely cheap: 0.00001 ETH per GHC
    );
    console.log('✅ Producer1 listed 100 GHC at 0.00001 ETH each');
    console.log('   💰 Total cost: 0.001 ETH for 100 GHC');
    
    // Producer2: 50 GHC at 0.00002 ETH each (Total: 0.001 ETH for 50 GHC!)
    await marketplace.connect(producer2).createListing(
        ethers.parseEther('50'),
        ethers.parseEther('0.00002')  // Very cheap: 0.00002 ETH per GHC
    );
    console.log('✅ Producer2 listed 50 GHC at 0.00002 ETH each');
    console.log('   💰 Total cost: 0.001 ETH for 50 GHC');
    
    // Producer1: Micro listing for tiny tests
    await marketplace.connect(producer1).createListing(
        ethers.parseEther('10'),
        ethers.parseEther('0.000001')  // Ultra cheap: 0.000001 ETH per GHC
    );
    console.log('✅ Producer1 listed 10 GHC at 0.000001 ETH each');
    console.log('   💰 Total cost: 0.00001 ETH for 10 GHC');
    
    // Test affordable purchase
    console.log('\n💳 Testing affordable purchase...');
    
    // Buy 5 GHC from the cheapest listing (listing 3)
    const purchaseAmount = ethers.parseEther('5');
    const listing = await marketplace.getListing(3);
    const totalPrice = purchaseAmount * listing.pricePerUnit / ethers.parseEther('1');
    
    console.log('Purchase details:');
    console.log('- Amount: 5 GHC');
    console.log('- Price per unit:', ethers.formatEther(listing.pricePerUnit), 'ETH');
    console.log('- Total cost:', ethers.formatEther(totalPrice), 'ETH');
    
    try {
        const tx = await marketplace.connect(buyer1).purchaseCredits(3, purchaseAmount, {
            value: totalPrice
        });
        await tx.wait();
        console.log('✅ Purchase successful!');
        
        const buyerBalance = await hydrogenCredit.balanceOf(buyer1.address);
        console.log('Buyer GHC balance:', ethers.formatEther(buyerBalance), 'GHC');
    } catch (error) {
        console.log('❌ Purchase failed:', error.reason || error.message);
    }
    
    // Show all available listings
    console.log('\n🏷️ Available affordable listings:');
    const stats = await marketplace.getMarketplaceStats();
    console.log('Total listings:', stats[0].toString());
    
    for (let i = 1; i <= Number(stats[0]); i++) {
        const listing = await marketplace.getListing(i);
        if (listing.isActive) {
            const totalCost = listing.amount * listing.pricePerUnit / ethers.parseEther('1');
            console.log(`\nListing ${i}:`);
            console.log(`  Amount: ${ethers.formatEther(listing.amount)} GHC`);
            console.log(`  Price: ${ethers.formatEther(listing.pricePerUnit)} ETH per GHC`);
            console.log(`  Total cost: ${ethers.formatEther(totalCost)} ETH`);
        }
    }
    
    // Output contract addresses for frontend
    console.log('\n🌐 Contract addresses for frontend:');
    console.log(`hydrogenCreditAddress: '${creditAddress}' as Address,`);
    console.log(`marketplaceAddress: '${marketplaceAddress}' as Address,`);
    
    console.log('\n✅ Affordable marketplace deployed successfully!');
    console.log('🎯 You can now test GHC purchases with very low costs:');
    console.log('   - Smallest test: ~0.00001 ETH');
    console.log('   - Medium test: ~0.001 ETH');
    console.log('   - All operations work with minimal ETH required');
    
    return {
        creditAddress,
        marketplaceAddress
    };
}

main()
    .then((addresses) => {
        console.log('\n🎉 Ready for affordable GHC testing!');
        console.log('Update your frontend with these addresses for cheap testing.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error deploying cheap marketplace:', error);
        process.exit(1);
    });
