const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Checking Contract State...\n");

    // Get contract instances with correct addresses
    const hydrogenCreditAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const marketplaceAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

    const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
    const hydrogenCredit = HydrogenCredit.attach(hydrogenCreditAddress);

    const Marketplace = await ethers.getContractFactory("HydrogenCreditMarketplace");
    const marketplace = Marketplace.attach(marketplaceAddress);

    // Get signers (test accounts)
    const [owner, producer, buyer1, buyer2] = await ethers.getSigners();

    console.log("📋 Test Accounts:");
    console.log(`Owner:     ${owner.address}`);
    console.log(`Producer:  ${producer.address}`);
    console.log(`Buyer 1:   ${buyer1.address}`);
    console.log(`Buyer 2:   ${buyer2.address}\n`);

    try {
        // Check basic contract info
        console.log("📊 Basic Contract Info:");
        const name = await hydrogenCredit.name();
        const symbol = await hydrogenCredit.symbol();
        const totalSupply = await hydrogenCredit.totalSupply();
        const ownerAddress = await hydrogenCredit.owner();

        console.log(`- Name: ${name}`);
        console.log(`- Symbol: ${symbol}`);
        console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} GHC`);
        console.log(`- Owner: ${ownerAddress}`);

        // Check balances
        console.log("\n💰 Account Balances:");
        const ownerBalance = await hydrogenCredit.balanceOf(owner.address);
        const producerBalance = await hydrogenCredit.balanceOf(producer.address);
        const buyer1Balance = await hydrogenCredit.balanceOf(buyer1.address);
        const buyer2Balance = await hydrogenCredit.balanceOf(buyer2.address);

        console.log(`- Owner:    ${ethers.formatEther(ownerBalance)} GHC`);
        console.log(`- Producer: ${ethers.formatEther(producerBalance)} GHC`);
        console.log(`- Buyer1:   ${ethers.formatEther(buyer1Balance)} GHC`);
        console.log(`- Buyer2:   ${ethers.formatEther(buyer2Balance)} GHC`);

        // Try to get contract stats
        console.log("\n📈 Contract Stats:");
        try {
            const stats = await hydrogenCredit.getContractStats();
            console.log(`- Total Supply: ${ethers.formatEther(stats[0])} GHC`);
            console.log(`- Total Batches: ${stats[1].toString()}`);
            console.log(`- Total Retired: ${ethers.formatEther(stats[2])} GHC`);
            console.log(`- Producer Count: ${stats[3].toString()}`);
        } catch (error) {
            console.log(`❌ Could not get contract stats: ${error.message}`);
        }

        // Check if we need to populate data
        if (totalSupply === 0n) {
            console.log("\n🚨 No data found! Let's populate the contracts...");

            // Register producer
            console.log("🏭 Registering producer...");
            await hydrogenCredit.connect(owner).registerProducer(
                producer.address,
                "PLANT-001",
                "Test Location, Germany",
                "Solar"
            );
            console.log("✅ Producer registered");

            // Issue credits
            console.log("💎 Issuing credits...");
            const credits = ethers.parseEther("1000");
            await hydrogenCredit.connect(owner).issueCredits(
                producer.address,
                credits,
                Math.floor(Date.now() / 1000)
            );
            console.log(`✅ ${ethers.formatEther(credits)} GHC issued to producer`);

            // Check new balance
            const newProducerBalance = await hydrogenCredit.balanceOf(producer.address);
            console.log(`📊 New producer balance: ${ethers.formatEther(newProducerBalance)} GHC`);

        } else {
            console.log("\n✅ Contracts already have data!");
        }

        console.log("\n🎯 Next Steps:");
        console.log("1. Start your frontend: cd frontend && npm start");
        console.log("2. Connect MetaMask to Hardhat Local (Chain ID: 1337)");
        console.log("3. Import one of these accounts to see the data");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
