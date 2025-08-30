const { ethers } = require("hardhat");

async function main() {
    console.log("Hardhat Test Accounts:");
    console.log("======================");
    
    // Default Hardhat mnemonic accounts
    const accounts = [
        {
            address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
            role: "Admin/Owner"
        },
        {
            address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
            privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a2ef9d4a8c1c3c5cd36",
            role: "Producer 1"
        },
        {
            address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", 
            role: "Producer 2"
        }
    ];
    
    for (let i = 0; i < accounts.length; i++) {
        console.log(`\nAccount ${i} (${accounts[i].role}):`);
        console.log(`Address: ${accounts[i].address}`);
        console.log(`Private Key: ${accounts[i].privateKey}`);
        console.log(`Without 0x: ${accounts[i].privateKey.slice(2)}`);
    }
}

main().catch(console.error);
