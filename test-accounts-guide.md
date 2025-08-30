# Hardhat Test Accounts for Dashboard Testing

## Account Information

Your local Hardhat network has been populated with test data. Here are the accounts you can import to MetaMask to see different perspectives:

### 🏛️ **Account #0 - Contract Owner/Admin**
- **Address**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Private Key**: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Role**: Contract owner, can register producers and issue credits
- **Credits**: 0 GHC (admin doesn't hold credits)
- **Permissions**: Access to Producer Management features

### 🏭 **Account #1 - Producer 1 (Solar)**
- **Address**: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
- **Private Key**: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a2ef9d4a8c1c3c5cd36`
- **Role**: Hydrogen producer (Solar energy)
- **Plant ID**: TEST-PLANT-001
- **Location**: Test Location, Germany
- **Credits**: ~5000 GHC
- **Can**: Create marketplace listings, sell credits

### 🌪️ **Account #2 - Producer 2 (Wind)**  
- **Address**: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
- **Private Key**: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`
- **Role**: Hydrogen producer (Wind energy)
- **Plant ID**: WIND-PLANT-002
- **Location**: Hamburg, Germany
- **Credits**: ~3100 GHC
- **Can**: Create marketplace listings, sell credits

### 👤 **Account #3 - Test Buyer**
- **Address**: `0x90F79bf6EB2c4f870365E785982E1f101E93b906`
- **Private Key**: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`
- **Role**: Credit buyer/consumer
- **Credits**: 0 GHC (can purchase from marketplace)
- **Can**: Buy credits, retire credits for environmental impact

## How to Import Accounts

### Step 1: Open MetaMask
1. Click on your account avatar (top right)
2. Select "Import Account"

### Step 2: Import Private Key
1. Select "Private Key" as import method
2. Paste one of the private keys above
3. Click "Import"

### Step 3: Switch Networks
1. Make sure you're connected to "Hardhat Local" network
2. Chain ID should be 1337

## What You'll See

### **As Contract Owner (Account #0)**:
- Dashboard shows system statistics
- Access to "Producer Management" tab
- Can register new producers
- Can issue credits to producers
- 0 GHC balance (admins don't typically hold credits)

### **As Producer 1 (Account #1)**:
- Dashboard shows your credits: ~5000 GHC
- Producer Status: "Registered" 
- Can access Marketplace to create listings
- Can view other producers
- Has active marketplace listings

### **As Producer 2 (Account #2)**:
- Dashboard shows your credits: ~3100 GHC  
- Producer Status: "Registered"
- Can access Marketplace to create listings
- Different plant details (Wind vs Solar)
- Has active marketplace listings

### **As Test Buyer (Account #3)**:
- Dashboard shows 0 GHC balance
- Can browse marketplace listings
- Can purchase credits from producers
- Can retire credits for environmental impact

## Current System Data

After running the population script:
- **Total Supply**: 11,500 GHC
- **Total Batches**: 8 production batches
- **Registered Producers**: 2 active producers
- **Active Listings**: 6 marketplace listings
- **Total Volume**: Ready for trading

## Quick Testing Tips

1. **Switch between accounts** to see different user perspectives
2. **Refresh the dashboard** after switching accounts
3. **Try the marketplace** - buy/sell credits between accounts
4. **Check the Producers page** to see registered facilities
5. **Use Producer Management** (admin only) to register more producers

## Security Note

⚠️ **Important**: These private keys are for local development only. Never use them on real networks or send real ETH to these addresses.

---

**Next Steps**: 
1. Import Account #1 (Producer) to see credits in your wallet
2. Refresh your dashboard 
3. Explore the marketplace and other features!
