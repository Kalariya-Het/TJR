import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Populating dashboard with test data...");

  // Get signers
  const [owner, producer1, producer2, buyer1] = await ethers.getSigners();
  
  console.log("👤 Using accounts:");
  console.log("- Owner (Contract Admin):", owner.address);
  console.log("- Producer 1:", producer1.address);
  console.log("- Producer 2:", producer2.address);
  console.log("- Buyer 1:", buyer1.address);

  // Get deployed contract addresses (default Hardhat addresses)
  const hydrogenCreditAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const marketplaceAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Connect to contracts
  console.log("\n📋 Connecting to contracts...");
  const HydrogenCredit = await ethers.getContractAt("HydrogenCredit", hydrogenCreditAddress);
  const Marketplace = await ethers.getContractAt("HydrogenCreditMarketplace", marketplaceAddress);

  console.log("- HydrogenCredit:", hydrogenCreditAddress);
  console.log("- Marketplace:", marketplaceAddress);

  // Step 1: Register producers (check if already registered)
  console.log("\n🏭 Checking and registering producers...");
  
  // Check Producer 1
  try {
    const producer1Info = await HydrogenCredit.getProducer(producer1.address);
    if (producer1Info.isActive) {
      console.log("ℹ️  Producer 1 already registered:", producer1Info.plantId);
    } else {
      throw new Error("Not active");
    }
  } catch {
    const producer1Tx = await HydrogenCredit.registerProducer(
      producer1.address,
      "SOLAR-PLANT-001",
      "Munich, Germany",
      "Solar"
    );
    await producer1Tx.wait();
    console.log("✅ Producer 1 registered: Solar plant in Munich");
  }

  // Check Producer 2
  try {
    const producer2Info = await HydrogenCredit.getProducer(producer2.address);
    if (producer2Info.isActive) {
      console.log("ℹ️  Producer 2 already registered:", producer2Info.plantId);
    } else {
      throw new Error("Not active");
    }
  } catch {
    const producer2Tx = await HydrogenCredit.registerProducer(
      producer2.address,
      "WIND-PLANT-002", 
      "Hamburg, Germany",
      "Wind"
    );
    await producer2Tx.wait();
    console.log("✅ Producer 2 registered: Wind plant in Hamburg");
  }

  // Step 2: Issue credits to producers
  console.log("\n💳 Issuing credits to producers...");
  
  const amount1 = ethers.parseEther("1500"); // 1500 kg of hydrogen
  const issueCredits1Tx = await HydrogenCredit.issueCredits(
    producer1.address,
    amount1,
    Math.floor(Date.now() / 1000) - 86400 // Yesterday
  );
  await issueCredits1Tx.wait();
  console.log("✅ Issued 1500 GHC to Producer 1 (Solar)");

  const amount2 = ethers.parseEther("2000"); // 2000 kg of hydrogen  
  const issueCredits2Tx = await HydrogenCredit.issueCredits(
    producer2.address,
    amount2,
    Math.floor(Date.now() / 1000) - 172800 // 2 days ago
  );
  await issueCredits2Tx.wait();
  console.log("✅ Issued 2000 GHC to Producer 2 (Wind)");

  // Step 3: Create marketplace listings
  console.log("\n🛒 Creating marketplace listings...");

  // Producer 1 creates listing
  const listingAmount1 = ethers.parseEther("500"); // 500 kg
  const pricePerUnit1 = ethers.parseEther("0.1"); // 0.1 ETH per credit

  // First approve marketplace to spend tokens
  const approve1Tx = await HydrogenCredit.connect(producer1).approve(marketplaceAddress, listingAmount1);
  await approve1Tx.wait();

  const createListing1Tx = await Marketplace.connect(producer1).createListing(listingAmount1, pricePerUnit1);
  await createListing1Tx.wait();
  console.log("✅ Producer 1 listed 500 GHC at 0.1 ETH each");

  // Producer 2 creates listing
  const listingAmount2 = ethers.parseEther("800"); // 800 kg
  const pricePerUnit2 = ethers.parseEther("0.08"); // 0.08 ETH per credit

  const approve2Tx = await HydrogenCredit.connect(producer2).approve(marketplaceAddress, listingAmount2);
  await approve2Tx.wait();

  const createListing2Tx = await Marketplace.connect(producer2).createListing(listingAmount2, pricePerUnit2);
  await createListing2Tx.wait();
  console.log("✅ Producer 2 listed 800 GHC at 0.08 ETH each");

  // Skip marketplace purchases for now - focus on producer credits issue

  // Step 4: Display final statistics
  console.log("\n📊 Final Statistics:");
  
  const totalSupply = await HydrogenCredit.totalSupply();
  const totalRetired = await HydrogenCredit.totalRetiredCredits();
  const totalBatches = await HydrogenCredit.totalCreditBatches();
  const producerCount = await HydrogenCredit.getRegisteredProducersCount();
  
  console.log("- Total Supply:", ethers.formatEther(totalSupply), "GHC");
  console.log("- Total Retired:", ethers.formatEther(totalRetired), "GHC");
  console.log("- Total Batches:", totalBatches.toString());
  console.log("- Registered Producers:", producerCount.toString());

  const marketStats = await Marketplace.getMarketplaceStats();
  console.log("- Total Listings Created:", marketStats[0].toString());
  console.log("- Total Traded Volume:", ethers.formatEther(marketStats[2]), "GHC");
  console.log("- Platform Fee:", marketStats[3].toString() / 100, "%");

  // Step 5: Display account balances
  console.log("\n💰 Account Balances:");
  
  const ownerBalance = await HydrogenCredit.balanceOf(owner.address);
  const producer1Balance = await HydrogenCredit.balanceOf(producer1.address);
  const producer2Balance = await HydrogenCredit.balanceOf(producer2.address);
  const buyer1Balance = await HydrogenCredit.balanceOf(buyer1.address);

  console.log("- Owner:", ethers.formatEther(ownerBalance), "GHC");
  console.log("- Producer 1:", ethers.formatEther(producer1Balance), "GHC");
  console.log("- Producer 2:", ethers.formatEther(producer2Balance), "GHC");
  console.log("- Buyer 1:", ethers.formatEther(buyer1Balance), "GHC");

  console.log("\n🎉 Test data population completed!");
  console.log("🔄 Refresh your dashboard to see the updated data!");
}

main()
  .then(() => {
    console.log("\n✅ Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });
