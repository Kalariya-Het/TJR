const { ethers } = require('hardhat');

async function main() {
    console.log('💰 Creating affordable marketplace listings for testing...');
    
    // Get signers
    const [owner, producer1, producer2, buyer1] = await ethers.getSigners();
    
    // Use existing deployed contracts
    const CREDIT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    const MARKETPLACE_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    
    console.log('📋 Using contracts:');
    console.log('HydrogenCredit:', CREDIT_ADDRESS);
    console.log('Marketplace:', MARKETPLACE_ADDRESS);
    
    // Get contract instances
    const hydrogenCredit = await ethers.getContractAt('HydrogenCredit', CREDIT_ADDRESS);
    const marketplace = await ethers.getContractAt('HydrogenCreditMarketplace', MARKETPLACE_ADDRESS);
    
    // Check producer balances
    console.log('\n💰 Checking producer balances...');
    const producer1Balance = await hydrogenCredit.balanceOf(producer1.address);
    const producer2Balance = await hydrogenCredit.balanceOf(producer2.address);
    console.log('Producer1 balance:', ethers.formatEther(producer1Balance), 'GHC');
    console.log('Producer2 balance:', ethers.formatEther(producer2Balance), 'GHC');
    
    // Create very affordable listings
    console.log('\n🛒 Creating affordable test listings...');
    
    try {
        // Producer1: 100 credits at 0.0001 ETH each (very cheap!)
        const tx1 = await marketplace.connect(producer1).createListing(
            ethers.parseEther('100'),        // 100 GHC
            ethers.parseEther('0.0001')      // 0.0001 ETH per GHC (very affordable)
        );
        await tx1.wait();
        console.log('✅ Producer1 listed 100 GHC at 0.0001 ETH each (Total: 0.01 ETH for 100 GHC)');
    } catch (error) {
        console.log('Producer1 listing failed:', error.message);
    }
    
    try {
        // Producer2: 50 credits at 0.0002 ETH each (still very cheap!)
        const tx2 = await marketplace.connect(producer2).createListing(
            ethers.parseEther('50'),         // 50 GHC
            ethers.parseEther('0.0002')      // 0.0002 ETH per GHC
        );
        await tx2.wait();
        console.log('✅ Producer2 listed 50 GHC at 0.0002 ETH each (Total: 0.01 ETH for 50 GHC)');
    } catch (error) {
        console.log('Producer2 listing failed:', error.message);
    }
    
    try {
        // Producer1: Another listing with even smaller amounts for micro-testing
        const tx3 = await marketplace.connect(producer1).createListing(
            ethers.parseEther('10'),         // 10 GHC
            ethers.parseEther('0.00001')     // 0.00001 ETH per GHC (extremely cheap)
        );
        await tx3.wait();
        console.log('✅ Producer1 listed 10 GHC at 0.00001 ETH each (Total: 0.0001 ETH for 10 GHC)');
    } catch (error) {
        console.log('Producer1 micro listing failed:', error.message);
    }
    
    // Check marketplace stats
    console.log('\n📊 Current marketplace statistics:');
    const stats = await marketplace.getMarketplaceStats();
    console.log('Total listings created:', stats[0].toString());
    console.log('Active listings:', stats[1].toString());
    
    // Show all active listings with prices
    console.log('\n🏷️ Available listings for testing:');
    const totalListings = Number(stats[0]);
    
    for (let i = 1; i <= totalListings; i++) {
        try {
            const listing = await marketplace.getListing(i);
            if (listing.isActive) {
                const totalCost = listing.amount * listing.pricePerUnit / ethers.parseEther('1');
                console.log(`Listing ${i}:`);
                console.log(`  - Amount: ${ethers.formatEther(listing.amount)} GHC`);
                console.log(`  - Price per unit: ${ethers.formatEther(listing.pricePerUnit)} ETH`);
                console.log(`  - Total cost: ${ethers.formatEther(totalCost)} ETH`);
                console.log(`  - Seller: ${listing.seller}`);
                console.log('');
            }
        } catch (error) {
            // Skip invalid listings
        }
    }
    
    // Test purchase with affordable pricing
    console.log('💳 Testing affordable purchase...');
    try {
        // Find the cheapest active listing
        let cheapestListing = null;
        let cheapestId = 0;
        let lowestPrice = ethers.parseEther('999999');
        
        for (let i = 1; i <= totalListings; i++) {
            try {
                const listing = await marketplace.getListing(i);
                if (listing.isActive && listing.seller !== buyer1.address) {
                    const totalCost = listing.amount * listing.pricePerUnit / ethers.parseEther('1');
                    if (totalCost < lowestPrice) {
                        lowestPrice = totalCost;
                        cheapestListing = listing;
                        cheapestId = i;
                    }
                }
            } catch (error) {
                // Skip invalid listings
            }
        }
        
        if (cheapestListing) {
            // Buy a small amount from the cheapest listing
            const purchaseAmount = ethers.parseEther('1'); // Buy just 1 GHC
            const totalPrice = purchaseAmount * cheapestListing.pricePerUnit / ethers.parseEther('1');
            
            console.log(`Attempting to buy 1 GHC from listing ${cheapestId}:`);
            console.log(`Price per unit: ${ethers.formatEther(cheapestListing.pricePerUnit)} ETH`);
            console.log(`Total cost: ${ethers.formatEther(totalPrice)} ETH`);
            
            const buyerBalanceBefore = await hydrogenCredit.balanceOf(buyer1.address);
            
            const tx = await marketplace.connect(buyer1).purchaseCredits(cheapestId, purchaseAmount, {
                value: totalPrice
            });
            await tx.wait();
            
            const buyerBalanceAfter = await hydrogenCredit.balanceOf(buyer1.address);
            console.log('✅ Purchase successful!');
            console.log('Buyer GHC balance before:', ethers.formatEther(buyerBalanceBefore));
            console.log('Buyer GHC balance after:', ethers.formatEther(buyerBalanceAfter));
        }
    } catch (error) {
        console.log('❌ Test purchase failed:', error.reason || error.message);
        
        // Show exact calculation for debugging
        if (cheapestListing) {
            console.log('\nDebugging purchase calculation:');
            const purchaseAmount = ethers.parseEther('1');
            const pricePerUnit = cheapestListing.pricePerUnit;
            const calculatedPrice = purchaseAmount * pricePerUnit / ethers.parseEther('1');
            console.log('Purchase amount (wei):', purchaseAmount.toString());
            console.log('Price per unit (wei):', pricePerUnit.toString());
            console.log('Calculated total (wei):', calculatedPrice.toString());
            console.log('Calculated total (ETH):', ethers.formatEther(calculatedPrice));
        }
    }
    
    console.log('\n✅ Affordable marketplace listings created!');
    console.log('🎯 You can now easily test GHC purchases with very low costs');
    console.log('💡 Smallest purchase: ~0.0001 ETH for testing');
}

main()
    .then(() => {
        console.log('\n🎉 Marketplace now has affordable listings for easy testing!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error creating affordable listings:', error);
        process.exit(1);
    });
