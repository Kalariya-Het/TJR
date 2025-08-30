import { Address } from 'viem'

// Smart Contract Types
export interface Producer {
  plantId: string
  location: string
  renewableSource: string
  totalProduced: bigint
  registrationTime: bigint
  isActive: boolean
}

export interface CreditBatch {
  batchId: bigint
  producer: Address
  amount: bigint
  plantId: string
  productionTime: bigint
  renewableSource: string
  isRetired: boolean
}

export interface Listing {
  id: bigint
  seller: Address
  amount: bigint
  pricePerUnit: bigint
  createdAt: bigint
  isActive: boolean
}

// UI State Types
export interface ProducerDisplayData extends Producer {
  address: Address
  totalProducedFormatted: string
  registrationDate: Date
}

export interface CreditBatchDisplayData extends CreditBatch {
  amountFormatted: string
  productionDate: Date
  batchIdNumber: number
}

export interface ListingDisplayData extends Listing {
  idNumber: number
  amountFormatted: string
  pricePerUnitFormatted: string
  totalPriceFormatted: string
  createdDate: Date
  sellerShort: string
}

// Contract Statistics
export interface ContractStats {
  totalSupply: bigint
  totalBatches: bigint
  totalRetired: bigint
  producerCount: bigint
}

export interface MarketplaceStats {
  totalListingsCreated: bigint
  activeListingsCount: bigint
  totalVolume: bigint
  feePercent: bigint
}

// Form Types
export interface RegisterProducerForm {
  address: string
  plantId: string
  location: string
  renewableSource: string
}

export interface IssueCreditForm {
  producer: string
  amount: string
  productionTime: string
}

export interface CreateListingForm {
  amount: string
  pricePerUnit: string
}

export interface RetireCreditForm {
  amount: string
  reason: string
}

// Network Configuration
export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  blockExplorer: string
  hydrogenCreditAddress: Address
  marketplaceAddress: Address
}

// Transaction Types
export interface TransactionStatus {
  hash?: string
  status: 'idle' | 'pending' | 'success' | 'error'
  error?: string
}

// Component Props Types
export interface CardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export interface StatCardProps {
  title: string
  value: string
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  className?: string
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose: () => void
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

// Pagination
export interface PaginationInfo {
  current: number
  total: number
  pageSize: number
}

// Filter Types
export interface ProducerFilter {
  isActive?: boolean
  renewableSource?: string
  location?: string
}

export interface ListingFilter {
  priceRange?: {
    min: bigint
    max: bigint
  }
  amountRange?: {
    min: bigint
    max: bigint
  }
  seller?: Address
}

// User Roles
export enum UserRole {
  ADMIN = 'admin',
  PRODUCER = 'producer',
  USER = 'user'
}

export interface UserInfo {
  address: Address
  role: UserRole
  isProducer: boolean
  isAdmin: boolean
}

// Theme Types
export interface ThemeConfig {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  error: string
  warning: string
  success: string
  info: string
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Constants
export const RENEWABLE_SOURCES = [
  'Solar',
  'Wind',
  'Hydro',
  'Geothermal',
  'Biomass',
  'Other'
] as const

export type RenewableSource = typeof RENEWABLE_SOURCES[number]

// Utility Types
export type ContractFunction = (...args: any[]) => Promise<any>
export type EventHandler<T = any> = (event: T) => void
export type AsyncHandler<T = any> = (event: T) => Promise<void>

// Form validation
export interface ValidationError {
  field: string
  message: string
}

export interface FormValidation {
  isValid: boolean
  errors: ValidationError[]
}
