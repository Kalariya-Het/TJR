const { ethers } = require('ethers');
const { query } = require('../config/database');

// Contract ABIs (minimal for events)
const CREDIT_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event CreditIssued(address indexed producer, uint256 amount, uint256 batchId)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)"
];

const MARKETPLACE_ABI = [
  "event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerUnit)",
  "event ListingCancelled(uint256 indexed listingId)",
  "event ListingPurchased(uint256 indexed listingId, address indexed buyer, uint256 amount, uint256 totalPrice)",
  "event PriceUpdated(uint256 indexed listingId, uint256 newPricePerUnit)",
  "function getListingCount() view returns (uint256)",
  "function listings(uint256) view returns (address seller, uint256 amount, uint256 pricePerUnit, bool isActive)"
];

class BlockchainListener {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545');
    this.creditContract = new ethers.Contract(
      process.env.CREDIT_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3',
      CREDIT_ABI,
      this.provider
    );
    this.marketplaceContract = new ethers.Contract(
      process.env.MARKETPLACE_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
      MARKETPLACE_ABI,
      this.provider
    );
    this.isListening = false;
  }

  async startListening() {
    if (this.isListening) {
      console.log('Blockchain listener already running');
      return;
    }

    console.log('🔗 Starting blockchain event listener...');
    this.isListening = true;

    try {
      // Listen to credit contract events
      this.creditContract.on('CreditIssued', async (producer, amount, batchId, event) => {
        console.log('📊 Credit issued:', { producer, amount: amount.toString(), batchId: batchId.toString() });
        await this.handleCreditIssued(producer, amount, batchId, event);
      });

      this.creditContract.on('Transfer', async (from, to, value, event) => {
        console.log('💸 Credit transfer:', { from, to, value: value.toString() });
        await this.handleCreditTransfer(from, to, value, event);
      });

      // Listen to marketplace events
      this.marketplaceContract.on('ListingCreated', async (listingId, seller, amount, pricePerUnit, event) => {
        console.log('🏪 Listing created:', { listingId: listingId.toString(), seller, amount: amount.toString(), pricePerUnit: pricePerUnit.toString() });
        await this.handleListingCreated(listingId, seller, amount, pricePerUnit, event);
      });

      this.marketplaceContract.on('ListingPurchased', async (listingId, buyer, amount, totalPrice, event) => {
        console.log('🛒 Listing purchased:', { listingId: listingId.toString(), buyer, amount: amount.toString(), totalPrice: totalPrice.toString() });
        await this.handleListingPurchased(listingId, buyer, amount, totalPrice, event);
      });

      this.marketplaceContract.on('ListingCancelled', async (listingId, event) => {
        console.log('❌ Listing cancelled:', { listingId: listingId.toString() });
        await this.handleListingCancelled(listingId, event);
      });

      this.marketplaceContract.on('PriceUpdated', async (listingId, newPricePerUnit, event) => {
        console.log('💰 Price updated:', { listingId: listingId.toString(), newPricePerUnit: newPricePerUnit.toString() });
        await this.handlePriceUpdated(listingId, newPricePerUnit, event);
      });

      console.log('✅ Blockchain listener started successfully');
      
      // Initial sync of existing data
      await this.syncExistingData();
      
    } catch (error) {
      console.error('❌ Error starting blockchain listener:', error);
      this.isListening = false;
    }
  }

  async syncExistingData() {
    console.log('🔄 Syncing existing blockchain data...');
    
    try {
      // Sync marketplace listings
      const listingCount = await this.marketplaceContract.getListingCount();
      console.log(`Found ${listingCount} total listings`);
      
      for (let i = 1; i <= listingCount; i++) {
        try {
          const listing = await this.marketplaceContract.listings(i);
          if (listing.isActive) {
            await this.upsertMarketplaceListing(i, listing.seller, listing.amount, listing.pricePerUnit, true);
          }
        } catch (error) {
          console.error(`Error syncing listing ${i}:`, error);
        }
      }
      
      console.log('✅ Existing data sync completed');
    } catch (error) {
      console.error('❌ Error syncing existing data:', error);
    }
  }

  async handleCreditIssued(producer, amount, batchId, event) {
    try {
      await query(`
        INSERT INTO credit_batches (batch_id, producer_address, amount, block_number, transaction_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (batch_id) DO UPDATE SET
          amount = EXCLUDED.amount,
          block_number = EXCLUDED.block_number,
          transaction_hash = EXCLUDED.transaction_hash
      `, [batchId.toString(), producer, amount.toString(), event.blockNumber, event.transactionHash]);
    } catch (error) {
      console.error('Error handling credit issued:', error);
    }
  }

  async handleCreditTransfer(from, to, value, event) {
    try {
      await query(`
        INSERT INTO credit_transfers (from_address, to_address, amount, block_number, transaction_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `, [from, to, value.toString(), event.blockNumber, event.transactionHash]);
    } catch (error) {
      console.error('Error handling credit transfer:', error);
    }
  }

  async handleListingCreated(listingId, seller, amount, pricePerUnit, event) {
    await this.upsertMarketplaceListing(listingId, seller, amount, pricePerUnit, true, event);
  }

  async handleListingPurchased(listingId, buyer, amount, totalPrice, event) {
    try {
      // Record the purchase
      await query(`
        INSERT INTO marketplace_purchases (listing_id, buyer_address, amount, total_price, block_number, transaction_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [listingId.toString(), buyer, amount.toString(), totalPrice.toString(), event.blockNumber, event.transactionHash]);

      // Update listing amount or deactivate if fully purchased
      const listing = await this.marketplaceContract.listings(listingId);
      if (listing.amount.toString() === '0') {
        await query(`
          UPDATE marketplace_listings 
          SET is_active = false, updated_at = NOW()
          WHERE listing_id = $1
        `, [listingId.toString()]);
      } else {
        await query(`
          UPDATE marketplace_listings 
          SET amount = $1, updated_at = NOW()
          WHERE listing_id = $2
        `, [listing.amount.toString(), listingId.toString()]);
      }
    } catch (error) {
      console.error('Error handling listing purchased:', error);
    }
  }

  async handleListingCancelled(listingId, event) {
    try {
      await query(`
        UPDATE marketplace_listings 
        SET is_active = false, updated_at = NOW()
        WHERE listing_id = $1
      `, [listingId.toString()]);
    } catch (error) {
      console.error('Error handling listing cancelled:', error);
    }
  }

  async handlePriceUpdated(listingId, newPricePerUnit, event) {
    try {
      await query(`
        UPDATE marketplace_listings 
        SET price_per_unit = $1, updated_at = NOW()
        WHERE listing_id = $2
      `, [newPricePerUnit.toString(), listingId.toString()]);
    } catch (error) {
      console.error('Error handling price updated:', error);
    }
  }

  async upsertMarketplaceListing(listingId, seller, amount, pricePerUnit, isActive, event = null) {
    try {
      await query(`
        INSERT INTO marketplace_listings (listing_id, seller_address, amount, price_per_unit, is_active, block_number, transaction_hash, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (listing_id) DO UPDATE SET
          seller_address = EXCLUDED.seller_address,
          amount = EXCLUDED.amount,
          price_per_unit = EXCLUDED.price_per_unit,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
      `, [
        listingId.toString(), 
        seller, 
        amount.toString(), 
        pricePerUnit.toString(), 
        isActive,
        event?.blockNumber || null,
        event?.transactionHash || null
      ]);
    } catch (error) {
      console.error('Error upserting marketplace listing:', error);
    }
  }

  async stopListening() {
    if (!this.isListening) {
      return;
    }

    console.log('🛑 Stopping blockchain listener...');
    this.creditContract.removeAllListeners();
    this.marketplaceContract.removeAllListeners();
    this.isListening = false;
    console.log('✅ Blockchain listener stopped');
  }

  async getStats() {
    try {
      const totalSupply = await this.creditContract.totalSupply();
      const listingCount = await this.marketplaceContract.getListingCount();
      
      return {
        totalCredits: totalSupply.toString(),
        totalListings: listingCount.toString(),
        isListening: this.isListening
      };
    } catch (error) {
      console.error('Error getting blockchain stats:', error);
      return {
        totalCredits: '0',
        totalListings: '0',
        isListening: this.isListening
      };
    }
  }
}

module.exports = BlockchainListener;
