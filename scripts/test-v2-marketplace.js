const { ethers } = require('hardhat');

async function main() {
    console.log('🛒 Testing V2 marketplace functionality...');
    
    // Get signers
    const [owner, producer1, producer2, buyer1] = await ethers.getSigners();
    
    // V2 Contract addresses (already deployed)
    const CREDIT_V2_ADDRESS = '0x9A676e781A523b5d0C0e43731313A708CB607508';
    const MARKETPLACE_ADDRESS = '0x0B306BF915C4d645ff596e518fAf3F9669b97016';
    const ORACLE_ADDRESS = '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82';
    
    // Get contract instances
    const creditV2 = await ethers.getContractAt('HydrogenCreditV2', CREDIT_V2_ADDRESS);
    const marketplace = await ethers.getContractAt('HydrogenCreditMarketplace', MARKETPLACE_ADDRESS);
    const oracle = await ethers.getContractAt('ProductionOracle', ORACLE_ADDRESS);
    
    console.log('📋 V2 Contract addresses:');
    console.log('HydrogenCreditV2:', CREDIT_V2_ADDRESS);
    console.log('Marketplace:', MARKETPLACE_ADDRESS);
    console.log('Oracle:', ORACLE_ADDRESS);
    
    // Check if producers are already registered
    console.log('\n🏭 Checking producer registration...');
    try {
        const producer1Info = await creditV2.getProducer(producer1.address);
        console.log('Producer 1 already registered:', producer1Info.plantId);
    } catch (error) {
        console.log('Producer 1 not registered, registering now...');
        await creditV2.connect(owner).registerProducer(
            producer1.address,
            'SOLAR-V2-001',
            'California, USA',
            'Solar'
        );
        console.log('✅ Producer 1 registered');
    }
    
    try {
        const producer2Info = await creditV2.getProducer(producer2.address);
        console.log('Producer 2 already registered:', producer2Info.plantId);
    } catch (error) {
        console.log('Producer 2 not registered, registering now...');
        await creditV2.connect(owner).registerProducer(
            producer2.address,
            'WIND-V2-001',
            'Texas, USA', 
            'Wind'
        );
        console.log('✅ Producer 2 registered');
    }
    
    // Check current balances
    console.log('\n💰 Checking current balances...');
    const producer1Balance = await creditV2.balanceOf(producer1.address);
    const producer2Balance = await creditV2.balanceOf(producer2.address);
    console.log('Producer 1 balance:', ethers.formatEther(producer1Balance), 'GHC');
    console.log('Producer 2 balance:', ethers.formatEther(producer2Balance), 'GHC');
    
    // Issue more credits if needed
    if (producer1Balance < ethers.parseEther('100')) {
        console.log('Issuing credits to Producer 1...');
        const currentTime = Math.floor(Date.now() / 1000);
        await creditV2.connect(owner).issueCredits(
            producer1.address,
            ethers.parseEther('500'),
            currentTime
        );
        console.log('✅ 500 credits issued to Producer 1');
    }
    
    if (producer2Balance < ethers.parseEther('100')) {
        console.log('Issuing credits to Producer 2...');
        const currentTime = Math.floor(Date.now() / 1000);
        await creditV2.connect(owner).issueCredits(
            producer2.address,
            ethers.parseEther('300'),
            currentTime
        );
        console.log('✅ 300 credits issued to Producer 2');
    }
    
    // Approve marketplace to spend tokens
    console.log('\n🔓 Approving marketplace...');
    const allowance1 = await creditV2.allowance(producer1.address, MARKETPLACE_ADDRESS);
    if (allowance1 < ethers.parseEther('500')) {
        await creditV2.connect(producer1).approve(MARKETPLACE_ADDRESS, ethers.parseEther('1000'));
        console.log('✅ Marketplace approved for Producer 1');
    }
    
    const allowance2 = await creditV2.allowance(producer2.address, MARKETPLACE_ADDRESS);
    if (allowance2 < ethers.parseEther('300')) {
        await creditV2.connect(producer2).approve(MARKETPLACE_ADDRESS, ethers.parseEther('1000'));
        console.log('✅ Marketplace approved for Producer 2');
    }
    
    // Create marketplace listings
    console.log('\n🛒 Creating marketplace listings...');
    
    // Check current marketplace stats
    const statsBefore = await marketplace.getMarketplaceStats();
    console.log('Current listings:', statsBefore[0].toString());
    
    // Producer 1 creates listing: 200 credits at 0.05 ETH each
    try {
        const tx1 = await marketplace.connect(producer1).createListing(
            ethers.parseEther('200'),
            ethers.parseEther('0.05')
        );
        await tx1.wait();
        console.log('✅ Producer 1 listed 200 credits at 0.05 ETH each');
    } catch (error) {
        console.log('Producer 1 listing may already exist or insufficient balance');
    }
    
    // Producer 2 creates listing: 150 credits at 0.045 ETH each  
    try {
        const tx2 = await marketplace.connect(producer2).createListing(
            ethers.parseEther('150'),
            ethers.parseEther('0.045')
        );
        await tx2.wait();
        console.log('✅ Producer 2 listed 150 credits at 0.045 ETH each');
    } catch (error) {
        console.log('Producer 2 listing may already exist or insufficient balance');
    }
    
    // Check marketplace stats after listings
    console.log('\n📊 Marketplace Statistics:');
    const statsAfter = await marketplace.getMarketplaceStats();
    console.log('Total listings created:', statsAfter[0].toString());
    console.log('Active listings:', statsAfter[1].toString());
    console.log('Total volume:', ethers.formatEther(statsAfter[2]), 'ETH');
    console.log('Platform fee:', statsAfter[3].toString(), '%');
    
    // Test purchase transaction
    console.log('\n💳 Testing purchase transaction...');
    if (statsAfter[1] > 0) {
        try {
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
            const buyerCreditBalance = await creditV2.balanceOf(buyer1.address);
            console.log('Buyer balance after:', ethers.formatEther(buyerBalanceAfter), 'ETH');
            console.log('Buyer credit balance:', ethers.formatEther(buyerCreditBalance), 'GHC');
        } catch (error) {
            console.log('Purchase test failed:', error.message);
        }
    }
    
    // Test price update
    console.log('\n💰 Testing price update...');
    if (statsAfter[1] > 0) {
        try {
            const tx4 = await marketplace.connect(producer1).updateListingPrice(1, ethers.parseEther('0.06'));
            await tx4.wait();
            console.log('✅ Producer 1 updated listing 1 price to 0.06 ETH');
        } catch (error) {
            console.log('Price update test failed:', error.message);
        }
    }
    
    console.log('\n✅ V2 Marketplace test completed!');
    console.log('🌐 Frontend should now connect to working V2 contracts');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error testing V2 marketplace:', error);
        process.exit(1);
    });
