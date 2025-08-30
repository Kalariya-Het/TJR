import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address } from 'viem'
import { HYDROGEN_CREDIT_ABI, MARKETPLACE_ABI } from '../config/contracts'
import { getContractAddresses } from '../config/contracts'
import { useChainId, useAccount } from 'wagmi'

// Custom hook for contract interactions
export const useContracts = () => {
  const chainId = useChainId()
  const { address } = useAccount()
  
  const contractAddresses = getContractAddresses(chainId)
  
  // Write contract hook
  const { writeContract, data: writeData, isPending: isWriting, error: writeError } = useWriteContract()
  
  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: writeData,
  })

  return {
    contractAddresses,
    writeContract,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError,
    writeData,
  }
}

// Hook for HydrogenCredit contract reads
export const useHydrogenCreditReads = () => {
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)

  // Token info
  const { data: name } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'name',
  })

  const { data: symbol } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'symbol',
  })

  const { data: totalSupply } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'totalSupply',
  })

  const { data: owner } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'owner',
  })

  // Contract stats
  const { data: contractStats, refetch: refetchStats } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'getContractStats',
  })

  // All producers
  const { data: allProducers, refetch: refetchProducers } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'getAllProducers',
  })

  return {
    tokenInfo: { name, symbol, totalSupply },
    owner,
    contractStats,
    allProducers,
    refetch: {
      stats: refetchStats,
      producers: refetchProducers,
    },
  }
}

// Hook for user-specific data
export const useUserData = (userAddress?: Address) => {
  const chainId = useChainId()
  const { address } = useAccount()
  const targetAddress = userAddress || address
  const contractAddresses = getContractAddresses(chainId)

  // User balance
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: { enabled: !!targetAddress },
  })

  // Producer info (if user is a producer)
  const { data: producerInfo, refetch: refetchProducerInfo } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'getProducer',
    args: targetAddress ? [targetAddress] : undefined,
    query: { enabled: !!targetAddress },
  })

  // Producer batches
  const { data: producerBatches, refetch: refetchBatches } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'getProducerBatches',
    args: targetAddress ? [targetAddress] : undefined,
    query: { enabled: !!targetAddress && !!(producerInfo && typeof producerInfo === 'object' && 'isActive' in producerInfo && producerInfo.isActive) },
  })

  // Retired credits
  const { data: retiredCredits } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'retiredCredits',
    args: targetAddress ? [targetAddress] : undefined,
    query: { enabled: !!targetAddress },
  })

  // User marketplace listings
  const { data: userListings, refetch: refetchListings } = useReadContract({
    address: contractAddresses.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'getSellerListings',
    args: targetAddress ? [targetAddress] : undefined,
    query: { enabled: !!targetAddress },
  })

  return {
    balance,
    producerInfo,
    producerBatches,
    retiredCredits,
    userListings,
    refetch: {
      balance: refetchBalance,
      producerInfo: refetchProducerInfo,
      batches: refetchBatches,
      listings: refetchListings,
    },
  }
}

// Hook for marketplace data
export const useMarketplaceData = () => {
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)

  // Marketplace stats
  const { data: marketplaceStats, refetch: refetchMarketplaceStats } = useReadContract({
    address: contractAddresses.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'getMarketplaceStats',
  })

  // Platform fee
  const { data: platformFee } = useReadContract({
    address: contractAddresses.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'platformFeePercent',
  })

  return {
    marketplaceStats,
    platformFee,
    refetch: {
      marketplaceStats: refetchMarketplaceStats,
    },
  }
}

// Hook for specific credit batch
export const useCreditBatch = (batchId?: bigint) => {
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)

  const { data: batchData } = useReadContract({
    address: contractAddresses.hydrogenCredit,
    abi: HYDROGEN_CREDIT_ABI,
    functionName: 'getCreditBatch',
    args: batchId ? [batchId] : undefined,
    query: { enabled: !!batchId && batchId > BigInt(0) },
  })

  return { batchData }
}

// Hook for specific listing
export const useListing = (listingId?: bigint) => {
  const chainId = useChainId()
  const contractAddresses = getContractAddresses(chainId)

  const { data: listingData } = useReadContract({
    address: contractAddresses.marketplace,
    abi: MARKETPLACE_ABI,
    functionName: 'getListing',
    args: listingId ? [listingId] : undefined,
    query: { enabled: !!listingId && listingId > BigInt(0) },
  })

  return { listingData }
}

// Hook for admin checks
export const useIsAdmin = () => {
  const { address } = useAccount()
  const { owner } = useHydrogenCreditReads()
  
  return {
    isAdmin: address && owner && typeof owner === 'string' && address.toLowerCase() === owner.toLowerCase(),
    isOwner: address && owner && typeof owner === 'string' && address.toLowerCase() === owner.toLowerCase(),
  }
}

// Hook for producer checks
export const useIsProducer = () => {
  const { address } = useAccount()
  const { producerInfo } = useUserData(address)
  
  return {
    isProducer: !!(producerInfo && typeof producerInfo === 'object' && 'isActive' in producerInfo && producerInfo.isActive),
    producerInfo,
  }
}
