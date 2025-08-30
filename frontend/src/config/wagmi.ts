import { createConfig } from 'wagmi'
import { hardhat, sepolia, polygon, polygonMumbai } from 'wagmi/chains'
import { http } from 'viem'

// Custom chain configuration for local Hardhat
const hardhatLocal = {
  ...hardhat,
  id: 1337, // Match the chain ID in hardhat.config.ts
  name: 'Hardhat',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: {
      name: 'Hardhat',
      url: 'http://localhost:8545',
    },
  },
  testnet: true,
}

export const config = createConfig({
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