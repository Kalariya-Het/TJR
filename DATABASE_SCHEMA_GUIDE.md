# 🗄️ Database Schema & Data Flow Guide

## Database Schema Visualization

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     USERS       │    │   PRODUCERS     │    │   VERIFIERS     │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)         │◄──┐│ id (PK)         │    │ id (PK)         │
│ email           │   ││ user_id (FK)    │    │ user_id (FK)    │◄┐
│ password_hash   │   ││ wallet_address  │    │ wallet_address  │ │
│ role            │   ││ plant_id        │    │ organization    │ │
│ wallet_address  │   ││ plant_name      │    │ reputation      │ │
│ first_name      │   ││ location        │    │ is_active       │ │
│ last_name       │   ││ renewable_source│    │ created_at      │ │
│ company_name    │   ││ capacity_kg     │    └─────────────────┘ │
│ is_verified     │   ││ is_verified     │                        │
│ kyc_status      │   ││ created_at      │                        │
│ created_at      │   │└─────────────────┘                        │
│ updated_at      │   │                                           │
└─────────────────┘   │                                           │
                      │                                           │
┌─────────────────────┼───────────────────────────────────────────┘
│                     │
│ ┌─────────────────┐ │    ┌─────────────────┐
│ │PRODUCTION_SUBM  │ │    │  VERIFICATIONS  │
│ ├─────────────────┤ │    ├─────────────────┤
│ │ id (PK)         │ │    │ id (PK)         │
│ │ producer_id (FK)├─┘    │ submission_id   │◄┐
│ │ submission_hash │      │ verifier_id (FK)├─┘
│ │ data_hash       │      │ verification_tx │
│ │ plant_id        │      │ is_approved     │
│ │ amount          │      │ notes           │
│ │ production_date │      │ created_at      │
│ │ renewable_pct   │      └─────────────────┘
│ │ ipfs_hash       │
│ │ status          │      ┌─────────────────┐
│ │ verification_time│     │ CREDIT_BATCHES  │
│ │ verifier_notes  │      ├─────────────────┤
│ │ created_at      │      │ id (PK)         │
│ └─────────────────┘      │ producer_id (FK)│
│                          │ submission_id   │◄┐
│                          │ batch_id        │ │
│                          │ amount          │ │
│                          │ issue_date      │ │
│                          │ blockchain_tx   │ │
│                          │ status          │ │
│                          │ created_at      │ │
│                          └─────────────────┘ │
│                                              │
│ ┌────────────────────────────────────────────┘
│ │
│ │ ┌─────────────────┐    ┌─────────────────┐
│ │ │CREDIT_TRANS     │    │MARKETPLACE_LIST │
│ │ ├─────────────────┤    ├─────────────────┤
│ │ │ id (PK)         │    │ id (PK)         │
│ │ │ from_address    │    │ seller_address  │
│ │ │ to_address      │    │ amount          │
│ │ │ amount          │    │ price_per_credit│
│ │ │ transaction_type│    │ total_price     │
│ │ │ blockchain_tx   │    │ status          │
│ │ │ created_at      │    │ created_at      │
│ │ └─────────────────┘    │ expires_at      │
│ │                        └─────────────────┘
│ │
│ │ ┌─────────────────┐    ┌─────────────────┐
│ │ │ AUDIT_LOGS      │    │ NOTIFICATIONS   │
│ │ ├─────────────────┤    ├─────────────────┤
│ │ │ id (PK)         │    │ id (PK)         │
│ │ │ user_id (FK)    │◄───┤ user_id (FK)    │
│ │ │ action          │    │ type            │
│ │ │ resource_type   │    │ title           │
│ │ │ resource_id     │    │ message         │
│ │ │ old_values      │    │ is_read         │
│ │ │ new_values      │    │ created_at      │
│ │ │ ip_address      │    └─────────────────┘
│ │ │ user_agent      │
│ │ │ created_at      │
│ │ └─────────────────┘
│ └─────────────────────────────────────────────
```

## Data Flow Examples

### 1. Producer Registration Flow
```sql
-- Step 1: User account creation
INSERT INTO users (
  id, email, password_hash, role, wallet_address, 
  first_name, last_name, company_name, kyc_status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'producer@solar.com',
  '$2b$12$hashed_password',
  'producer',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  'Hans', 'Mueller', 'Solar Hydrogen GmbH', 'pending'
);

-- Step 2: Producer profile creation
INSERT INTO producers (
  id, user_id, wallet_address, plant_id, plant_name,
  location, renewable_source, capacity_kg_per_month
) VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440001',
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  'SOLAR-PLANT-V2-001',
  'Munich Solar Hydrogen Facility',
  'Munich, Germany',
  'Solar',
  5000
);

