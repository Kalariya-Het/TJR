import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Deploying Enhanced Green Hydrogen Credit System V2...");

  // Get signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy ProductionOracle
  console.log("\n1. Deploying ProductionOracle...");
  const ProductionOracle = await ethers.getContractFactory("ProductionOracle");
  const productionOracle = await ProductionOracle.deploy(deployer.address);
  await productionOracle.waitForDeployment();
  const oracleAddress = await productionOracle.getAddress();
  console.log("ProductionOracle deployed to:", oracleAddress);

  // 2. Deploy HydrogenCreditV2
  console.log("\n2. Deploying HydrogenCreditV2...");
  const HydrogenCreditV2 = await ethers.getContractFactory("HydrogenCreditV2");
  const hydrogenCreditV2 = await HydrogenCreditV2.deploy(
    "Green Hydrogen Credit V2",
    "GHCV2",
    deployer.address,
    oracleAddress
  );
  await hydrogenCreditV2.waitForDeployment();
  const creditAddress = await hydrogenCreditV2.getAddress();
  console.log("HydrogenCreditV2 deployed to:", creditAddress);

  // 3. Deploy Enhanced Marketplace (if needed)
  console.log("\n3. Deploying HydrogenCreditMarketplace...");
  const Marketplace = await ethers.getContractFactory("HydrogenCreditMarketplace");
  const marketplace = await Marketplace.deploy(
    creditAddress,
    deployer.address, // fee recipient
    deployer.address  // initial owner
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("HydrogenCreditMarketplace deployed to:", marketplaceAddress);

  // 4. Setup initial verifiers
  console.log("\n4. Setting up initial verifiers...");
  
  // Add some test verifiers
  const [, verifier1, verifier2] = await ethers.getSigners();
  
  await productionOracle.addVerifier(
    verifier1.address,
    "TÜV SÜD",
    "German Technical Inspection Association"
  );
  console.log("✅ Added verifier 1:", verifier1.address);

  await productionOracle.addVerifier(
    verifier2.address,
    "Bureau Veritas",
    "International Certification Body"
  );
  console.log("✅ Added verifier 2:", verifier2.address);

  // 5. Register test producers with enhanced verification
  console.log("\n5. Registering test producers...");
  
  const [, , , producer1, producer2] = await ethers.getSigners();
  
  // Register Producer 1
  await hydrogenCreditV2.registerProducer(
    producer1.address,
    "SOLAR-PLANT-V2-001",
    "Munich, Germany",
    "Solar",
    ethers.parseEther("5000") // 5000 kg monthly limit
  );
  
  // Set KYC verification
  await hydrogenCreditV2.setProducerVerification(producer1.address, true);
  console.log("✅ Registered and verified Producer 1:", producer1.address);

  // Register Producer 2
  await hydrogenCreditV2.registerProducer(
    producer2.address,
    "WIND-PLANT-V2-002",
    "Hamburg, Germany", 
    "Wind",
    ethers.parseEther("8000") // 8000 kg monthly limit
  );
  
  // Set KYC verification
  await hydrogenCreditV2.setProducerVerification(producer2.address, true);
  console.log("✅ Registered and verified Producer 2:", producer2.address);

  // 6. Verification and deployment summary
  console.log("\n6. Verifying deployment...");
  
  // Oracle verification
  const oracleVerifiers = await productionOracle.getActiveVerifiers();
  console.log("Active verifiers count:", oracleVerifiers.length);
  
  // Token verification
  const tokenName = await hydrogenCreditV2.name();
  const tokenSymbol = await hydrogenCreditV2.symbol();
  const owner = await hydrogenCreditV2.owner();
  console.log("Token verification:");
  console.log("- Name:", tokenName);
  console.log("- Symbol:", tokenSymbol);
  console.log("- Owner:", owner);
  
  // Contract stats
  const stats = await hydrogenCreditV2.getContractStats();
  console.log("Contract stats:");
  console.log("- Total Supply:", ethers.formatEther(stats[0]), "GHCV2");
  console.log("- Total Batches:", stats[1].toString());
  console.log("- Registered Producers:", stats[3].toString());
  console.log("- Verified Producers:", stats[4].toString());

  // 7. Save deployment info
  const deploymentInfo = {
    network: "localhost",
    chainId: "1337",
    deployer: deployer.address,
    contracts: {
      ProductionOracle: {
        address: oracleAddress,
        verifiers: oracleVerifiers.length
      },
      HydrogenCreditV2: {
        address: creditAddress,
        name: tokenName,
        symbol: tokenSymbol
      },
      HydrogenCreditMarketplace: {
        address: marketplaceAddress
      }
    },
    deployedAt: new Date().toISOString(),
    features: [
      "Production verification via oracle",
      "KYC verification for producers",
      "Monthly production limits",
      "Multi-verifier system",
      "IPFS integration for production reports"
    ]
  };

  console.log("\n7. Deployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n📋 Contract Addresses Summary:");
  console.log("- ProductionOracle:", oracleAddress);
  console.log("- HydrogenCreditV2:", creditAddress);
  console.log("- Marketplace:", marketplaceAddress);
  
  console.log("\n🔧 Next Steps:");
  console.log("1. Update frontend contract addresses");
  console.log("2. Test production data submission and verification");
  console.log("3. Verify credit issuance from oracle");
  console.log("4. Test enhanced marketplace functionality");
}

main()
  .then(() => {
    console.log("\n✅ V2 Deployment script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ V2 Deployment failed:");
    console.error(error);
    process.exit(1);
  });
