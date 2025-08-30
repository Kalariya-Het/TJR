import React from 'react'
import { useAccount } from 'wagmi'
import { 
  BanknotesIcon, 
  CurrencyDollarIcon, 
  GlobeAltIcon, 
  UserGroupIcon 
} from '@heroicons/react/24/outline'
import { StatCard } from './ui/StatCard'
import { Card, SimpleCard } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { useHydrogenCreditReads, useUserData, useMarketplaceData } from '../hooks/useContracts'
import { formatTokenAmount } from '../utils'

export const Dashboard: React.FC = () => {
  const { address } = useAccount()
  const { tokenInfo, contractStats } = useHydrogenCreditReads()
  const { balance, producerInfo, retiredCredits } = useUserData()
  const { marketplaceStats } = useMarketplaceData()

  if (!address) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome to your Dashboard</h1>
        <p className="text-primary-100">
          Track your green hydrogen credits, monitor the marketplace, and contribute to sustainable energy.
        </p>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="My Credits"
          value={balance ? formatTokenAmount(balance as bigint) : '0'}
          icon={<BanknotesIcon className="h-6 w-6 text-primary-600" />}
        />
        <StatCard
          title="Retired Credits"
          value={retiredCredits ? formatTokenAmount(retiredCredits as bigint) : '0'}
          icon={<GlobeAltIcon className="h-6 w-6 text-green-600" />}
        />
        <StatCard
          title="Producer Status"
          value={(producerInfo && typeof producerInfo === 'object' && 'isActive' in producerInfo && producerInfo.isActive) ? 'Active' : 'Not Registered'}
          icon={<UserGroupIcon className="h-6 w-6 text-blue-600" />}
        />
        <StatCard
          title="Total Produced"
          value={(producerInfo && typeof producerInfo === 'object' && 'totalProduced' in producerInfo && producerInfo.totalProduced) ? formatTokenAmount(producerInfo.totalProduced as bigint) : '0'}
          icon={<CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />}
        />
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="System Statistics">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Supply:</span>
              <span className="font-semibold">
                {`${(contractStats && Array.isArray(contractStats)) ? formatTokenAmount(contractStats[0] as bigint) : '0'} ${tokenInfo.symbol || 'HGC'}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Batches:</span>
              <span className="font-semibold">
                {(contractStats && Array.isArray(contractStats)) ? contractStats[1].toString() : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Retired:</span>
              <span className="font-semibold">
                {(contractStats && Array.isArray(contractStats)) ? formatTokenAmount(contractStats[2] as bigint) : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Registered Producers:</span>
              <span className="font-semibold">
                {(contractStats && Array.isArray(contractStats)) ? contractStats[3].toString() : '0'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Marketplace Overview">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Listings:</span>
              <span className="font-semibold">
                {(marketplaceStats && Array.isArray(marketplaceStats)) ? marketplaceStats[0].toString() : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Listings:</span>
              <span className="font-semibold">
                {(marketplaceStats && Array.isArray(marketplaceStats)) ? marketplaceStats[1].toString() : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Volume:</span>
              <span className="font-semibold">
                {(marketplaceStats && Array.isArray(marketplaceStats)) ? formatTokenAmount(marketplaceStats[2] as bigint) : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Fee:</span>
              <span className="font-semibold">
                {(marketplaceStats && Array.isArray(marketplaceStats)) ? `${(Number(marketplaceStats[3]) / 100).toFixed(1)}%` : '2.5%'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <SimpleCard>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/marketplace"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Browse Marketplace</h3>
            <p className="text-sm text-gray-600 mt-1">Find and purchase credits</p>
          </a>
          <a
            href="/producers"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">View Producers</h3>
            <p className="text-sm text-gray-600 mt-1">Explore registered producers</p>
          </a>
          <a
            href="/analytics"
            className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Analytics</h3>
            <p className="text-sm text-gray-600 mt-1">View detailed statistics</p>
          </a>
          {!!(producerInfo && typeof producerInfo === 'object' && 'isActive' in producerInfo && producerInfo.isActive) && (
            <a
              href="/producer"
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <h3 className="font-medium text-gray-900">My Production</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your credits</p>
            </a>
          )}
        </div>
      </SimpleCard>

      {/* Environmental Impact */}
      <SimpleCard>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Environmental Impact</h2>
          <p className="text-gray-600 mb-4">
            Your green hydrogen credits contribute to reducing carbon emissions and promoting sustainable energy.
          </p>
          <div className="bg-green-50 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-semibold">
              🌱 Credits Retired: {retiredCredits ? formatTokenAmount(retiredCredits as bigint) : '0'} kg H₂
            </p>
            <p className="text-green-600 text-sm mt-1">
              Equivalent to ~{retiredCredits ? Math.round(Number(formatTokenAmount(retiredCredits as bigint)) * 0.02) : 0} kg CO₂ saved
            </p>
          </div>
        </div>
      </SimpleCard>
    </div>
  )
}
