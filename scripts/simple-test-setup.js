const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Creating simple test data for V2 contracts...");

  // Get signers
  const [owner, producer1, producer2, buyer1] = await ethers.getSigners();
  
  console.log("👤 Using accounts:");
  console.log("- Owner:", owner.address);
  console.log("- Producer 1:", producer1.address);
  console.log("- Producer 2:", producer2.address);
  console.log("- Buyer 1:", buyer1.address);

  // Contract addresses from fresh deployment
  const oracleAddress = "0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1";
  const creditAddress = "0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44";
  const marketplaceAddress = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";

  // Connect to contracts
  console.log("\n📋 Connecting to contracts...");
  const Oracle = await ethers.getContractAt("ProductionOracle", oracleAddress);
  const Credit = await ethers.getContractAt("HydrogenCreditV2", creditAddress);
  const Marketplace = await ethers.getContractAt("HydrogenCreditMarketplace", marketplaceAddress);

  console.log("- Oracle:", oracleAddress);
  console.log("- Credit V2:", creditAddress);
  console.log("- Marketplace:", marketplaceAddress);

  // Step 1: Submit production data and verify it
  console.log("\n🏭 Submitting production data...");
  
  // Producer 1 submits production data
  const productionAmount1 = ethers.parseEther("1000"); // 1000 kg
  const productionTime1 = Math.floor(Date.now() / 1000) - 86400; // Yesterday
  const verificationFee = ethers.parseEther("0.01"); // 0.01 ETH fee

  const submitTx1 = await Oracle.connect(producer1).submitProductionData(
    producer1.address,
    "SOLAR-PLANT-001",
    productionAmount1,
    productionTime1,
    "QmTestHash1",
    { value: verificationFee }
  );
  await submitTx1.wait();
  console.log("✅ Producer 1 submitted production data");

  // Producer 2 submits production data
  const productionAmount2 = ethers.parseEther("1500"); // 1500 kg
  const productionTime2 = Math.floor(Date.now() / 1000) - 172800; // 2 days ago

  const submitTx2 = await Oracle.connect(producer2).submitProductionData(
    producer2.address,
    "WIND-PLANT-002",
    productionAmount2,
    productionTime2,
    "QmTestHash2",
    { value: verificationFee }
  );
  await submitTx2.wait();
  console.log("✅ Producer 2 submitted production data");

  // Step 2: Verify production data (as verifier)
  console.log("\n✅ Verifying production data...");
  
  // Get data hashes from events
  const filter1 = Oracle.filters.ProductionDataSubmitted(producer1.address);
  const events1 = await Oracle.queryFilter(filter1);
  const dataHash1 = events1[events1.length - 1].args.dataHash;

  const filter2 = Oracle.filters.ProductionDataSubmitted(producer2.address);
  const events2 = await Oracle.queryFilter(filter2);
  const dataHash2 = events2[events2.length - 1].args.dataHash;

  // Verify the production data
  const verifyTx1 = await Oracle.connect(owner).verifyProductionData(dataHash1, true);
  await verifyTx1.wait();
  console.log("✅ Verified Producer 1 data");

  const verifyTx2 = await Oracle.connect(owner).verifyProductionData(dataHash2, true);
  await verifyTx2.wait();
  console.log("✅ Verified Producer 2 data");

  // Step 3: Issue credits based on verified data
  console.log("\n💳 Issuing credits from verified data...");

  const issueTx1 = await Credit.connect(owner).issueCreditsFromVerification(dataHash1);
  await issueTx1.wait();
  console.log("✅ Issued credits to Producer 1");

  const issueTx2 = await Credit.connect(owner).issueCreditsFromVerification(dataHash2);
  await issueTx2.wait();
  console.log("✅ Issued credits to Producer 2");

  // Step 4: Create marketplace listings
  console.log("\n🛒 Creating marketplace listings...");

  // Producer 1 creates listing
  const listingAmount1 = ethers.parseEther("500"); // 500 kg
  const pricePerUnit1 = ethers.parseEther("0.05"); // 0.05 ETH per credit

  // Approve marketplace to spend tokens
  const approve1Tx = await Credit.connect(producer1).approve(marketplaceAddress, listingAmount1);
  await approve1Tx.wait();

  const listing1Tx = await Marketplace.connect(producer1).createListing(listingAmount1, pricePerUnit1);
  await listing1Tx.wait();
  console.log("✅ Producer 1 created marketplace listing");

  // Producer 2 creates listing
  const listingAmount2 = ethers.parseEther("800"); // 800 kg
  const pricePerUnit2 = ethers.parseEther("0.045"); // 0.045 ETH per credit

  const approve2Tx = await Credit.connect(producer2).approve(marketplaceAddress, listingAmount2);
  await approve2Tx.wait();

  const listing2Tx = await Marketplace.connect(producer2).createListing(listingAmount2, pricePerUnit2);
  await listing2Tx.wait();
  console.log("✅ Producer 2 created marketplace listing");

  // Step 5: Display final stats
  console.log("\n📊 Final Statistics:");
  
  try {
    const totalSupply = await Credit.totalSupply();
    console.log(`- Total Credits Issued: ${ethers.formatEther(totalSupply)} GHC`);

    const producer1Balance = await Credit.balanceOf(producer1.address);
    console.log(`- Producer 1 Balance: ${ethers.formatEther(producer1Balance)} GHC`);

    const producer2Balance = await Credit.balanceOf(producer2.address);
    console.log(`- Producer 2 Balance: ${ethers.formatEther(producer2Balance)} GHC`);

    const marketplaceStats = await Marketplace.getMarketplaceStats();
    console.log(`- Total Listings Created: ${marketplaceStats[0]}`);
    console.log(`- Active Listings: ${marketplaceStats[1]}`);

    console.log("\n✅ Test data setup completed successfully!");
  } catch (error) {
    console.log("❌ Error reading final stats:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
