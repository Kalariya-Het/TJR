import { Address, formatEther, parseEther, formatUnits, parseUnits } from 'viem'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { TOKEN_DECIMALS } from '../config/contracts'

// Tailwind CSS class merging utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format Wei to readable token amount
export const formatTokenAmount = (
  amount: bigint,
  decimals: number = TOKEN_DECIMALS,
  displayDecimals: number = 2
): string => {
  const formatted = formatUnits(amount, decimals)
  const number = parseFloat(formatted)
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  })
}

// Parse token amount to Wei
export const parseTokenAmount = (amount: string, decimals: number = TOKEN_DECIMALS): bigint => {
  try {
    return parseUnits(amount, decimals)
  } catch (error) {
    throw new Error('Invalid amount format')
  }
}

// Format ETH/MATIC amounts
export const formatEthAmount = (amount: bigint, displayDecimals: number = 4): string => {
  const formatted = formatEther(amount)
  const number = parseFloat(formatted)
  return number.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  })
}

// Parse ETH/MATIC amounts
export const parseEthAmount = (amount: string): bigint => {
  try {
    return parseEther(amount)
  } catch (error) {
    throw new Error('Invalid ETH amount format')
  }
}

// Format address for display
export const formatAddress = (address: Address, length: number = 8): string => {
  if (!address) return ''
  return `${address.slice(0, length)}...${address.slice(-4)}`
}

// Format timestamp to readable date
export const formatDate = (timestamp: bigint | number): string => {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format date for form inputs
export const formatDateForInput = (timestamp: bigint | number): string => {
  const date = new Date(Number(timestamp) * 1000)
  return date.toISOString().slice(0, 16) // YYYY-MM-DDTHH:MM
}

// Get current timestamp in seconds
export const getCurrentTimestamp = (): number => {
  return Math.floor(Date.now() / 1000)
}

// Calculate percentage change
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// Format percentage
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

// Validate Ethereum address
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

// Validate positive number
export const isValidAmount = (amount: string): boolean => {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0
}

// Validate required field
export const isRequired = (value: string): boolean => {
  return value.trim().length > 0
}

// Format large numbers with suffixes
export const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

// Generate placeholder data for development
export const generateMockData = {
  producer: (): any => ({
    address: '0x742d35Cc6e1F3E1B4e4c45D43f0B4F6a7A8e4F1C' as Address,
    plantId: `PLANT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    location: 'Hamburg, Germany',
    renewableSource: 'Solar',
    totalProduced: parseEther(Math.random() * 10000 + ''),
    registrationTime: BigInt(getCurrentTimestamp() - Math.random() * 86400 * 30),
    isActive: Math.random() > 0.2,
  }),
  
  listing: (): any => ({
    id: BigInt(Math.floor(Math.random() * 1000) + 1),
    seller: '0x742d35Cc6e1F3E1B4e4c45D43f0B4F6a7A8e4F1C' as Address,
    amount: parseEther(Math.random() * 1000 + ''),
    pricePerUnit: parseEther((Math.random() * 0.01).toString()),
    createdAt: BigInt(getCurrentTimestamp() - Math.random() * 86400 * 7),
    isActive: Math.random() > 0.3,
  }),
  
  creditBatch: (): any => ({
    batchId: BigInt(Math.floor(Math.random() * 1000) + 1),
    producer: '0x742d35Cc6e1F3E1B4e4c45D43f0B4F6a7A8e4F1C' as Address,
    amount: parseEther(Math.random() * 500 + ''),
    plantId: `PLANT-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    productionTime: BigInt(getCurrentTimestamp() - Math.random() * 86400 * 7),
    renewableSource: ['Solar', 'Wind', 'Hydro', 'Geothermal'][Math.floor(Math.random() * 4)],
    isRetired: Math.random() > 0.7,
  }),
}

// Copy to clipboard utility
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch (err) {
      document.body.removeChild(textArea)
      return false
    }
  }
}

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Error message extraction
export const extractErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error
  if (error?.message) return error.message
  if (error?.reason) return error.reason
  if (error?.data?.message) return error.data.message
  return 'An unknown error occurred'
}

// Safe JSON parsing
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

// Local storage utilities
export const storage = {
  get: <T>(key: string, fallback: T): T => {
    try {
      const item = localStorage.getItem(key)
      return item ? safeJsonParse(item, fallback) : fallback
    } catch {
      return fallback
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
    }
  },
}

// Environment utilities
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development'
}

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production'
}

// Wait utility
export const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
