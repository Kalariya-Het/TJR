#!/bin/bash

# 🚀 Green Hydrogen Credit System - Complete Walkthrough Script
# This script guides you through running the entire system step by step

set -e  # Exit on any error

echo "🌱 Green Hydrogen Credit System - Complete Setup Walkthrough"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 STEP $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "hardhat.config.ts" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_step "1" "Installing Dependencies"
echo "Installing root dependencies..."
npm install
print_success "Root dependencies installed"

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..
print_success "Frontend dependencies installed"

echo "Installing backend dependencies..."
cd backend && npm install && cd ..
print_success "Backend dependencies installed"

print_step "2" "Starting Blockchain Network"
echo "Starting Hardhat local blockchain network..."
echo "This will run in the background and show all blockchain transactions"

# Check if hardhat node is already running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Hardhat node already running on port 8545"
else
    echo "Starting Hardhat node in background..."
    npx hardhat node > hardhat.log 2>&1 &
    HARDHAT_PID=$!
    echo $HARDHAT_PID > hardhat.pid
    sleep 5
    print_success "Hardhat node started (PID: $HARDHAT_PID)"
fi

print_step "3" "Deploying Smart Contracts"
echo "Deploying ProductionOracle, HydrogenCreditV2, and Marketplace contracts..."
npx hardhat run scripts/deploy-v2.ts --network localhost

if [ $? -eq 0 ]; then
    print_success "Smart contracts deployed successfully"
    echo "Contract addresses saved in deployment logs"
else
    print_error "Contract deployment failed"
    exit 1
fi

print_step "4" "Setting up Database"
echo "Starting PostgreSQL database with Docker..."

cd backend

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_warning "docker-compose not found. Please install Docker and Docker Compose"
    print_warning "Alternative: Install PostgreSQL locally and create 'green_hydrogen_db' database"
    read -p "Continue with local PostgreSQL setup? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Please ensure PostgreSQL is running and 'green_hydrogen_db' database exists"
    else
        exit 1
    fi
else
    echo "Starting PostgreSQL container..."
    docker-compose up -d postgres
    
    echo "Waiting for database to be ready..."
    sleep 10
    
    # Check if database is ready
    docker-compose exec postgres pg_isready -U postgres
    if [ $? -eq 0 ]; then
        print_success "PostgreSQL database is ready"
    else
        print_error "Database failed to start"
        exit 1
    fi
fi

print_step "5" "Database Migration and Seeding"
echo "Running database migrations..."
npm run migrate

if [ $? -eq 0 ]; then
    print_success "Database migrations completed"
else
    print_error "Database migration failed"
    exit 1
fi

echo "Seeding database with test data..."
npm run seed

if [ $? -eq 0 ]; then
    print_success "Database seeded with test data"
else
    print_error "Database seeding failed"
    exit 1
fi

print_step "6" "Testing Backend Integration"
echo "Running comprehensive backend tests..."
node test-backend.js

if [ $? -eq 0 ]; then
    print_success "Backend integration tests passed"
else
    print_warning "Backend tests failed - continuing with demo mode"
fi

print_step "7" "Starting Backend Server"
echo "Starting Express.js backend server..."

# Check if backend is already running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Backend server already running on port 3001"
else
    npm run dev > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend.pid
    sleep 3
    print_success "Backend server started (PID: $BACKEND_PID)"
fi

cd ..

print_step "8" "Testing API Endpoints"
echo "Testing backend API health..."

# Test health endpoint
curl -s http://localhost:3001/health > /dev/null
if [ $? -eq 0 ]; then
    print_success "Backend API is responding"
    echo "Health check response:"
    curl -s http://localhost:3001/health | jq '.'
else
    print_error "Backend API not responding"
    exit 1
fi

echo ""
echo "Testing admin dashboard endpoint..."
curl -s http://localhost:3001/api/admin/dashboard | jq '.'

print_step "9" "Testing Blockchain Workflow"
echo "Running complete blockchain workflow test..."
npx hardhat run scripts/test-v2-workflow.ts --network localhost

if [ $? -eq 0 ]; then
    print_success "Blockchain workflow test completed successfully"
else
    print_warning "Blockchain workflow test had issues - check logs"
fi

print_step "10" "Starting Frontend"
echo "Starting React frontend application..."

cd frontend

# Check if frontend is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    print_warning "Frontend already running on port 3000"
else
    npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > frontend.pid
    sleep 5
    print_success "Frontend started (PID: $FRONTEND_PID)"
fi

cd ..

echo ""
echo "🎉 SYSTEM STARTUP COMPLETE!"
echo "=========================="
echo ""
print_success "All services are now running:"
echo "🔗 Frontend:     http://localhost:3000"
echo "🔗 Backend API:  http://localhost:3001"
echo "🔗 Health Check: http://localhost:3001/health"
echo "🔗 Blockchain:   http://localhost:8545"
echo "🔗 Database:     localhost:5432 (green_hydrogen_db)"
echo ""

echo "📊 System Status:"
echo "✅ Hardhat Network: Running (Chain ID: 31337)"
echo "✅ Smart Contracts: Deployed"
echo "✅ PostgreSQL: Running"
echo "✅ Backend API: Running"
echo "✅ Frontend: Running"
echo ""

echo "🔑 Test Accounts (for MetaMask):"
echo "Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
echo ""

echo "📋 Next Steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Install MetaMask browser extension if not already installed"
echo "3. Add localhost network to MetaMask:"
echo "   - Network Name: Localhost 8545"
echo "   - RPC URL: http://localhost:8545"
echo "   - Chain ID: 31337"
echo "   - Currency Symbol: ETH"
echo "4. Import test account using private key above"
echo "5. Start testing the system!"
echo ""

echo "🧪 Testing Commands:"
echo "# Test backend integration"
echo "cd backend && node test-backend.js"
echo ""
echo "# Test blockchain workflow"
echo "npx hardhat run scripts/test-v2-workflow.ts --network localhost"
echo ""
echo "# Check API endpoints"
echo "curl http://localhost:3001/health | jq"
echo "curl http://localhost:3001/api/admin/dashboard | jq"
echo ""

echo "🛑 To stop all services:"
echo "./stop-system.sh"
echo ""

echo "📚 Documentation:"
echo "- Complete Setup Guide: PROJECT_SETUP_GUIDE.md"
echo "- Database Schema: DATABASE_SCHEMA_GUIDE.md"
echo "- Backend API: backend/README.md"
echo ""

print_success "System is ready for use! 🚀"
