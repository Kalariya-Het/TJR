#!/bin/bash

# 🛑 Green Hydrogen Credit System - Stop All Services Script

echo "🛑 Stopping Green Hydrogen Credit System..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Stop frontend
if [ -f "frontend/frontend.pid" ]; then
    FRONTEND_PID=$(cat frontend/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        rm frontend/frontend.pid
        print_success "Frontend stopped"
    else
        print_warning "Frontend process not found"
        rm frontend/frontend.pid
    fi
else
    # Try to kill any process on port 3000
    PID=$(lsof -ti:3000)
    if [ ! -z "$PID" ]; then
        kill $PID
        print_success "Frontend stopped (port 3000)"
    fi
fi

# Stop backend
if [ -f "backend/backend.pid" ]; then
    BACKEND_PID=$(cat backend/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        rm backend/backend.pid
        print_success "Backend stopped"
    else
        print_warning "Backend process not found"
        rm backend/backend.pid
    fi
else
    # Try to kill any process on port 3001
    PID=$(lsof -ti:3001)
    if [ ! -z "$PID" ]; then
        kill $PID
        print_success "Backend stopped (port 3001)"
    fi
fi

# Stop hardhat node
if [ -f "hardhat.pid" ]; then
    HARDHAT_PID=$(cat hardhat.pid)
    if kill -0 $HARDHAT_PID 2>/dev/null; then
        kill $HARDHAT_PID
        rm hardhat.pid
        print_success "Hardhat node stopped"
    else
        print_warning "Hardhat process not found"
        rm hardhat.pid
    fi
else
    # Try to kill any process on port 8545
    PID=$(lsof -ti:8545)
    if [ ! -z "$PID" ]; then
        kill $PID
        print_success "Hardhat node stopped (port 8545)"
    fi
fi

# Stop docker containers
if command -v docker-compose &> /dev/null; then
    cd backend
    docker-compose down
    cd ..
    print_success "Docker containers stopped"
fi

print_success "All services stopped successfully!"
