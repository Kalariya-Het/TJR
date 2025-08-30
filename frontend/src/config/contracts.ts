import { Address } from 'viem'
import { NetworkConfig } from '../types'

// Contract ABIs (simplified - you can generate full ABIs from typechain)
export const HYDROGEN_CREDIT_ABI = [
  // Read functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address) view returns (uint256)',
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function getProducer(address) view returns (tuple(string plantId, string location, string renewableSource, uint256 totalProduced, uint256 registrationTime, bool isActive))',
  'function getCreditBatch(uint256) view returns (tuple(uint256 batchId, address producer, uint256 amount, string plantId, uint256 productionTime, string renewableSource, bool isRetired))',
  'function getProducerBatches(address) view returns (uint256[])',
  'function getAllProducers() view returns (address[])',
  'function getRegisteredProducersCount() view returns (uint256)',
  'function getContractStats() view returns (uint256 totalSupply, uint256 totalBatches, uint256 totalRetired, uint256 producerCount)',
  'function retiredCredits(address) view returns (uint256)',
  'function totalRetiredCredits() view returns (uint256)',
  
  // Write functions
  'function registerProducer(address, string, string, string)',
  'function issueCredits(address, uint256, uint256)',
  'function transfer(address, uint256) returns (bool)',
  'function transferFrom(address, address, uint256) returns (bool)',
  'function approve(address, uint256) returns (bool)',
  'function retireCredits(uint256, string)',
  'function deactivateProducer(address)',
  'function reactivateProducer(address)',
  'function pause()',
  'function unpause()',
  
  // Events
  'event CreditIssued(address indexed producer, uint256 amount, string indexed plantId, uint256 timestamp, string renewableSource)',
  'event CreditTransferred(address indexed from, address indexed to, uint256 amount, uint256 timestamp)',
  'event ProducerRegistered(address indexed producer, string plantId, string location, uint256 timestamp)',
  'event CreditRetired(address indexed owner, uint256 amount, string reason, uint256 timestamp)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
] as const

export const MARKETPLACE_ABI = [
  // Read functions
  'function hydrogenCredit() view returns (address)',
  'function owner() view returns (address)',
  'function paused() view returns (bool)',
  'function nextListingId() view returns (uint256)',
  'function totalListings() view returns (uint256)',
  'function totalTradedVolume() view returns (uint256)',
  'function platformFeePercent() view returns (uint256)',
  'function feeRecipient() view returns (address)',
  'function getListing(uint256) view returns (tuple(uint256 id, address seller, uint256 amount, uint256 pricePerUnit, uint256 createdAt, bool isActive))',
  'function getSellerListings(address) view returns (uint256[])',
  'function getActiveListings(uint256, uint256) view returns (tuple(uint256 id, address seller, uint256 amount, uint256 pricePerUnit, uint256 createdAt, bool isActive)[])',
  'function getMarketplaceStats() view returns (uint256 totalListingsCreated, uint256 activeListingsCount, uint256 totalVolume, uint256 feePercent)',
  
  // Write functions
  'function createListing(uint256, uint256)',
  'function purchaseCredits(uint256, uint256) payable',
  'function cancelListing(uint256)',
  'function updateListingPrice(uint256, uint256)',
  'function setPlatformFee(uint256)',
  'function setFeeRecipient(address)',
  'function pause()',
  'function unpause()',
  'function emergencyWithdraw(address, uint256)',
  
  // Events
  'event ListingCreated(uint256 indexed listingId, address indexed seller, uint256 amount, uint256 pricePerUnit, uint256 timestamp)',
  'event ListingCancelled(uint256 indexed listingId, address indexed seller, uint256 timestamp)',
  'event Purchase(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 amount, uint256 totalPrice, uint256 timestamp)',
  'event PriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice, uint256 timestamp)',
] as const

// Network configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  // Hardhat Local Network (localhost)
  1337: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    hydrogenCreditAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Default Hardhat deployment
    marketplaceAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,
  },
  // Hardhat Local Network (node)
  31337: {
    chainId: 31337,
    name: 'Hardhat',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    hydrogenCreditAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Default Hardhat deployment
    marketplaceAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,
  },
  // Sepolia Testnet
  11155111: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    hydrogenCreditAddress: '0x0000000000000000000000000000000000000000' as Address, // Update after deployment
    marketplaceAddress: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Polygon Mainnet
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    hydrogenCreditAddress: '0x0000000000000000000000000000000000000000' as Address, // Update after deployment
    marketplaceAddress: '0x0000000000000000000000000000000000000000' as Address,
  },
  // Mumbai Testnet
  80001: {
    chainId: 80001,
    name: 'Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    blockExplorer: 'https://mumbai.polygonscan.com',
    hydrogenCreditAddress: '0x0000000000000000000000000000000000000000' as Address, // Update after deployment
    marketplaceAddress: '0x0000000000000000000000000000000000000000' as Address,
  },
}

// Default network (Hardhat local)
export const DEFAULT_CHAIN_ID = 31337

// Contract addresses getter function
export const getContractAddresses = (chainId: number) => {
  const network = NETWORKS[chainId]
  if (!network) {
    throw new Error(`Unsupported network: ${chainId}`)
  }
  return {
    hydrogenCredit: network.hydrogenCreditAddress,
    marketplace: network.marketplaceAddress,
  }
}

// Network getter function
export const getNetworkConfig = (chainId: number): NetworkConfig => {
  const network = NETWORKS[chainId]
  if (!network) {
    throw new Error(`Unsupported network: ${chainId}`)
  }
  return network
}

// Contract deployment addresses (update these after deployment)
export const CONTRACT_ADDRESSES = {
  localhost: {
    hydrogenCredit: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
    marketplace: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as Address,
  },
  sepolia: {
    hydrogenCredit: '0x0000000000000000000000000000000000000000' as Address,
    marketplace: '0x0000000000000000000000000000000000000000' as Address,
  },
  polygon: {
    hydrogenCredit: '0x0000000000000000000000000000000000000000' as Address,
    marketplace: '0x0000000000000000000000000000000000000000' as Address,
  },
  mumbai: {
    hydrogenCredit: '0x0000000000000000000000000000000000000000' as Address,
    marketplace: '0x0000000000000000000000000000000000000000' as Address,
  },
}

// Utility constants
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address
export const TOKEN_DECIMALS = 18
export const ITEMS_PER_PAGE = 10
