import { Address } from 'viem'
import { NetworkConfig } from '../types'

// Contract ABIs - Using proper JSON ABI format
export const HYDROGEN_CREDIT_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "producer", "type": "address"}],
    "name": "getProducer",
    "outputs": [
      {
        "components": [
          {"internalType": "string", "name": "plantId", "type": "string"},
          {"internalType": "string", "name": "location", "type": "string"},
          {"internalType": "string", "name": "renewableSource", "type": "string"},
          {"internalType": "uint256", "name": "totalProduced", "type": "uint256"},
          {"internalType": "uint256", "name": "registrationTime", "type": "uint256"},
          {"internalType": "uint256", "name": "monthlyProductionLimit", "type": "uint256"},
          {"internalType": "uint256", "name": "currentMonthProduction", "type": "uint256"},
          {"internalType": "uint256", "name": "lastProductionMonth", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"},
          {"internalType": "bool", "name": "isVerified", "type": "bool"}
        ],
        "internalType": "struct HydrogenCreditV2.Producer",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "producer", "type": "address"}],
    "name": "getProducerBatches",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContractStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalSupply", "type": "uint256"},
      {"internalType": "uint256", "name": "totalBatches", "type": "uint256"},
      {"internalType": "uint256", "name": "totalRetired", "type": "uint256"},
      {"internalType": "uint256", "name": "producerCount", "type": "uint256"},
      {"internalType": "uint256", "name": "verifiedProducerCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "retiredCredits",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProducers",
    "outputs": [{"internalType": "address[]", "name": "", "type": "address[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "batchId", "type": "uint256"}],
    "name": "getCreditBatch",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "batchId", "type": "uint256"},
          {"internalType": "address", "name": "producer", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "string", "name": "plantId", "type": "string"},
          {"internalType": "uint256", "name": "productionTime", "type": "uint256"},
          {"internalType": "string", "name": "renewableSource", "type": "string"},
          {"internalType": "bytes32", "name": "verificationHash", "type": "bytes32"},
          {"internalType": "bool", "name": "isRetired", "type": "bool"},
          {"internalType": "string", "name": "ipfsHash", "type": "string"}
        ],
        "internalType": "struct HydrogenCreditV2.CreditBatch",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalCreditBatches",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

export const MARKETPLACE_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "uint256", "name": "pricePerUnit", "type": "uint256"}
    ],
    "name": "createListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "listingId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "purchaseCredits",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "listingId", "type": "uint256"}],
    "name": "cancelListing",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "listingId", "type": "uint256"},
      {"internalType": "uint256", "name": "newPricePerUnit", "type": "uint256"}
    ],
    "name": "updateListingPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "listingId", "type": "uint256"}],
    "name": "getListing",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint256", "name": "pricePerUnit", "type": "uint256"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "internalType": "struct HydrogenCreditMarketplace.Listing",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketplaceStats",
    "outputs": [
      {"internalType": "uint256", "name": "totalListingsCreated", "type": "uint256"},
      {"internalType": "uint256", "name": "activeListingsCount", "type": "uint256"},
      {"internalType": "uint256", "name": "totalVolume", "type": "uint256"},
      {"internalType": "uint256", "name": "feePercent", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "seller", "type": "address"}],
    "name": "getSellerListings",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "startId", "type": "uint256"},
      {"internalType": "uint256", "name": "endId", "type": "uint256"}
    ],
    "name": "getActiveListings",
    "outputs": [
      {
        "components": [
          {"internalType": "uint256", "name": "id", "type": "uint256"},
          {"internalType": "address", "name": "seller", "type": "address"},
          {"internalType": "uint256", "name": "amount", "type": "uint256"},
          {"internalType": "uint256", "name": "pricePerUnit", "type": "uint256"},
          {"internalType": "uint256", "name": "createdAt", "type": "uint256"},
          {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "internalType": "struct HydrogenCreditMarketplace.Listing[]",
        "name": "activeListings",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "platformFeePercent",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Network configurations
export const NETWORKS: Record<number, NetworkConfig> = {
  // Hardhat Local Network (localhost)
  1337: {
    chainId: 1337,
    name: 'Localhost',
    rpcUrl: 'http://127.0.0.1:8545',
    blockExplorer: '',
    hydrogenCreditAddress: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44' as Address, // Fresh V2 deployment
    marketplaceAddress: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f' as Address, // Fresh V2 deployment
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
export const DEFAULT_CHAIN_ID = 1337

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
    hydrogenCredit: '0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44' as Address,
    marketplace: '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f' as Address,
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
