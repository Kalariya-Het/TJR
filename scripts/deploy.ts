import { ethers } from "hardhat";

async function main() {
  console.log("Starting deployment of Green Hydrogen Credit System...");

  // Get the ContractFactory and Signers
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy HydrogenCredit token
  console.log("\n1. Deploying HydrogenCredit token...");
  const HydrogenCredit = await ethers.getContractFactory("HydrogenCredit");
  const hydrogenCredit = await HydrogenCredit.deploy(
    "Green Hydrogen Credit", // Token name
    "GHC",                   // Token symbol
    deployer.address         // Initial owner
  );

  await hydrogenCredit.waitForDeployment();
  const hydrogenCreditAddress = await hydrogenCredit.getAddress();
  console.log("HydrogenCredit deployed to:", hydrogenCreditAddress);

  // Deploy HydrogenCreditMarketplace
  console.log("\n2. Deploying HydrogenCreditMarketplace...");
  const HydrogenCreditMarketplace = await ethers.getContractFactory("HydrogenCreditMarketplace");
  const marketplace = await HydrogenCreditMarketplace.deploy(
    hydrogenCreditAddress, // HydrogenCredit contract address
    deployer.address,      // Fee recipient
    deployer.address       // Initial owner
  );

  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("HydrogenCreditMarketplace deployed to:", marketplaceAddress);

  // Verify deployment
  console.log("\n3. Verifying deployment...");
  
  // Check HydrogenCredit contract
  const tokenName = await hydrogenCredit.name();
  const tokenSymbol = await hydrogenCredit.symbol();
  const owner = await hydrogenCredit.owner();
  
  console.log("Token verification:");
  console.log("- Name:", tokenName);
  console.log("- Symbol:", tokenSymbol);
  console.log("- Owner:", owner);
  
  // Check Marketplace contract
  const marketplaceOwner = await marketplace.owner();
  const connectedToken = await marketplace.hydrogenCredit();
  
  console.log("Marketplace verification:");
  console.log("- Owner:", marketplaceOwner);
  console.log("- Connected Token:", connectedToken);
  
  // Save deployment information
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(), // Convert BigInt to string
    deployer: deployer.address,
    contracts: {
      HydrogenCredit: {
        address: hydrogenCreditAddress,
        name: tokenName,
        symbol: tokenSymbol
      },
      HydrogenCreditMarketplace: {
        address: marketplaceAddress
      }
    },
    deployedAt: new Date().toISOString()
  };

  console.log("\n4. Deployment completed successfully!");
  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Optional: Register a test producer for demonstration
  if ((await ethers.provider.getNetwork()).name === "hardhat" || 
      (await ethers.provider.getNetwork()).name === "localhost") {
    console.log("\n5. Registering test producer for local development...");
    
    const testProducerAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"; // Hardhat account #1
    await hydrogenCredit.registerProducer(
      testProducerAddress,
      "TEST-PLANT-001",
      "Test Location, Germany",
      "Solar"
    );
    
    console.log("Test producer registered:", testProducerAddress);
    
    // Issue some test credits
    const testAmount = ethers.parseEther("1000"); // 1000 kg of hydrogen
    await hydrogenCredit.issueCredits(
      testProducerAddress,
      testAmount,
      Math.floor(Date.now() / 1000) - 86400 // Yesterday
    );
    
    console.log("Test credits issued:", ethers.formatEther(testAmount), "GHC");
  }

  return deploymentInfo;
}

// Execute deployment
main()
  .then((deploymentInfo) => {
    console.log("\nDeployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\nDeployment failed:");
    console.error(error);
    process.exit(1);
  });