-- Step 3: Audit log entry
INSERT INTO audit_logs (
  user_id, action, resource_type, resource_id, new_values
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'create_producer_profile',
  'producer',
  '550e8400-e29b-41d4-a716-446655440002',
  '{"plant_name": "Munich Solar Hydrogen Facility", "capacity": 5000}'
);
```

### 2. Production Submission Flow
```sql
-- Step 1: Production data submission
INSERT INTO production_submissions (
  id, producer_id, submission_hash, data_hash, plant_id,
  amount, production_date, renewable_percentage, ipfs_hash, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440002',
  '0x16ad23f5589cf38dbe63026daa8196ff9c430b1db088e00940ce7971bbfd3d23',
  '0x7b2274797065223a2270726f64756374696f6e5f64617461222c22616d6f756e74',
  'SOLAR-PLANT-V2-001',
  '1000000000000000000000', -- 1000 kg in Wei format
  '2024-01-15',
  100,
  'QmX7KwC4dPVgwqzJ8YrN5tP2mQ3vR9sL6nE4wF8xG2hA5k',
  'pending'
);

-- Step 2: Notification to verifiers
INSERT INTO notifications (
  user_id, type, title, message
) VALUES (
  (SELECT user_id FROM verifiers WHERE is_active = true LIMIT 1),
  'verification_request',
  'New Production Submission',
  'Munich Solar Hydrogen Facility submitted 1000 kg for verification'
);
```

### 3. Verification Process Flow
```sql
-- Step 1: Verifier reviews submission
INSERT INTO verifications (
  submission_id, verifier_id, verification_tx_hash, 
  is_approved, notes
) VALUES (
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004',
  '0x8f2e4c1a9b7d3e5f6a8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
  true,
  'Production data verified. Renewable energy source confirmed.'
);

-- Step 2: Update submission status
UPDATE production_submissions 
SET status = 'verified', 
    verification_time = NOW(),
    verifier_notes = 'Production data verified. Renewable energy source confirmed.'
WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- Step 3: Audit log for verification
INSERT INTO audit_logs (
  user_id, action, resource_type, resource_id, 
  old_values, new_values
) VALUES (
  '550e8400-e29b-41d4-a716-446655440004',
  'verify_production',
  'production_submission',
  '550e8400-e29b-41d4-a716-446655440003',
  '{"status": "pending"}',
  '{"status": "verified", "verification_time": "2024-01-15T10:30:00Z"}'
);
```

### 4. Credit Issuance Flow
```sql
-- Step 1: Credit batch creation after blockchain mint
INSERT INTO credit_batches (
  id, producer_id, submission_id, batch_id, amount,
  issue_date, blockchain_tx_hash, status
) VALUES (
  '550e8400-e29b-41d4-a716-446655440005',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  'BATCH-2024-001-SOLAR-001',
  '1000000000000000000000',
  NOW(),
  '0x9a3b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
  'active'
);

-- Step 2: Credit transaction record
INSERT INTO credit_transactions (
  from_address, to_address, amount, transaction_type,
  blockchain_tx_hash, batch_id
) VALUES (
  '0x0000000000000000000000000000000000000000', -- Mint from zero address
  '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  '1000000000000000000000',
  'mint',
  '0x9a3b5c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
  'BATCH-2024-001-SOLAR-001'
);

-- Step 3: Notification to producer
INSERT INTO notifications (
  user_id, type, title, message
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'credits_issued',
  'Credits Issued Successfully',
  '1000 hydrogen credits have been issued to your wallet'
);
```

## Complex Query Examples

### Producer Dashboard Statistics
```sql
-- Get comprehensive producer statistics
SELECT 
  p.plant_name,
  p.renewable_source,
  p.capacity_kg_per_month,
  COUNT(ps.id) as total_submissions,
  COUNT(CASE WHEN ps.status = 'verified' THEN 1 END) as verified_submissions,
  COUNT(CASE WHEN ps.status = 'pending' THEN 1 END) as pending_submissions,
  COALESCE(SUM(CASE WHEN ps.status = 'verified' 
    THEN CAST(ps.amount AS NUMERIC) END), 0) as total_verified_production,
  COUNT(cb.id) as credit_batches_issued,
  COALESCE(SUM(CAST(cb.amount AS NUMERIC)), 0) as total_credits_issued
