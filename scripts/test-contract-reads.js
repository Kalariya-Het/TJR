const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Testing contract reads...");

  // Contract addresses
  const creditAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const marketplaceAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

  try {
    // Get contract instances
    const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
    const HydrogenCreditMarketplace = await ethers.getContractFactory("HydrogenCreditMarketplace");
    
    const creditContract = HydrogenCredit.attach(creditAddress);
    const marketplaceContract = HydrogenCreditMarketplace.attach(marketplaceAddress);

    console.log("\n📋 Testing HydrogenCredit reads...");
    
    // Test basic reads
    const name = await creditContract.name();
    const symbol = await creditContract.symbol();
    const totalSupply = await creditContract.totalSupply();
    const owner = await creditContract.owner();
    
    console.log("✅ Token name:", name);
    console.log("✅ Token symbol:", symbol);
    console.log("✅ Total supply:", ethers.formatUnits(totalSupply, 18), symbol);
    console.log("✅ Owner:", owner);

    // Test contract stats
    console.log("\n📊 Testing getContractStats...");
    try {
      const contractStats = await creditContract.getContractStats();
      console.log("✅ Contract Stats:");
      console.log("  - Total Supply:", ethers.formatUnits(contractStats[0], 18));
      console.log("  - Total Batches:", contractStats[1].toString());
      console.log("  - Total Retired:", ethers.formatUnits(contractStats[2], 18));
      console.log("  - Producer Count:", contractStats[3].toString());
    } catch (error) {
      console.error("❌ getContractStats failed:", error.message);
    }

    // Test user balance for owner
    console.log("\n💰 Testing user balances...");
    const ownerBalance = await creditContract.balanceOf(owner);
    console.log("✅ Owner balance:", ethers.formatUnits(ownerBalance, 18), symbol);

    // Test marketplace reads
    console.log("\n🛒 Testing marketplace reads...");
    const platformFee = await marketplaceContract.platformFeePercent();
    const totalListings = await marketplaceContract.totalListings();
    const nextListingId = await marketplaceContract.nextListingId();
    
    console.log("✅ Platform fee:", (Number(platformFee) / 100).toFixed(2) + "%");
    console.log("✅ Total listings:", totalListings.toString());
    console.log("✅ Next listing ID:", nextListingId.toString());

    // Test marketplace stats
    console.log("\n📈 Testing getMarketplaceStats...");
    try {
      const marketplaceStats = await marketplaceContract.getMarketplaceStats();
      console.log("✅ Marketplace Stats:");
      console.log("  - Total Listings Created:", marketplaceStats[0].toString());
      console.log("  - Active Listings Count:", marketplaceStats[1].toString());
      console.log("  - Total Volume:", ethers.formatUnits(marketplaceStats[2], 18));
      console.log("  - Fee Percent:", marketplaceStats[3].toString());
    } catch (error) {
      console.error("❌ getMarketplaceStats failed:", error.message);
    }

    // Test specific listing
    if (Number(nextListingId) > 1) {
      console.log("\n📝 Testing getListing for ID 1...");
      try {
        const listing = await marketplaceContract.getListing(1);
        console.log("✅ Listing 1:");
        console.log("  - ID:", listing.id.toString());
        console.log("  - Seller:", listing.seller);
        console.log("  - Amount:", ethers.formatUnits(listing.amount, 18));
        console.log("  - Price per unit:", ethers.formatEther(listing.pricePerUnit), "ETH");
        console.log("  - Is Active:", listing.isActive);
      } catch (error) {
        console.error("❌ getListing failed:", error.message);
      }
    }

    console.log("\n✅ All contract reads completed successfully!");

  } catch (error) {
    console.error("❌ Contract read test failed:", error.message);
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
