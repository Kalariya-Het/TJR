# Adding Hardhat Network to MetaMask

## Quick Fix for the MetaMask Warning

The warning you're seeing is normal when adding a local development network to MetaMask. Here's how to properly configure it:

## Option 1: Manual Network Addition

1. Open MetaMask
2. Click on the network dropdown (currently showing your current network)
3. Click "Add network" or "Add a network manually"
4. Fill in the following details:

```
Network Name: Hardhat Local
New RPC URL: http://127.0.0.1:8545
Chain ID: 1337
Currency Symbol: ETH
Block Explorer URL: (leave empty)
```

5. Click "Save"
6. When you see the warnings, click "Approve" - these are expected for local networks

## Option 2: Automatic Addition via Frontend

The warnings you see are normal and expected for local development networks. You can safely:
1. Click "Approve" on the MetaMask dialog
2. The warnings are just MetaMask being cautious about custom networks
3. This is completely safe for local development

## Understanding the Warnings

- **Currency symbol warning**: Normal - local networks use ETH as currency
- **Network name warning**: Expected - MetaMask doesn't recognize local dev networks  
- **RPC URL warning**: Normal - local development URLs aren't in their database
- **Chain ID warning**: Expected - 1337 is a local development chain ID

## Verification

After adding the network, you should see:
- Network name: "Hardhat Local" or "Hardhat"
- Chain ID: 1337 (0x539 in hex)
- RPC URL: http://127.0.0.1:8545
- Currency: ETH

## Import Test Accounts

You can also import Hardhat's test accounts for development:

**Account #0 (Contract Owner):**
Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Account #1 (Test Producer):**
Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a2ef9d4a8c1c3c5cd36`

⚠️ **Warning**: Only use these accounts for local development. Never use them on real networks.

## If You Still Have Issues

1. Make sure Hardhat node is running: `npx hardhat node`
2. Check the chain ID matches in both places (should be 1337)
3. Restart your frontend: `cd frontend && npm start`
4. Clear MetaMask cache if needed: Settings > Advanced > Reset Account

The warnings are cosmetic - your local network will work perfectly for development!