FROM producers p
LEFT JOIN production_submissions ps ON p.id = ps.producer_id
LEFT JOIN credit_batches cb ON p.id = cb.producer_id
WHERE p.user_id = $1
GROUP BY p.id, p.plant_name, p.renewable_source, p.capacity_kg_per_month;
```

### System-wide Analytics
```sql
-- Get comprehensive system statistics
WITH monthly_stats AS (
  SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as submissions,
    SUM(CASE WHEN status = 'verified' THEN 1 ELSE 0 END) as verified,
    SUM(CASE WHEN status = 'verified' 
      THEN CAST(amount AS NUMERIC) ELSE 0 END) as verified_production
  FROM production_submissions
  GROUP BY DATE_TRUNC('month', created_at)
)
SELECT 
  (SELECT COUNT(*) FROM users WHERE role = 'producer') as total_producers,
  (SELECT COUNT(*) FROM users WHERE role = 'verifier') as total_verifiers,
  (SELECT COUNT(*) FROM production_submissions) as total_submissions,
  (SELECT COUNT(*) FROM production_submissions WHERE status = 'verified') as verified_submissions,
  (SELECT COUNT(*) FROM credit_batches) as total_credit_batches,
  (SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) FROM credit_batches) as total_credits_issued,
  (SELECT COUNT(*) FROM credit_transactions WHERE transaction_type = 'transfer') as total_trades,
  ms.month,
  ms.submissions as monthly_submissions,
  ms.verified as monthly_verified,
  ms.verified_production as monthly_production
FROM monthly_stats ms
ORDER BY ms.month DESC
LIMIT 12;
```

### Audit Trail Query
```sql
-- Get detailed audit trail with user information
SELECT 
  u.email,
  u.role,
  al.action,
  al.resource_type,
  al.resource_id,
  al.old_values,
  al.new_values,
  al.ip_address,
  al.created_at,
  CASE 
    WHEN al.resource_type = 'producer' THEN p.plant_name
    WHEN al.resource_type = 'production_submission' THEN ps.plant_id
    ELSE NULL
  END as resource_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN producers p ON al.resource_type = 'producer' AND al.resource_id = p.id::text
LEFT JOIN production_submissions ps ON al.resource_type = 'production_submission' AND al.resource_id = ps.id::text
ORDER BY al.created_at DESC
LIMIT 100;
```

## Data Integrity Constraints

### Foreign Key Relationships
```sql
-- Producers must have valid user
ALTER TABLE producers 
ADD CONSTRAINT fk_producers_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Submissions must have valid producer
ALTER TABLE production_submissions 
ADD CONSTRAINT fk_submissions_producer 
FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE;

-- Credit batches must have valid producer and submission
ALTER TABLE credit_batches 
ADD CONSTRAINT fk_batches_producer 
FOREIGN KEY (producer_id) REFERENCES producers(id) ON DELETE CASCADE;

ALTER TABLE credit_batches 
ADD CONSTRAINT fk_batches_submission 
FOREIGN KEY (submission_id) REFERENCES production_submissions(id) ON DELETE CASCADE;
```

### Business Logic Constraints
```sql
-- Ensure renewable percentage is valid
ALTER TABLE production_submissions 
ADD CONSTRAINT chk_renewable_percentage 
CHECK (renewable_percentage >= 0 AND renewable_percentage <= 100);

-- Ensure production amount is positive
ALTER TABLE production_submissions 
ADD CONSTRAINT chk_positive_amount 
CHECK (CAST(amount AS NUMERIC) > 0);

-- Ensure capacity is positive
ALTER TABLE producers 
ADD CONSTRAINT chk_positive_capacity 
CHECK (capacity_kg_per_month > 0);

-- Ensure valid user roles
ALTER TABLE users 
ADD CONSTRAINT chk_valid_role 
CHECK (role IN ('admin', 'producer', 'verifier', 'buyer'));

-- Ensure valid submission status
ALTER TABLE production_submissions 
ADD CONSTRAINT chk_valid_status 
CHECK (status IN ('pending', 'verified', 'rejected'));
```

## Indexes for Performance

```sql
-- User lookup indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);

-- Producer lookup indexes
CREATE INDEX idx_producers_user ON producers(user_id);
CREATE INDEX idx_producers_wallet ON producers(wallet_address);
CREATE INDEX idx_producers_plant ON producers(plant_id);

-- Submission lookup indexes
CREATE INDEX idx_submissions_producer ON production_submissions(producer_id);
CREATE INDEX idx_submissions_status ON production_submissions(status);
CREATE INDEX idx_submissions_date ON production_submissions(production_date);
CREATE INDEX idx_submissions_hash ON production_submissions(submission_hash);

-- Credit batch indexes
CREATE INDEX idx_batches_producer ON credit_batches(producer_id);
CREATE INDEX idx_batches_submission ON credit_batches(submission_id);
CREATE INDEX idx_batches_date ON credit_batches(issue_date);

-- Transaction indexes
CREATE INDEX idx_transactions_from ON credit_transactions(from_address);
CREATE INDEX idx_transactions_to ON credit_transactions(to_address);
CREATE INDEX idx_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_transactions_date ON credit_transactions(created_at);

-- Audit log indexes
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
```

This database schema provides complete traceability, data integrity, and performance optimization for the Green Hydrogen Credit System.
