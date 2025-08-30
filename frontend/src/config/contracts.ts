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
          {"internalType": "bool", "name": "isActive", "type": "bool"}
        ],
        "internalType": "struct HydrogenCredit.Producer",
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
      {"internalType": "uint256", "name": "producerCount", "type": "uint256"}
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
  }
] as const

export const MARKETPLACE_ABI = [
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
    hydrogenCreditAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Fresh deployment
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
