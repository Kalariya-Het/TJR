-- Migration: Add blockchain data tables
-- Description: Tables for storing real blockchain event data

-- Credit batches from blockchain events
CREATE TABLE IF NOT EXISTS credit_batches (
    id SERIAL PRIMARY KEY,
    batch_id VARCHAR(255) UNIQUE NOT NULL,
    producer_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 0) NOT NULL,
    block_number INTEGER,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit transfers from blockchain events
CREATE TABLE IF NOT EXISTS credit_transfers (
    id SERIAL PRIMARY KEY,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 0) NOT NULL,
    block_number INTEGER,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marketplace purchases from blockchain events
CREATE TABLE IF NOT EXISTS marketplace_purchases (
    id SERIAL PRIMARY KEY,
    listing_id VARCHAR(255) NOT NULL,
    buyer_address VARCHAR(42) NOT NULL,
    amount DECIMAL(20, 0) NOT NULL,
    total_price DECIMAL(20, 0) NOT NULL,
    block_number INTEGER,
    transaction_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update marketplace_listings table to include blockchain data
ALTER TABLE marketplace_listings 
ADD COLUMN IF NOT EXISTS block_number INTEGER,
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(66),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_credit_batches_producer ON credit_batches(producer_address);
CREATE INDEX IF NOT EXISTS idx_credit_batches_batch_id ON credit_batches(batch_id);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_from ON credit_transfers(from_address);
CREATE INDEX IF NOT EXISTS idx_credit_transfers_to ON credit_transfers(to_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_listing ON marketplace_purchases(listing_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller ON marketplace_listings(seller_address);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_active ON marketplace_listings(is_active);

-- Update trigger for marketplace_listings
CREATE OR REPLACE FUNCTION update_marketplace_listings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_marketplace_listings_timestamp ON marketplace_listings;
CREATE TRIGGER trigger_update_marketplace_listings_timestamp
    BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_listings_timestamp();
