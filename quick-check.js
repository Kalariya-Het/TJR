const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Quick Contract State Check...\n");

    // Get contract instances with correct addresses
    const hydrogenCreditAddress = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const marketplaceAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

    const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
    const hydrogenCredit = HydrogenCredit.attach(hydrogenCreditAddress);

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

        console.log(`- Name: ${name}`);
        console.log(`- Symbol: ${symbol}`);
        console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} GHC`);

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

        console.log("\n✅ Dashboard Data Summary:");
        console.log("============================");
        console.log(`Total Hydrogen Credits: ${ethers.formatEther(totalSupply)} GHC`);
        console.log(`Registered Producers: 1 (${producer.address})`);
        console.log(`Producer Balance: ${ethers.formatEther(producerBalance)} GHC`);

        console.log("\n🎯 Next Steps:");
        console.log("1. Start your frontend: cd frontend && npm start");
        console.log("2. Connect MetaMask to Hardhat Local (Chain ID: 1337)");
        console.log("3. Import the producer account to see the data:");
        console.log(`   Producer: ${producer.address}`);
        console.log(`   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`);

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
