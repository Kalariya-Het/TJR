-- Green Hydrogen Credit System Database Schema
-- Version: 1.0
-- Created: 2025-08-30

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and authorization
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    wallet_address VARCHAR(42) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    kyc_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Producers table for hydrogen production facilities
CREATE TABLE IF NOT EXISTS producers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    plant_id VARCHAR(100) UNIQUE NOT NULL,
    plant_name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    renewable_source VARCHAR(100) NOT NULL,
    capacity_kg_per_month INTEGER NOT NULL,
    certification_body VARCHAR(255),
    certification_number VARCHAR(100),
    registration_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    monthly_production_limit BIGINT NOT NULL,
    total_produced BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Verifiers table for third-party verification entities
CREATE TABLE IF NOT EXISTS verifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(100) NOT NULL,
    accreditation_body VARCHAR(255),
    accreditation_number VARCHAR(100),
    specialization TEXT[],
    reputation_score INTEGER DEFAULT 100,
    total_verifications INTEGER DEFAULT 0,
    successful_verifications INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Production data submissions
CREATE TABLE IF NOT EXISTS production_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
    data_hash VARCHAR(66) UNIQUE NOT NULL,
    plant_id VARCHAR(100) NOT NULL,
    amount BIGINT NOT NULL,
    production_time TIMESTAMP WITH TIME ZONE NOT NULL,
    submission_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ipfs_hash VARCHAR(100) NOT NULL,
    verification_fee BIGINT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    verifier_id UUID REFERENCES verifiers(id),
    verification_time TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit batches issued from verified production
CREATE TABLE IF NOT EXISTS credit_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id INTEGER UNIQUE NOT NULL,
    producer_id UUID REFERENCES producers(id) ON DELETE CASCADE,
    production_submission_id UUID REFERENCES production_submissions(id),
    amount BIGINT NOT NULL,
    plant_id VARCHAR(100) NOT NULL,
    production_time TIMESTAMP WITH TIME ZONE NOT NULL,
    issuance_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    renewable_source VARCHAR(100) NOT NULL,
    verification_hash VARCHAR(66) NOT NULL,
    ipfs_hash VARCHAR(100) NOT NULL,
    is_retired BOOLEAN DEFAULT false,
    retirement_reason TEXT,
    retirement_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Credit transfers and transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'transfer', 'retirement', 'issuance'
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    amount BIGINT NOT NULL,
    batch_id INTEGER REFERENCES credit_batches(batch_id),
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    transaction_fee BIGINT,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace listings
CREATE TABLE IF NOT EXISTS marketplace_listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id INTEGER UNIQUE NOT NULL,
    seller_id UUID REFERENCES users(id),
    seller_address VARCHAR(42) NOT NULL,
    amount BIGINT NOT NULL,
    price_per_credit BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    renewable_source VARCHAR(100),
    production_date TIMESTAMP WITH TIME ZONE,
    location VARCHAR(255),
    certification VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Marketplace purchases
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id INTEGER REFERENCES marketplace_listings(listing_id),
    buyer_id UUID REFERENCES users(id),
    buyer_address VARCHAR(42) NOT NULL,
    seller_address VARCHAR(42) NOT NULL,
    amount BIGINT NOT NULL,
    price_per_credit BIGINT NOT NULL,
    total_price BIGINT NOT NULL,
    transaction_hash VARCHAR(66) UNIQUE NOT NULL,
    block_number BIGINT,
    purchase_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs for system events
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- API keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    permissions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_producers_wallet_address ON producers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_producers_plant_id ON producers(plant_id);
CREATE INDEX IF NOT EXISTS idx_producers_is_active ON producers(is_active);
CREATE INDEX IF NOT EXISTS idx_producers_user_id ON producers(user_id);

CREATE INDEX IF NOT EXISTS idx_verifiers_wallet_address ON verifiers(wallet_address);
CREATE INDEX IF NOT EXISTS idx_verifiers_is_active ON verifiers(is_active);
CREATE INDEX IF NOT EXISTS idx_verifiers_user_id ON verifiers(user_id);

CREATE INDEX IF NOT EXISTS idx_production_submissions_data_hash ON production_submissions(data_hash);
CREATE INDEX IF NOT EXISTS idx_production_submissions_producer_id ON production_submissions(producer_id);
CREATE INDEX IF NOT EXISTS idx_production_submissions_status ON production_submissions(status);
CREATE INDEX IF NOT EXISTS idx_production_submissions_production_time ON production_submissions(production_time);

CREATE INDEX IF NOT EXISTS idx_credit_batches_batch_id ON credit_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_credit_batches_producer_id ON credit_batches(producer_id);
CREATE INDEX IF NOT EXISTS idx_credit_batches_production_time ON credit_batches(production_time);
CREATE INDEX IF NOT EXISTS idx_credit_batches_is_retired ON credit_batches(is_retired);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_transaction_hash ON credit_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_from_address ON credit_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_to_address ON credit_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_address ON marketplace_listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON marketplace_listings(created_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer_address ON marketplace_purchases(buyer_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_seller_address ON marketplace_purchases(seller_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_transaction_hash ON marketplace_purchases(transaction_hash);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_producers_updated_at ON producers;
CREATE TRIGGER update_producers_updated_at BEFORE UPDATE ON producers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_verifiers_updated_at ON verifiers;
CREATE TRIGGER update_verifiers_updated_at BEFORE UPDATE ON verifiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_production_submissions_updated_at ON production_submissions;
CREATE TRIGGER update_production_submissions_updated_at BEFORE UPDATE ON production_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_batches_updated_at ON credit_batches;
CREATE TRIGGER update_credit_batches_updated_at BEFORE UPDATE ON credit_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
