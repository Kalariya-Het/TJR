import React from 'react'
import {
    ChartBarIcon,
    ArrowTrendingUpIcon,
    GlobeAltIcon,
    UserGroupIcon,
    BanknotesIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Card, SimpleCard } from './ui/Card'

export const Analytics: React.FC = () => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
                <p className="text-purple-100">
                    Market trends, environmental impact metrics, and producer performance analytics
                </p>
            </div>

            {/* Coming Soon Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                    <div>
                        <h3 className="text-lg font-medium text-yellow-800">Analytics Features Coming Soon</h3>
                        <p className="text-yellow-700 mt-1">
                            We're working hard to bring you comprehensive analytics and insights. This section will be available in the next phase.
                        </p>
                    </div>
                </div>
            </div>

            {/* Planned Features Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Market Analytics">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Price Trends</h4>
                                <p className="text-sm text-gray-600">Historical price analysis and market predictions</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <BanknotesIcon className="h-5 w-5 text-blue-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Trading Volume</h4>
                                <p className="text-sm text-gray-600">Market activity and liquidity metrics</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <ClockIcon className="h-5 w-5 text-purple-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Market Cycles</h4>
                                <p className="text-sm text-gray-600">Seasonal patterns and market timing</p>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card title="Environmental Impact">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <GlobeAltIcon className="h-5 w-5 text-green-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Carbon Reduction</h4>
                                <p className="text-sm text-gray-600">CO₂ equivalent savings tracking</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <UserGroupIcon className="h-5 w-5 text-blue-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Producer Impact</h4>
                                <p className="text-sm text-gray-600">Individual facility environmental metrics</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <ChartBarIcon className="h-5 w-5 text-purple-600" />
                            <div>
                                <h4 className="font-medium text-gray-900">Regional Analysis</h4>
                                <p className="text-sm text-gray-600">Geographic impact distribution</p>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Feature Roadmap */}
            <SimpleCard>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Development Roadmap</h2>
                <div className="space-y-6">
                    <div className="border-l-4 border-green-500 pl-4">
                        <h3 className="font-medium text-gray-900">Phase 1 - Core Features ✅</h3>
                        <p className="text-sm text-gray-600 mt-1">Marketplace, producer management, and basic navigation</p>
                        <div className="mt-2 text-xs text-green-600">Completed</div>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-4">
                        <h3 className="font-medium text-gray-900">Phase 2 - Analytics & Insights 🚧</h3>
                        <p className="text-sm text-gray-600 mt-1">Market trends, environmental metrics, and performance analytics</p>
                        <div className="mt-2 text-xs text-blue-600">In Development</div>
                    </div>

                    <div className="border-l-4 border-gray-300 pl-4">
                        <h3 className="font-medium text-gray-400">Phase 3 - Advanced Features 📋</h3>
                        <p className="text-sm text-gray-500 mt-1">Predictive analytics, AI insights, and advanced reporting</p>
                        <div className="mt-2 text-xs text-gray-500">Planned</div>
                    </div>

                    <div className="border-l-4 border-gray-300 pl-4">
                        <h3 className="font-medium text-gray-400">Phase 4 - Enterprise Tools 📋</h3>
                        <p className="text-sm text-gray-500 mt-1">Multi-tenant support, API integrations, and compliance tools</p>
                        <div className="mt-2 text-xs text-gray-500">Planned</div>
                    </div>
                </div>
            </SimpleCard>

            {/* Sample Data Preview */}
            <SimpleCard>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sample Analytics Preview</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <div className="text-3xl font-bold text-green-600 mb-2">2,847</div>
                        <p className="text-green-800 font-medium">Total Credits Traded</p>
                        <p className="text-green-600 text-sm mt-1">This month</p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600 mb-2">156.2</div>
                        <p className="text-blue-800 font-medium">kg CO₂ Saved</p>
                        <p className="text-blue-600 text-sm mt-1">Environmental impact</p>
                    </div>

                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600 mb-2">€0.023</div>
                        <p className="text-purple-800 font-medium">Average Price</p>
                        <p className="text-purple-600 text-sm mt-1">Per credit unit</p>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 text-center">
                        <strong>Note:</strong> These are sample values for demonstration purposes.
                        Real analytics will be available once the feature is fully implemented.
                    </p>
                </div>
            </SimpleCard>

            {/* Feedback Section */}
            <SimpleCard>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Help Us Improve</h2>
                <p className="text-gray-600 mb-4">
                    We're actively developing the analytics features. What insights would be most valuable to you?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Market Insights</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Price trend analysis</li>
                            <li>• Volume patterns</li>
                            <li>• Market sentiment</li>
                            <li>• Trading opportunities</li>
                        </ul>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Environmental Metrics</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                            <li>• Carbon reduction tracking</li>
                            <li>• Sustainability impact</li>
                            <li>• Regional comparisons</li>
                            <li>• Progress reporting</li>
                        </ul>
                    </div>
                </div>
            </SimpleCard>
        </div>
    )
}
