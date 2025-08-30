const { ethers } = require("hardhat");

async function main() {
  console.log("🌱 Starting to populate test data...");

  // Get contract instances
  const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
  const HydrogenCreditMarketplace = await ethers.getContractFactory("HydrogenCreditMarketplace");
  
  // Contract addresses from deployment
  const creditAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const marketplaceAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  
  const creditContract = HydrogenCredit.attach(creditAddress);
  const marketplaceContract = HydrogenCreditMarketplace.attach(marketplaceAddress);

  console.log("📋 Contract addresses:");
  console.log("HydrogenCredit:", await creditContract.getAddress());
  console.log("HydrogenCreditMarketplace:", await marketplaceContract.getAddress());

  // Get signers (test accounts)
  const [owner, producer1, producer2, buyer1, buyer2] = await ethers.getSigners();
  
  console.log("\n👥 Using test accounts:");
  console.log("Owner:", owner.address);
  console.log("Producer1:", producer1.address);
  console.log("Producer2:", producer2.address);
  console.log("Buyer1:", buyer1.address);
  console.log("Buyer2:", buyer2.address);

  try {
    // Register producers
    console.log("\n🏭 Registering producers...");
    
    // Check if producer1 is already registered
    try {
      const producer1Info = await creditContract.getProducer(producer1.address);
      if (!producer1Info.isActive) {
        await creditContract.connect(owner).registerProducer(
          producer1.address,
          "GreenTech Hydrogen Ltd",
          "Solar-powered electrolysis facility in California",
          "Solar Electrolysis"
        );
        console.log("✅ Producer 1 registered:", producer1.address);
      } else {
        console.log("✅ Producer 1 already registered:", producer1.address);
      }
    } catch (e) {
      // Producer not registered, register them
      await creditContract.connect(owner).registerProducer(
        producer1.address,
        "GreenTech Hydrogen Ltd",
        "Solar-powered electrolysis facility in California",
        "Solar Electrolysis"
      );
      console.log("✅ Producer 1 registered:", producer1.address);
    }

    // Register producer2
    try {
      const producer2Info = await creditContract.getProducer(producer2.address);
      if (!producer2Info.isActive) {
        await creditContract.connect(owner).registerProducer(
          producer2.address,
          "EcoHydrogen Corp",
          "Wind-powered hydrogen production in Texas",
          "Wind Electrolysis"
        );
        console.log("✅ Producer 2 registered:", producer2.address);
      } else {
        console.log("✅ Producer 2 already registered:", producer2.address);
      }
    } catch (e) {
      // Producer not registered, register them
      await creditContract.connect(owner).registerProducer(
        producer2.address,
        "EcoHydrogen Corp",
        "Wind-powered hydrogen production in Texas",
        "Wind Electrolysis"
      );
      console.log("✅ Producer 2 registered:", producer2.address);
    }

    // Issue credits to producers
    console.log("\n💰 Issuing credits...");
    
    // Issue 1000 credits to producer1
    await creditContract.connect(owner).issueCredits(
      producer1.address,
      ethers.parseUnits("1000", 18),
      Math.floor(Date.now() / 1000) - 86400 // Yesterday
    );
    console.log("✅ 1000 credits issued to Producer 1");

    // Issue 750 credits to producer2
    await creditContract.connect(owner).issueCredits(
      producer2.address,
      ethers.parseUnits("750", 18),
      Math.floor(Date.now() / 1000) - 86400 // Yesterday
    );
    console.log("✅ 750 credits issued to Producer 2");

    // Issue more credits
    await creditContract.connect(owner).issueCredits(
      producer1.address,
      ethers.parseUnits("500", 18),
      Math.floor(Date.now() / 1000) - 43200 // 12 hours ago
    );
    console.log("✅ 500 more credits issued to Producer 1");

    // Create marketplace listings
    console.log("\n🛒 Creating marketplace listings...");
    
    // Producer1 creates a listing for 300 credits at 0.01 ETH each
    await creditContract.connect(producer1).approve(await marketplaceContract.getAddress(), ethers.parseUnits("300", 18));
    await marketplaceContract.connect(producer1).createListing(
      ethers.parseUnits("300", 18),
      ethers.parseEther("0.01")
    );
    console.log("✅ Producer 1 listed 300 credits at 0.01 ETH each");

    // Producer2 creates a listing for 200 credits at 0.015 ETH each
    await creditContract.connect(producer2).approve(await marketplaceContract.getAddress(), ethers.parseUnits("200", 18));
    await marketplaceContract.connect(producer2).createListing(
      ethers.parseUnits("200", 18),
      ethers.parseEther("0.015")
    );
    console.log("✅ Producer 2 listed 200 credits at 0.015 ETH each");

    // Create another listing from producer1
    await creditContract.connect(producer1).approve(await marketplaceContract.getAddress(), ethers.parseUnits("150", 18));
    await marketplaceContract.connect(producer1).createListing(
      ethers.parseUnits("150", 18),
      ethers.parseEther("0.012")
    );
    console.log("✅ Producer 1 listed 150 more credits at 0.012 ETH each");

    // Skip purchases and retirements for initial population
    console.log("\n⏭️ Skipping purchases and retirements for initial data population...");

    // Display final statistics
    console.log("\n📊 Final Statistics:");
    
    const totalSupply = await creditContract.totalSupply();
    console.log(`Total Supply: ${ethers.formatUnits(totalSupply, 18)} HGC`);
    
    const totalRetired = await creditContract.totalRetiredCredits();
    console.log(`Total Retired: ${ethers.formatUnits(totalRetired, 18)} GHC`);
    
    const totalBatches = await creditContract.totalCreditBatches();
    console.log(`Total Batches: ${totalBatches.toString()}`);
    
    const registeredProducers = await creditContract.getRegisteredProducersCount();
    console.log(`Registered Producers: ${registeredProducers.toString()}`);

    // Show balances
    console.log("\n💰 Account Balances:");
    const producer1Balance = await creditContract.balanceOf(producer1.address);
    console.log(`Producer 1: ${ethers.formatUnits(producer1Balance, 18)} HGC`);
    
    const producer2Balance = await creditContract.balanceOf(producer2.address);
    console.log(`Producer 2: ${ethers.formatUnits(producer2Balance, 18)} HGC`);
    
    const buyer1Balance = await creditContract.balanceOf(buyer1.address);
    console.log(`Buyer 1: ${ethers.formatUnits(buyer1Balance, 18)} HGC`);
    
    const buyer2Balance = await creditContract.balanceOf(buyer2.address);
    console.log(`Buyer 2: ${ethers.formatUnits(buyer2Balance, 18)} HGC`);

    console.log("\n🎉 Test data population completed successfully!");
    
  } catch (error) {
    console.error("❌ Error populating test data:", error.message);
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
