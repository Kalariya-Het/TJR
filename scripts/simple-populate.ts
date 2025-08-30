import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Populating dashboard with basic test data...");

  // Get signers
  const [owner, producer1, producer2] = await ethers.getSigners();
  
  console.log("👤 Using accounts:");
  console.log("- Owner (Contract Admin):", owner.address);
  console.log("- Producer 1:", producer1.address);
  console.log("- Producer 2:", producer2.address);

  // Get deployed contract addresses
  const hydrogenCreditAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const marketplaceAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  // Connect to contracts
  console.log("\n📋 Connecting to contracts...");
  const HydrogenCredit = await ethers.getContractAt("HydrogenCredit", hydrogenCreditAddress);
  const Marketplace = await ethers.getContractAt("HydrogenCreditMarketplace", marketplaceAddress);

  // Check and register Producer 2 if needed
  console.log("\n🏭 Ensuring Producer 2 is registered...");
  try {
    const producer2Info = await HydrogenCredit.getProducer(producer2.address);
    if (!producer2Info.isActive) {
      const producer2Tx = await HydrogenCredit.registerProducer(
        producer2.address,
        "WIND-PLANT-002",
        "Hamburg, Germany",
        "Wind"
      );
      await producer2Tx.wait();
      console.log("✅ Producer 2 registered: Wind plant in Hamburg");
    } else {
      console.log("ℹ️  Producer 2 already registered:", producer2Info.plantId);
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

  // Issue more credits to both producers
  console.log("\n💳 Issuing additional credits...");
  
  const amount1 = ethers.parseEther("800"); // 800 kg of hydrogen
  const issueCredits1Tx = await HydrogenCredit.issueCredits(
    producer1.address,
    amount1,
    Math.floor(Date.now() / 1000) - 86400 // Yesterday
  );
  await issueCredits1Tx.wait();
  console.log("✅ Issued 800 GHC to Producer 1");

  const amount2 = ethers.parseEther("1200"); // 1200 kg of hydrogen  
  const issueCredits2Tx = await HydrogenCredit.issueCredits(
    producer2.address,
    amount2,
    Math.floor(Date.now() / 1000) - 172800 // 2 days ago
  );
  await issueCredits2Tx.wait();
  console.log("✅ Issued 1200 GHC to Producer 2");

  // Create marketplace listings
  console.log("\n🛒 Creating marketplace listings...");

  // Producer 1 creates listing
  const listingAmount1 = ethers.parseEther("300"); // 300 kg
  const pricePerUnit1 = ethers.parseEther("0.05"); // 0.05 ETH per credit

  const approve1Tx = await HydrogenCredit.connect(producer1).approve(marketplaceAddress, listingAmount1);
  await approve1Tx.wait();

  const createListing1Tx = await Marketplace.connect(producer1).createListing(listingAmount1, pricePerUnit1);
  await createListing1Tx.wait();
  console.log("✅ Producer 1 listed 300 GHC at 0.05 ETH each");

  // Producer 2 creates listing
  const listingAmount2 = ethers.parseEther("500"); // 500 kg
  const pricePerUnit2 = ethers.parseEther("0.04"); // 0.04 ETH per credit

  const approve2Tx = await HydrogenCredit.connect(producer2).approve(marketplaceAddress, listingAmount2);
  await approve2Tx.wait();

  const createListing2Tx = await Marketplace.connect(producer2).createListing(listingAmount2, pricePerUnit2);
  await createListing2Tx.wait();
  console.log("✅ Producer 2 listed 500 GHC at 0.04 ETH each");

  // Display final statistics
  console.log("\n📊 Dashboard Data:");
  
  const totalSupply = await HydrogenCredit.totalSupply();
  const totalRetired = await HydrogenCredit.totalRetiredCredits();
  const totalBatches = await HydrogenCredit.totalCreditBatches();
  const producerCount = await HydrogenCredit.getRegisteredProducersCount();
  
  console.log("- Total Supply:", ethers.formatEther(totalSupply), "GHC");
  console.log("- Total Retired:", ethers.formatEther(totalRetired), "GHC");
  console.log("- Total Batches:", totalBatches.toString());
  console.log("- Registered Producers:", producerCount.toString());

  const marketStats = await Marketplace.getMarketplaceStats();
  console.log("- Total Listings:", marketStats[0].toString());
  console.log("- Active Listings:", marketStats[1].toString());

  // Display account balances for connected wallet address
  console.log("\n💰 Account Balances:");
  console.log("- Owner:", ethers.formatEther(await HydrogenCredit.balanceOf(owner.address)), "GHC");
  console.log("- Producer 1:", ethers.formatEther(await HydrogenCredit.balanceOf(producer1.address)), "GHC");  
  console.log("- Producer 2:", ethers.formatEther(await HydrogenCredit.balanceOf(producer2.address)), "GHC");

  console.log("\n🎉 Dashboard populated successfully!");
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
