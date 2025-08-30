const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Checking Producer Credits and Balances...");

  // Contract addresses
  const creditAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const marketplaceAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  try {
    // Get contract instances
    const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
    const HydrogenCreditMarketplace = await ethers.getContractFactory("HydrogenCreditMarketplace");
    
    const creditContract = HydrogenCredit.attach(creditAddress);
    const marketplaceContract = HydrogenCreditMarketplace.attach(marketplaceAddress);

    // Get signers (test accounts)
    const [owner, producer1, producer2, buyer1, buyer2] = await ethers.getSigners();

    console.log("\n👥 Account Information:");
    console.log("Owner:", owner.address);
    console.log("Producer1:", producer1.address);
    console.log("Producer2:", producer2.address);
    console.log("Buyer1:", buyer1.address);
    console.log("Buyer2:", buyer2.address);

    console.log("\n💰 Checking Balances for All Accounts:");
    
    // Check balances
    const ownerBalance = await creditContract.balanceOf(owner.address);
    const producer1Balance = await creditContract.balanceOf(producer1.address);
    const producer2Balance = await creditContract.balanceOf(producer2.address);
    const buyer1Balance = await creditContract.balanceOf(buyer1.address);
    const buyer2Balance = await creditContract.balanceOf(buyer2.address);

    console.log(`✅ Owner (${owner.address}): ${ethers.formatUnits(ownerBalance, 18)} GHC`);
    console.log(`✅ Producer1 (${producer1.address}): ${ethers.formatUnits(producer1Balance, 18)} GHC`);
    console.log(`✅ Producer2 (${producer2.address}): ${ethers.formatUnits(producer2Balance, 18)} GHC`);
    console.log(`✅ Buyer1 (${buyer1.address}): ${ethers.formatUnits(buyer1Balance, 18)} GHC`);
    console.log(`✅ Buyer2 (${buyer2.address}): ${ethers.formatUnits(buyer2Balance, 18)} GHC`);

    console.log("\n🏭 Checking Producer Information:");
    
    // Check producer info
    const producer1Info = await creditContract.getProducer(producer1.address);
    const producer2Info = await creditContract.getProducer(producer2.address);

    console.log(`✅ Producer1 Status:`, {
      plantId: producer1Info.plantId,
      location: producer1Info.location,
      renewableSource: producer1Info.renewableSource,
      totalProduced: ethers.formatUnits(producer1Info.totalProduced, 18) + " GHC",
      isActive: producer1Info.isActive
    });

    console.log(`✅ Producer2 Status:`, {
      plantId: producer2Info.plantId,
      location: producer2Info.location,
      renewableSource: producer2Info.renewableSource,
      totalProduced: ethers.formatUnits(producer2Info.totalProduced, 18) + " GHC",
      isActive: producer2Info.isActive
    });

    console.log("\n📦 Checking Production Batches:");
    
    // Check producer batches
    const producer1Batches = await creditContract.getProducerBatches(producer1.address);
    const producer2Batches = await creditContract.getProducerBatches(producer2.address);

    console.log(`✅ Producer1 has ${producer1Batches.length} batches:`, producer1Batches.map(b => b.toString()));
    console.log(`✅ Producer2 has ${producer2Batches.length} batches:`, producer2Batches.map(b => b.toString()));

    // Get batch details
    for (const batchId of producer1Batches) {
      const batch = await creditContract.getCreditBatch(batchId);
      console.log(`  📦 Batch ${batchId}:`, {
        producer: batch.producer,
        amount: ethers.formatUnits(batch.amount, 18) + " GHC",
        plantId: batch.plantId,
        renewableSource: batch.renewableSource,
        isRetired: batch.isRetired
      });
    }

    for (const batchId of producer2Batches) {
      const batch = await creditContract.getCreditBatch(batchId);
      console.log(`  📦 Batch ${batchId}:`, {
        producer: batch.producer,
        amount: ethers.formatUnits(batch.amount, 18) + " GHC",
        plantId: batch.plantId,
        renewableSource: batch.renewableSource,
        isRetired: batch.isRetired
      });
    }

    console.log("\n🛒 Checking Marketplace Activity:");
    
    // Check marketplace listings for producers
    const producer1Listings = await marketplaceContract.getSellerListings(producer1.address);
    const producer2Listings = await marketplaceContract.getSellerListings(producer2.address);

    console.log(`✅ Producer1 has ${producer1Listings.length} listings:`, producer1Listings.map(l => l.toString()));
    console.log(`✅ Producer2 has ${producer2Listings.length} listings:`, producer2Listings.map(l => l.toString()));

    // Calculate actual available balance (total - listed amount)
    let producer1Listed = BigInt(0);
    let producer2Listed = BigInt(0);

    for (const listingId of producer1Listings) {
      const listing = await marketplaceContract.getListing(listingId);
      if (listing.isActive) {
        producer1Listed += listing.amount;
      }
    }

    for (const listingId of producer2Listings) {
      const listing = await marketplaceContract.getListing(listingId);
      if (listing.isActive) {
        producer2Listed += listing.amount;
      }
    }

    console.log("\n💼 Available vs Listed Credits:");
    console.log(`✅ Producer1:`);
    console.log(`  - Balance: ${ethers.formatUnits(producer1Balance, 18)} GHC`);
    console.log(`  - Listed: ${ethers.formatUnits(producer1Listed, 18)} GHC`);
    console.log(`  - Available: ${ethers.formatUnits(producer1Balance - producer1Listed, 18)} GHC`);
    
    console.log(`✅ Producer2:`);
    console.log(`  - Balance: ${ethers.formatUnits(producer2Balance, 18)} GHC`);
    console.log(`  - Listed: ${ethers.formatUnits(producer2Listed, 18)} GHC`);
    console.log(`  - Available: ${ethers.formatUnits(producer2Balance - producer2Listed, 18)} GHC`);

    console.log("\n📊 Summary:");
    console.log(`✅ Total Credits Issued: ${ethers.formatUnits(producer1Info.totalProduced + producer2Info.totalProduced, 18)} GHC`);
    console.log(`✅ Total in Circulation: ${ethers.formatUnits(producer1Balance + producer2Balance + buyer1Balance + buyer2Balance, 18)} GHC`);
    console.log(`✅ Credits Listed for Sale: ${ethers.formatUnits(producer1Listed + producer2Listed, 18)} GHC`);

    console.log("\n🎉 Producer Credit Check Complete!");

  } catch (error) {
    console.error("❌ Producer credit check failed:", error.message);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
