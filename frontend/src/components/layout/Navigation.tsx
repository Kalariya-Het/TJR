import React, { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { Address } from 'viem'
import {
    HomeIcon,
    BanknotesIcon,
    UserGroupIcon,
    ChartBarIcon,
    CogIcon,
    Bars3Icon,
    XMarkIcon,
    UserIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline'
import { getContractAddresses } from '../../config/contracts'
import { HYDROGEN_CREDIT_ABI } from '../../config/contracts'
import { useChainId } from 'wagmi'

interface NavigationProps {
    currentPage: string
    onPageChange: (page: string) => void
}

const NAVIGATION_ITEMS = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: HomeIcon,
        description: 'Overview of your credits and system status',
        color: 'from-primary-600 to-primary-700'
    },
    {
        id: 'marketplace',
        name: 'Marketplace',
        icon: BanknotesIcon,
        description: 'Buy and sell hydrogen credits',
        color: 'from-green-600 to-green-700'
    },
    {
        id: 'producers',
        name: 'Producers',
        icon: UserGroupIcon,
        description: 'View registered hydrogen producers',
        color: 'from-blue-600 to-blue-700'
    },
    {
        id: 'analytics',
        name: 'Analytics',
        icon: ChartBarIcon,
        description: 'Market trends and environmental impact',
        color: 'from-purple-600 to-purple-700'
    },
    {
        id: 'producer-management',
        name: 'Producer Management',
        icon: CogIcon,
        description: 'Admin tools for managing producers',
        color: 'from-orange-600 to-orange-700',
        adminOnly: true
    }
]

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange }) => {
    const { address } = useAccount()
    const chainId = useChainId()
    const contractAddresses = getContractAddresses(chainId)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Check if user is admin
    const { data: owner } = useReadContract({
        address: contractAddresses.hydrogenCredit,
        abi: HYDROGEN_CREDIT_ABI,
        functionName: 'owner',
    }) as { data: Address | undefined }

    const isAdmin = address && owner && address.toLowerCase() === owner.toLowerCase()

    const handlePageChange = (page: string) => {
        onPageChange(page)
        setIsMobileMenuOpen(false)
    }

    const filteredNavigationItems = NAVIGATION_ITEMS.filter(item =>
        !item.adminOnly || isAdmin
    )

    return (
        <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Brand */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <GlobeAltIcon className="h-8 w-8 text-primary-600" />
                                <span className="ml-2 text-xl font-bold text-gray-900">
                                    Green Hydrogen Credits
                                </span>
                            </div>
                        </div>

                        {/* Navigation Items */}
                        <div className="flex space-x-8">
                            {filteredNavigationItems.map((item) => {
                                const IconComponent = item.icon
                                const isActive = currentPage === item.id

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handlePageChange(item.id)}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${isActive
                                            ? 'border-primary-500 text-primary-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <IconComponent className="h-5 w-5 mr-2" />
                                        {item.name}
                                    </button>
                                )
                            })}
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center">
                            {address ? (
                                <div className="flex items-center space-x-3">
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">
                                            {address.slice(0, 6)}...{address.slice(-4)}
                                        </span>
                                        {isAdmin && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                            ) : (
                                <div className="text-sm text-gray-500">
                                    Connect Wallet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Navigation */}
            <nav className="lg:hidden bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo and Brand */}
                        <div className="flex items-center">
                            <div className="flex-shrink-0 flex items-center">
                                <GlobeAltIcon className="h-8 w-8 text-primary-600" />
                                <span className="ml-2 text-lg font-bold text-gray-900">
                                    GHC
                                </span>
                            </div>
                        </div>

                        {/* Mobile menu button */}
                        <div className="flex items-center">
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                            >
                                {isMobileMenuOpen ? (
                                    <XMarkIcon className="h-6 w-6" />
                                ) : (
                                    <Bars3Icon className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden">
                        <div className="pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                            {filteredNavigationItems.map((item) => {
                                const IconComponent = item.icon
                                const isActive = currentPage === item.id

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handlePageChange(item.id)}
                                        className={`w-full text-left px-4 py-3 text-base font-medium transition-colors duration-200 ${isActive
                                            ? 'bg-primary-50 border-r-2 border-primary-500 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <IconComponent className="h-5 w-5 mr-3" />
                                            {item.name}
                                            {item.adminOnly && (
                                                <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>

                        {/* User info in mobile menu */}
                        <div className="pt-4 pb-3 border-t border-gray-200">
                            {address ? (
                                <div className="px-4 py-3">
                                    <div className="text-sm text-gray-700">
                                        <span className="font-medium">
                                            {address.slice(0, 6)}...{address.slice(-4)}
                                        </span>
                                        {isAdmin && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                    Connect Wallet
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Page Header */}
            <div className="bg-gray-50 border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            {(() => {
                                const currentItem = filteredNavigationItems.find(item => item.id === currentPage)
                                if (currentItem) {
                                    const IconComponent = currentItem.icon
                                    return (
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-lg bg-gradient-to-r ${currentItem.color}`}>
                                                <IconComponent className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="ml-3">
                                                <h1 className="text-2xl font-bold text-gray-900">
                                                    {currentItem.name}
                                                </h1>
                                                <p className="text-sm text-gray-600">
                                                    {currentItem.description}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                }
                                return null
                            })()}
                        </div>

                        {/* Breadcrumb */}
                        <nav className="flex" aria-label="Breadcrumb">
                            <ol className="flex items-center space-x-4">
                                <li>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() => handlePageChange('dashboard')}
                                            className="text-sm font-medium text-gray-500 hover:text-gray-700"
                                        >
                                            Dashboard
                                        </button>
                                    </div>
                                </li>
                                {currentPage !== 'dashboard' && (
                                    <>
                                        <li>
                                            <div className="flex items-center">
                                                <svg className="flex-shrink-0 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="ml-4 text-sm font-medium text-gray-900">
                                                    {filteredNavigationItems.find(item => item.id === currentPage)?.name}
                                                </span>
                                            </div>
                                        </li>
                                    </>
                                )}
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    )
}
