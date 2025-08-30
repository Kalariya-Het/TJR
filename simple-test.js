const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Simple Test Script for Dashboard Data...\n");

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
    // Check if producer is already registered
    console.log("🔍 Checking current state...");

    const producerInfo = await hydrogenCredit.producers(producer.address);
    const isProducerRegistered = producerInfo.isActive;
    console.log(`Producer registered: ${isProducerRegistered}`);

    if (isProducerRegistered) {
      const producerBalance = await hydrogenCredit.balanceOf(producer.address);
      console.log(`Producer balance: ${ethers.formatEther(producerBalance)} GHC`);
    }

    // Get contract stats for dashboard
    console.log("\n📊 Contract Stats (for Dashboard):");
    const stats = await hydrogenCredit.getContractStats();
    console.log(`- Total Supply: ${ethers.formatEther(stats[0])} GHC`);
    console.log(`- Total Batches: ${stats[1].toString()}`);
    console.log(`- Total Retired: ${ethers.formatEther(stats[2])} GHC`);
    console.log(`- Producer Count: ${stats[3].toString()}`);

    // Register additional producers for more dashboard data
    console.log("\n🏭 Registering additional producers...");

    // Register Buyer1 as producer
    try {
      await hydrogenCredit.connect(owner).registerProducer(
        buyer1.address,
        "PLANT-002",
        "Berlin, Germany",
        "Wind"
      );
      console.log(`✅ Buyer1 registered as producer`);

      // Issue credits to Buyer1
      const credits1 = ethers.parseEther("500");
      await hydrogenCredit.connect(owner).issueCredits(
        buyer1.address,
        credits1,
        Math.floor(Date.now() / 1000)
      );
      console.log(`✅ ${ethers.formatEther(credits1)} GHC issued to Buyer1`);
    } catch (error) {
      if (error.message.includes("Producer already registered")) {
        console.log(`ℹ️  Buyer1 already registered as producer`);
      } else {
        console.log(`❌ Error registering Buyer1: ${error.message}`);
      }
    }

    // Register Buyer2 as producer
    try {
      await hydrogenCredit.connect(owner).registerProducer(
        buyer2.address,
        "PLANT-003",
        "Hamburg, Germany",
        "Hydroelectric"
      );
      console.log(`✅ Buyer2 registered as producer`);

      // Issue credits to Buyer2
      const credits2 = ethers.parseEther("300");
      await hydrogenCredit.connect(owner).issueCredits(
        buyer2.address,
        credits2,
        Math.floor(Date.now() / 1000)
      );
      console.log(`✅ ${ethers.formatEther(credits2)} GHC issued to Buyer2`);
    } catch (error) {
      if (error.message.includes("Producer already registered")) {
        console.log(`ℹ️  Buyer2 already registered as producer`);
      } else {
        console.log(`❌ Error registering Buyer2: ${error.message}`);
      }
    }

    // Create some marketplace listings
    console.log("\n🛒 Creating marketplace listings...");

    try {
      // Producer creates a listing
      const listingAmount = ethers.parseEther("100");
      const pricePerUnit = ethers.parseEther("0.001"); // 0.001 ETH per GHC

      await marketplace.connect(producer).createListing(
        listingAmount,
        pricePerUnit,
        "Solar-powered hydrogen production"
      );
      console.log(`✅ Producer created listing: ${ethers.formatEther(listingAmount)} GHC at ${ethers.formatEther(pricePerUnit)} ETH per unit`);
    } catch (error) {
      console.log(`❌ Error creating producer listing: ${error.message}`);
    }

    try {
      // Buyer1 creates a listing
      const listingAmount2 = ethers.parseEther("50");
      const pricePerUnit2 = ethers.parseEther("0.002"); // 0.002 ETH per GHC

      await marketplace.connect(buyer1).createListing(
        listingAmount2,
        pricePerUnit2,
        "Wind-powered hydrogen production"
      );
      console.log(`✅ Buyer1 created listing: ${ethers.formatEther(listingAmount2)} GHC at ${ethers.formatEther(pricePerUnit2)} ETH per unit`);
    } catch (error) {
      console.log(`❌ Error creating Buyer1 listing: ${error.message}`);
    }

    // Final dashboard data
    console.log("\n🎯 Final Dashboard Data Summary:");
    console.log("=================================");

    const finalStats = await hydrogenCredit.getContractStats();
    console.log(`- Total Supply: ${ethers.formatEther(finalStats[0])} GHC`);
    console.log(`- Total Batches: ${finalStats[1].toString()}`);
    console.log(`- Total Retired: ${ethers.formatEther(finalStats[2])} GHC`);
    console.log(`- Producer Count: ${finalStats[3].toString()}`);

    const producerBalance = await hydrogenCredit.balanceOf(producer.address);
    const buyer1Balance = await hydrogenCredit.balanceOf(buyer1.address);
    const buyer2Balance = await hydrogenCredit.balanceOf(buyer2.address);

    console.log(`\nAccount Balances:`);
    console.log(`- Producer: ${ethers.formatEther(producerBalance)} GHC`);
    console.log(`- Buyer1:   ${ethers.formatEther(buyer1Balance)} GHC`);
    console.log(`- Buyer2:   ${ethers.formatEther(buyer2Balance)} GHC`);

    console.log(`\n✅ Dashboard is now populated with test data!`);
    console.log(`🌐 Start your frontend with: cd frontend && npm start`);
    console.log(`🔗 Connect MetaMask to: http://127.0.0.1:8545 (Chain ID: 1337)`);
    console.log(`📱 Import one of these accounts to see the data:`);
    console.log(`   - Producer: ${producer.address}`);
    console.log(`   - Buyer1:   ${buyer1.address}`);
    console.log(`   - Buyer2:   ${buyer2.address}`);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
