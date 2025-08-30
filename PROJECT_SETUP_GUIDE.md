# 🌱 Green Hydrogen Credit System - Complete Setup Guide

A comprehensive blockchain-based system for managing green hydrogen production credits with production verification, oracle integration, and marketplace trading.

## 📋 Table of Contents
1. [System Architecture Overview](#system-architecture-overview)
2. [Prerequisites & Installation](#prerequisites--installation)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [Database Schema & Data Flow](#database-schema--data-flow)
5. [Complete Workflow Explanation](#complete-workflow-explanation)
6. [Testing the System](#testing-the-system)
7. [Troubleshooting](#troubleshooting)

## 🏗️ System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (Express.js)  │◄──►│  (PostgreSQL)   │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Blockchain Layer      │
                    │   (Hardhat Network)     │
                    │   Port: 8545            │
                    │                         │
                    │ • ProductionOracle      │
                    │ • HydrogenCreditV2      │
                    │ • Marketplace           │
                    └─────────────────────────┘
```

### **Key Components:**
- **Frontend**: React app with Web3 integration
- **Backend**: Express.js REST API with authentication
- **Database**: PostgreSQL with comprehensive schema
- **Blockchain**: Smart contracts on local Hardhat network
- **Oracle System**: Multi-verifier production verification

## 🔧 Prerequisites & Installation

### **System Requirements:**
- Node.js 18+ 
- Git
- Docker & Docker Compose (recommended)
- PostgreSQL 15+ (or use Docker)

### **Initial Setup:**
```bash
# 1. Clone the repository
git clone <repository-url>
cd green-hydrogen-credit-system

# 2. Install root dependencies
npm install

# 3. Install frontend dependencies
cd frontend
npm install
cd ..

# 4. Install backend dependencies
cd backend
npm install
cd ..
```

## 🚀 Step-by-Step Setup

### **Step 1: Start the Blockchain Network**
```bash
# Terminal 1: Start Hardhat local blockchain
npx hardhat node

# Keep this terminal running - it shows all blockchain transactions
# Network will be available at: http://localhost:8545
```

### **Step 2: Deploy Smart Contracts**
```bash
# Terminal 2: Deploy contracts to local network
npx hardhat run scripts/deploy-v2.ts --network localhost

# Expected output:
# ProductionOracle deployed to: 0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82
# HydrogenCreditV2 deployed to: 0x9A676e781A523b5d0C0e43731313A708CB607508
# Marketplace deployed to: 0x0B306BF915C4d645ff596e518fAf3F9669b97016
```

### **Step 3: Setup Database**

#### **Option A: Using Docker (Recommended)**
```bash
# Terminal 3: Start PostgreSQL with Docker
cd backend
docker-compose up -d postgres

# Wait for database to be ready (about 30 seconds)
docker-compose logs postgres
```

#### **Option B: Local PostgreSQL**
```bash
# If you have PostgreSQL installed locally
createdb green_hydrogen_db
```

### **Step 4: Configure Environment**
```bash
# Backend environment setup
cd backend
cp .env.example .env

# Edit .env file with your configuration:
# - Database credentials
# - Contract addresses from Step 2
# - JWT secret for authentication
```

### **Step 5: Initialize Database**
```bash
# Terminal 3: Run database migrations and seed data
cd backend
npm run migrate
npm run seed

# This creates all tables and populates with test data
```

### **Step 6: Start Backend API**
```bash
# Terminal 3: Start the backend server
npm run dev

# Backend will be available at: http://localhost:3001
# Health check: http://localhost:3001/health
```

### **Step 7: Start Frontend**
```bash
# Terminal 4: Start the React frontend
cd frontend
npm start

# Frontend will be available at: http://localhost:3000
```

### **Step 8: Test Complete System**
```bash
# Terminal 5: Run comprehensive tests
cd backend
node test-backend.js

# Run blockchain workflow tests
cd ..
npx hardhat run scripts/test-v2-workflow.ts --network localhost
```

## 🗄️ Database Schema & Data Flow

### **Core Database Tables:**

#### **1. Users Table** - Authentication & Roles
```sql
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password_hash VARCHAR,
  role ENUM('admin', 'producer', 'verifier', 'buyer'),
  wallet_address VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  company_name VARCHAR,
  is_verified BOOLEAN,
  kyc_status ENUM('pending', 'approved', 'rejected'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

#### **2. Producers Table** - Hydrogen Production Facilities
```sql
producers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  wallet_address VARCHAR,
  plant_id VARCHAR UNIQUE,
  plant_name VARCHAR,
  location VARCHAR,
  renewable_source ENUM('Solar', 'Wind', 'Hydro', 'Geothermal'),
  capacity_kg_per_month INTEGER,
  certification_body VARCHAR,
  certification_date DATE,
  is_verified BOOLEAN,
  created_at TIMESTAMP
)
```

#### **3. Production Submissions Table** - Production Data
```sql
production_submissions (
  id UUID PRIMARY KEY,
  producer_id UUID REFERENCES producers(id),
  submission_hash VARCHAR,
  data_hash VARCHAR,
  plant_id VARCHAR,
  amount NUMERIC(78,0), -- Wei format for blockchain
  production_date DATE,
  renewable_percentage INTEGER,
  ipfs_hash VARCHAR,
  status ENUM('pending', 'verified', 'rejected'),
  verification_time TIMESTAMP,
  verifier_notes TEXT,
  created_at TIMESTAMP
)
```

#### **4. Credit Batches Table** - Issued Credits
```sql
credit_batches (
  id UUID PRIMARY KEY,
  producer_id UUID REFERENCES producers(id),
  submission_id UUID REFERENCES production_submissions(id),
  batch_id VARCHAR UNIQUE,
  amount NUMERIC(78,0),
  issue_date TIMESTAMP,
  blockchain_tx_hash VARCHAR,
  status ENUM('active', 'retired'),
  created_at TIMESTAMP
)
```

#### **5. Audit Logs Table** - Complete Activity Trail
```sql
audit_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR,
  resource_type VARCHAR,
  resource_id VARCHAR,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP
)
```

### **Data Flow Diagram:**

```
1. PRODUCER REGISTRATION
   User Registration → KYC Verification → Producer Profile Creation
   
   users table ──→ producers table
   (role='producer')  (plant details)

2. PRODUCTION SUBMISSION
   Production Data → IPFS Upload → Blockchain Submission
   
   production_submissions table ──→ Oracle Contract
   (pending status)                  (verification request)

3. VERIFICATION PROCESS
   Verifier Review → Oracle Verification → Status Update
   
   Oracle Contract ──→ production_submissions table
   (verification result)  (status: verified/rejected)

4. CREDIT ISSUANCE
   Verified Production → Credit Minting → Database Recording
   
   HydrogenCreditV2 Contract ──→ credit_batches table
   (mint credits)                  (record batch)

5. MARKETPLACE TRADING
   List Credits → Purchase → Transfer → Database Update
   
   Marketplace Contract ──→ credit_transactions table
   (trade execution)         (record transaction)
```

## 🔄 Complete Workflow Explanation

### **Phase 1: System Initialization**
1. **Smart Contracts Deployed**: Oracle, Credit, and Marketplace contracts
2. **Database Initialized**: All tables created with relationships
3. **Test Data Seeded**: Sample users, producers, and verifiers

### **Phase 2: Producer Onboarding**
```javascript
// 1. User registers via frontend
POST /api/auth/register
{
  "email": "producer@solar.com",
  "password": "secure123",
  "role": "producer",
  "wallet_address": "0x..."
}

// 2. Data stored in users table
INSERT INTO users (email, role, wallet_address, ...)

// 3. Producer profile created
POST /api/producers
{
  "plant_name": "Solar Hydrogen Facility",
  "renewable_source": "Solar",
  "capacity_kg_per_month": 5000
}

// 4. Data stored in producers table
INSERT INTO producers (user_id, plant_name, ...)
```

### **Phase 3: Production Verification Workflow**
```javascript
// 1. Producer submits production data
POST /api/producers/:id/submissions
{
  "amount": "1000000000000000000000", // 1000 kg in Wei
  "production_date": "2024-01-15",
  "renewable_percentage": 100,
  "ipfs_hash": "QmX..." // Production report
}

// 2. Database records submission
INSERT INTO production_submissions (
  producer_id, amount, status='pending', ...
)

// 3. Oracle contract receives verification request
await oracle.submitProductionData(
  plantId, amount, dataHash, ipfsHash
)

// 4. Verifier reviews and approves
await oracle.verifyProduction(
  submissionId, true, "Verified production data"
)

// 5. Database updated with verification result
UPDATE production_submissions 
SET status='verified', verification_time=NOW()
WHERE id=...
```

### **Phase 4: Credit Issuance**
```javascript
// 1. Oracle triggers credit issuance
await creditContract.issueCredits(
  producerAddress, amount, submissionHash
)

// 2. Credits minted on blockchain
event CreditIssued(producer, amount, batchId)

// 3. Database records credit batch
INSERT INTO credit_batches (
  producer_id, amount, batch_id, blockchain_tx_hash
)

// 4. Producer balance updated
// Credits now available in producer's wallet
```

### **Phase 5: Marketplace Trading**
```javascript
// 1. Producer lists credits for sale
POST /api/marketplace/listings
{
  "amount": "500000000000000000000", // 500 kg
  "price_per_credit": "50000000000000000000", // 50 tokens
  "description": "Premium solar hydrogen credits"
}

// 2. Buyer purchases credits
await marketplace.purchaseCredits(listingId, amount)

// 3. Credits transferred on blockchain
await creditContract.transfer(buyer, amount)

// 4. Transaction recorded in database
INSERT INTO credit_transactions (
  from_address, to_address, amount, transaction_type='purchase'
)
```

## 🧪 Testing the System

### **1. Backend Integration Test**
```bash
cd backend
node test-backend.js

# Tests:
# ✅ Database connection
# ✅ Schema migrations
# ✅ Data seeding
# ✅ Complex queries
# ✅ Audit logging
```

### **2. Blockchain Workflow Test**
```bash
npx hardhat run scripts/test-v2-workflow.ts --network localhost

# Tests:
# ✅ Production submission
# ✅ Oracle verification
# ✅ Credit issuance
# ✅ Marketplace trading
```

### **3. API Endpoint Tests**
```bash
# Health check
curl http://localhost:3001/health

# Admin dashboard
curl http://localhost:3001/api/admin/dashboard

# Producers list
curl http://localhost:3001/api/producers
```

### **4. Frontend Integration Test**
1. Open `http://localhost:3000`
2. Connect MetaMask wallet
3. Switch to localhost network
4. Test producer registration
5. Submit production data
6. Verify credit issuance

## 🔍 Data Verification Examples

### **Check Database Records:**
```sql
-- View all users and their roles
SELECT email, role, wallet_address, is_verified 
FROM users;

-- View producer facilities
SELECT u.email, p.plant_name, p.renewable_source, p.capacity_kg_per_month
FROM users u 
JOIN producers p ON u.id = p.user_id;

-- View production submissions with status
SELECT p.plant_name, ps.amount, ps.status, ps.verification_time
FROM production_submissions ps
JOIN producers p ON ps.producer_id = p.id;

-- View issued credit batches
SELECT p.plant_name, cb.amount, cb.issue_date, cb.status
FROM credit_batches cb
JOIN producers p ON cb.producer_id = p.id;

-- View complete audit trail
SELECT u.email, al.action, al.resource_type, al.created_at
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;
```

### **Check Blockchain State:**
```javascript
// Check contract addresses
console.log("Oracle:", process.env.ORACLE_CONTRACT_ADDRESS);
console.log("Credit:", process.env.CREDIT_CONTRACT_ADDRESS);
console.log("Marketplace:", process.env.MARKETPLACE_CONTRACT_ADDRESS);

// Check credit balances
const balance = await creditContract.balanceOf(producerAddress);
console.log("Producer Credits:", ethers.utils.formatEther(balance));

// Check production submissions on oracle
const submission = await oracle.getSubmission(submissionId);
console.log("Submission Status:", submission.status);
```

## 🚨 Troubleshooting

### **Common Issues:**

#### **Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

#### **Smart Contract Deployment Failed**
```bash
# Ensure Hardhat network is running
npx hardhat node

# Redeploy contracts
npx hardhat run scripts/deploy-v2.ts --network localhost
```

#### **Frontend Can't Connect to MetaMask**
1. Install MetaMask browser extension
2. Add localhost network (RPC: http://localhost:8545, Chain ID: 31337)
3. Import test account private key
4. Refresh the page

#### **Backend API Errors**
```bash
# Check backend logs
cd backend
npm run dev

# Test API health
curl http://localhost:3001/health

# Check environment variables
cat .env
```

## 📊 System Monitoring

### **Health Checks:**
- **Blockchain**: `http://localhost:8545` (Hardhat node)
- **Backend**: `http://localhost:3001/health`
- **Frontend**: `http://localhost:3000`
- **Database**: `docker-compose ps postgres`

### **Log Locations:**
- **Backend Logs**: `backend/logs/app.log`
- **Blockchain Logs**: Terminal running `npx hardhat node`
- **Database Logs**: `docker-compose logs postgres`

## 🎯 Next Steps

Once the system is running, you can:
1. **Register as a producer** and submit production data
2. **Become a verifier** and verify production submissions
3. **Trade credits** on the marketplace
4. **Monitor system health** via admin dashboard
5. **Explore audit logs** for complete transparency

The system is now fully operational with production-grade security, comprehensive data tracking, and complete blockchain integration!
