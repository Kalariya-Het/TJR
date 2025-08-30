# Green Hydrogen Credit System - Backend API

A comprehensive Node.js/Express backend API for managing green hydrogen production credits with blockchain integration and production verification.

## Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Producer, Verifier, Buyer)
- KYC verification requirements
- API key authentication for external integrations

### 🏭 Production Management
- Producer registration and verification
- Production data submission with IPFS integration
- Third-party verification workflow
- Monthly production limits and tracking

### ✅ Verification System
- Multi-verifier support with reputation scoring
- Production data verification with cryptographic proofs
- Rejection workflow for invalid submissions
- Comprehensive audit trails

### 💰 Credit Management
- Credit batch tracking and statistics
- Credit retirement for compliance
- Transaction history and analytics
- Balance management per wallet address

### 🛒 Marketplace Integration
- Marketplace listing management
- Purchase recording and tracking
- Trading volume and price analytics
- User activity monitoring

### 📊 Admin Dashboard
- System health monitoring
- User management and KYC approval
- Audit log viewing
- Comprehensive statistics

### 🔍 Audit & Logging
- Comprehensive audit logging for all actions
- Security event tracking
- Performance monitoring
- Error tracking and alerting

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT + bcrypt
- **Blockchain**: ethers.js for Ethereum integration
- **Logging**: Winston
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Git

### Installation

1. **Clone and navigate to backend**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup (Option A: Docker)**
```bash
docker-compose up -d postgres
```

3. **Database Setup (Option B: Local PostgreSQL)**
```bash
createdb green_hydrogen_db
```

4. **Run Migrations and Seed Data**
```bash
npm run migrate
npm run seed
```

5. **Start Development Server**
```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password

### Producers
- `GET /api/producers` - List all producers (admin)
- `POST /api/producers` - Register new producer
- `GET /api/producers/:id` - Get producer details
- `PUT /api/producers/:id` - Update producer
- `GET /api/producers/:id/submissions` - Get producer's submissions
- `POST /api/producers/:id/submissions` - Submit production data
- `GET /api/producers/:id/stats` - Get producer statistics

### Verifiers
- `GET /api/verifiers` - List all verifiers (admin)
- `POST /api/verifiers` - Register new verifier
- `GET /api/verifiers/:id` - Get verifier details
- `GET /api/verifiers/:id/verifications` - Get verification history
- `GET /api/verifiers/:id/stats` - Get verifier statistics

### Production Submissions
- `GET /api/submissions` - List all submissions (admin)
- `GET /api/submissions/pending` - Get pending verifications
- `GET /api/submissions/:id` - Get submission details
- `POST /api/submissions/:id/verify` - Verify production data
- `GET /api/submissions/stats/overview` - Get submission statistics

### Credits
- `GET /api/credits/batches` - List credit batches (admin)
- `GET /api/credits/batches/:id` - Get batch details
- `GET /api/credits/balance/:address` - Get credit balance
- `POST /api/credits/retire` - Retire credits
- `GET /api/credits/stats` - Get credit statistics
- `GET /api/credits/transactions` - Get transaction history

### Marketplace
- `GET /api/marketplace/listings` - List marketplace listings
- `POST /api/marketplace/listings` - Create new listing
- `GET /api/marketplace/listings/:id` - Get listing details
- `PUT /api/marketplace/listings/:id` - Update listing
- `POST /api/marketplace/purchases` - Record purchase
- `GET /api/marketplace/activity` - Get user activity
- `GET /api/marketplace/stats` - Get marketplace statistics

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/:id/read` - Mark notification as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `POST /api/notifications` - Create notification (admin)

### Admin
- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id/status` - Update user status
- `PATCH /api/admin/users/:id/kyc` - Update KYC status
- `GET /api/admin/audit-logs` - Get audit logs
- `GET /api/admin/health` - Get system health

## Database Schema

### Core Tables
- **users** - User accounts and authentication
- **producers** - Hydrogen production facilities
- **verifiers** - Third-party verification entities
- **production_submissions** - Production data submissions
- **credit_batches** - Issued credit batches
- **credit_transactions** - All credit transactions
- **marketplace_listings** - Marketplace listings
- **marketplace_purchases** - Purchase records
- **audit_logs** - System audit trail
- **notifications** - User notifications

## Security Features

### Authentication
- JWT tokens with configurable expiration
- Password hashing with bcrypt (12 rounds)
- Role-based access control
- API key authentication for external systems

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection with Helmet
- Rate limiting to prevent abuse
- CORS configuration

### Audit Trail
- Comprehensive logging of all user actions
- Security event tracking
- Database change tracking
- IP address and user agent logging

## Blockchain Integration

### Smart Contract Integration
- Production Oracle: `0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82`
- Credit Contract V2: `0x9A676e781A523b5d0C0e43731313A708CB607508`
- Marketplace: `0x0B306BF915C4d645ff596e518fAf3F9669b97016`

### Features
- Production verification via oracle
- Credit issuance from verified production
- Marketplace transaction recording
- Wallet address validation

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with test data
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Testing
```bash
# Test backend integration
node test-backend.js

# Run API tests
npm test
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Production Deployment

### Environment Variables
```bash
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=secure-password
JWT_SECRET=secure-jwt-secret
ETHEREUM_RPC_URL=your-ethereum-node
```

### Health Checks
- `GET /health` - Basic health check
- `GET /api/admin/health` - Detailed system health (admin only)

### Monitoring
- Winston logging with configurable levels
- Performance metrics tracking
- Error rate monitoring
- Database connection health

## API Documentation

### Response Format
```json
{
  "message": "Success message",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Error Format
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": []
}
```

### Authentication
```bash
# Include JWT token in Authorization header
Authorization: Bearer <jwt-token>

# Or use API key for external integrations
X-API-Key: <api-key>
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and linting
6. Submit a pull request

## License

MIT License - see LICENSE file for details
