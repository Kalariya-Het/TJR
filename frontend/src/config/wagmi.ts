import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { hardhat, sepolia, polygon, polygonMumbai } from 'wagmi/chains'
import { http } from 'viem'

// Custom chain configuration for local Hardhat
const hardhatLocal = {
  ...hardhat,
  id: 31337, // Explicitly set Hardhat's default network ID
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
}

export const config = getDefaultConfig({
  appName: 'Green Hydrogen Credit System',
  projectId: process.env.REACT_APP_WALLET_CONNECT_PROJECT_ID || 'your-project-id',
  chains: [hardhatLocal, sepolia, polygon, polygonMumbai],
  transports: {
    [hardhatLocal.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [polygonMumbai.id]: http(),
  },
})

export const SUPPORTED_CHAINS = [
  hardhatLocal,
  sepolia,
  polygon,
  polygonMumbai,
] as const
