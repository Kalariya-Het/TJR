import React, { useState } from 'react'
import { useAccount } from 'wagmi'
import {
    HomeIcon,
    BanknotesIcon,
    UserGroupIcon,
    ChartBarIcon,
    CogIcon,
    Bars3Icon,
    XMarkIcon,
    UserIcon,
    GlobeAltIcon,
    CloudArrowUpIcon,
    ClipboardDocumentCheckIcon,
    CreditCardIcon,
    BellIcon,
    UsersIcon,
    ShieldCheckIcon,
    DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface NavigationProps {
    currentPage: string
    onPageChange: (page: string) => void
    userRole: string | undefined
}

const NAVIGATION_ITEMS = [
    {
        id: 'dashboard',
        name: 'Dashboard',
        icon: HomeIcon,
        description: 'Overview of your credits and system status',
        color: 'from-primary-600 to-primary-700',
        roles: ['admin', 'producer', 'verifier', 'buyer']
    },
    {
        id: 'marketplace',
        name: 'Marketplace',
        icon: BanknotesIcon,
        description: 'Buy and sell hydrogen credits',
        color: 'from-green-600 to-green-700',
        roles: ['admin', 'producer', 'verifier', 'buyer']
    },
    {
        id: 'producers',
        name: 'Producers',
        icon: UserGroupIcon,
        description: 'View registered hydrogen producers',
        color: 'from-blue-600 to-blue-700',
        roles: ['admin', 'producer', 'verifier', 'buyer']
    },
    {
        id: 'submit-production',
        name: 'Submit Production',
        icon: CloudArrowUpIcon,
        description: 'Submit new hydrogen production data',
        color: 'from-yellow-600 to-yellow-700',
        roles: ['producer']
    },
    {
        id: 'review-submissions',
        name: 'Review Submissions',
        icon: ClipboardDocumentCheckIcon,
        description: 'Review and verify pending production data',
        color: 'from-teal-600 to-teal-700',
        roles: ['verifier', 'admin']
    },
    {
        id: 'my-credits',
        name: 'My Credits',
        icon: CreditCardIcon,
        description: 'View and manage your hydrogen credits',
        color: 'from-indigo-600 to-indigo-700',
        roles: ['producer', 'buyer']
    },
    {
        id: 'notifications',
        name: 'Notifications',
        icon: BellIcon,
        description: 'View system notifications and alerts',
        color: 'from-pink-600 to-pink-700',
        roles: ['admin', 'producer', 'verifier', 'buyer']
    },
    {
        id: 'analytics',
        name: 'Analytics',
        icon: ChartBarIcon,
        description: 'Market trends and environmental impact',
        color: 'from-purple-600 to-purple-700',
        roles: ['admin']
    },
    {
        id: 'producer-management',
        name: 'Producer Management',
        icon: CogIcon,
        description: 'Admin tools for managing producers',
        color: 'from-orange-600 to-orange-700',
        roles: ['admin']
    },
    {
        id: 'user-management',
        name: 'User Management',
        icon: UsersIcon,
        description: 'Manage all users in the system',
        color: 'from-gray-600 to-gray-700',
        roles: ['admin']
    },
    {
        id: 'kyc-management',
        name: 'KYC Management',
        icon: ShieldCheckIcon,
        description: 'Review and manage user KYC submissions',
        color: 'from-lime-600 to-lime-700',
        roles: ['admin']
    },
    {
        id: 'audit-logs',
        name: 'Audit Logs',
        icon: DocumentMagnifyingGlassIcon,
        description: 'View system audit trails and logs',
        color: 'from-cyan-600 to-cyan-700',
        roles: ['admin']
    }
]

export const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, userRole }) => {
    const { address } = useAccount()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handlePageChange = (page: string) => {
        onPageChange(page)
        setIsMobileMenuOpen(false)
    }

    const filteredNavigationItems = NAVIGATION_ITEMS.filter(item =>
        userRole && item.roles.includes(userRole)
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
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:hover:border-gray-300'
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
                                        {userRole === 'admin' && (
                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <UserIcon className="h-6 w-6 text-gray-400" />
                                </div>
                            ) : (
                                <button
                                    onClick={() => connect({ connector: connectors[0] })}
                                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                >
                                    Connect Wallet
                                </button>
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
