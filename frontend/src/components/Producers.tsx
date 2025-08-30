import React, { useState, useEffect } from 'react'
import { useReadContract } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { Address, formatEther, parseEther } from 'viem'
import {
    UserGroupIcon,
    MapPinIcon,
    SunIcon,
    CloudIcon,
    BoltIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    BanknotesIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    XMarkIcon
} from '@heroicons/react/24/outline'
import { Card, SimpleCard } from './ui/Card'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { getContractAddresses } from '../config/contracts'
import { HYDROGEN_CREDIT_ABI } from '../config/contracts'
import { useChainId } from 'wagmi'

interface Producer {
    plantId: string
    location: string
    renewableSource: string
    capacity: bigint
    totalProduced: bigint
    registrationTime: bigint
    isActive: boolean
    kycVerified: boolean
    monthlyLimit: bigint
}

interface ProducerWithAddress {
    address: Address
    producer: Producer
}

const RENEWABLE_SOURCES = [
    { value: 'Solar', label: 'Solar', icon: SunIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'Wind', label: 'Wind', icon: CloudIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { value: 'Hydro', label: 'Hydroelectric', icon: BoltIcon, color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'Geothermal', label: 'Geothermal', icon: BoltIcon, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'Biomass', label: 'Biomass', icon: BoltIcon, color: 'text-red-600', bgColor: 'bg-red-50' },
]

const getSourceIcon = (source: string) => {
    const sourceConfig = RENEWABLE_SOURCES.find(s => s.value === source)
    if (sourceConfig) {
        const IconComponent = sourceConfig.icon
        return <IconComponent className={`h-5 w-5 ${sourceConfig.color}`} />
    }
    return <BoltIcon className="h-5 w-5 text-gray-600" />
}

const getSourceConfig = (source: string) => {
    return RENEWABLE_SOURCES.find(s => s.value === source) || RENEWABLE_SOURCES[0]
}

export const Producers: React.FC = () => {
    const chainId = useChainId()
    const contractAddresses = getContractAddresses(chainId)

    // State
    const [producers, setProducers] = useState<ProducerWithAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterSource, setFilterSource] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
    const [sortBy, setSortBy] = useState<'name' | 'location' | 'production' | 'date'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [selectedProducer, setSelectedProducer] = useState<ProducerWithAddress | null>(null)

    // Contract reads
    const { data: contractStats } = useReadContract({
        address: contractAddresses.hydrogenCredit,
        abi: HYDROGEN_CREDIT_ABI,
        functionName: 'getContractStats',
    }) as { data: [bigint, bigint, bigint, bigint] | undefined }

    const { data: allProducers } = useReadContract({
        address: contractAddresses.hydrogenCredit,
        abi: HYDROGEN_CREDIT_ABI,
        functionName: 'getAllProducers',
    }) as { data: Address[] | undefined }

    // Load producers
    useEffect(() => {
        if (allProducers) {
            loadProducers()
        }
    }, [allProducers])

    // Filter and sort producers
    useEffect(() => {
        if (allProducers) {
            loadProducers()
        }
    }, [searchTerm, filterSource, filterStatus, sortBy, sortOrder])

    // Function to read producer data from contract
    const readProducerData = async (producerAddress: Address): Promise<Producer | null> => {
        try {
            // For now, return sample data since we need to implement proper contract reading
            // In a real implementation, this would read from the ProductionOracle contract
            const sampleProducers: Producer[] = [
                {
                    plantId: "GH-PLANT-001",
                    location: "Gujarat, India",
                    renewableSource: "Solar",
                    capacity: parseEther("1000"),
                    isActive: true,
                    kycVerified: true,
                    registrationTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 30),
                    totalProduced: parseEther("2500"),
                    monthlyLimit: parseEther("500")
                },
                {
                    plantId: "GH-PLANT-002", 
                    location: "Rajasthan, India",
                    renewableSource: "Wind",
                    capacity: parseEther("800"),
                    isActive: true,
                    kycVerified: true,
                    registrationTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 45),
                    totalProduced: parseEther("1800"),
                    monthlyLimit: parseEther("400")
                },
                {
                    plantId: "GH-PLANT-003",
                    location: "Tamil Nadu, India", 
                    renewableSource: "Hydro",
                    capacity: parseEther("600"),
                    isActive: false,
                    kycVerified: true,
                    registrationTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 60),
                    totalProduced: parseEther("1200"),
                    monthlyLimit: parseEther("300")
                },
                {
                    plantId: "GH-PLANT-004",
                    location: "Karnataka, India",
                    renewableSource: "Solar",
                    capacity: parseEther("1200"),
                    isActive: true,
                    kycVerified: false,
                    registrationTime: BigInt(Math.floor(Date.now() / 1000) - 86400 * 15),
                    totalProduced: parseEther("800"),
                    monthlyLimit: parseEther("600")
                }
            ]

            // Return a producer based on the address (simple mapping for demo)
            const index = parseInt(producerAddress.slice(-1), 16) % sampleProducers.length
            return sampleProducers[index]
        } catch (error) {
            console.error('Error reading producer data:', error)
            return null
        }
    }

    const loadProducers = async () => {
        if (!allProducers) {
            // If no producers from contract, use sample addresses for demo
            const sampleAddresses: Address[] = [
                '0x1234567890123456789012345678901234567890',
                '0x2345678901234567890123456789012345678901', 
                '0x3456789012345678901234567890123456789012',
                '0x4567890123456789012345678901234567890123'
            ]
            
            try {
                setLoading(true)
                const producersData: ProducerWithAddress[] = []

                for (const producerAddress of sampleAddresses) {
                    try {
                        const producerData = await readProducerData(producerAddress)
                        if (producerData) {
                            producersData.push({
                                address: producerAddress,
                                producer: producerData
                            })
                        }
                    } catch (error) {
                        console.error(`Error loading producer ${producerAddress}:`, error)
                    }
                }

                // Apply filters and sorting logic here...
                let filtered = producersData

                if (searchTerm) {
                    filtered = filtered.filter(p =>
                        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.producer.plantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.producer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.producer.renewableSource.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                }

                if (filterSource !== 'all') {
                    filtered = filtered.filter(p => p.producer.renewableSource === filterSource)
                }

                if (filterStatus !== 'all') {
                    filtered = filtered.filter(p =>
                        filterStatus === 'active' ? p.producer.isActive : !p.producer.isActive
                    )
                }

                // Sort producers
                filtered.sort((a, b) => {
                    let comparison = 0
                    switch (sortBy) {
                        case 'name':
                            comparison = a.producer.plantId.localeCompare(b.producer.plantId)
                            break
                        case 'location':
                            comparison = a.producer.location.localeCompare(b.producer.location)
                            break
                        case 'production':
                            comparison = Number(a.producer.totalProduced) - Number(b.producer.totalProduced)
                            break
                        case 'date':
                            comparison = Number(a.producer.registrationTime) - Number(b.producer.registrationTime)
                            break
                    }
                    return sortOrder === 'asc' ? comparison : -comparison
                })

                setProducers(filtered)
            } catch (error) {
                console.error('Error loading producers:', error)
            } finally {
                setLoading(false)
            }
            return
        }

        try {
            setLoading(true)
            const producersData: ProducerWithAddress[] = []

            for (const producerAddress of allProducers) {
                try {
                    const producerData = await readProducerData(producerAddress)
                    if (producerData) {
                        producersData.push({
                            address: producerAddress,
                            producer: producerData
                        })
                    }
                } catch (error) {
                    console.error(`Error loading producer ${producerAddress}:`, error)
                }
            }

            // Apply filters
            let filtered = producersData

            if (searchTerm) {
                filtered = filtered.filter(p =>
                    p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.producer.plantId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.producer.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.producer.renewableSource.toLowerCase().includes(searchTerm.toLowerCase())
                )
            }

            if (filterSource !== 'all') {
                filtered = filtered.filter(p => p.producer.renewableSource === filterSource)
            }

            if (filterStatus !== 'all') {
                filtered = filtered.filter(p =>
                    filterStatus === 'active' ? p.producer.isActive : !p.producer.isActive
                )
            }

            // Sort producers
            filtered.sort((a, b) => {
                let comparison = 0
                switch (sortBy) {
                    case 'name':
                        comparison = a.producer.plantId.localeCompare(b.producer.plantId)
                        break
                    case 'location':
                        comparison = a.producer.location.localeCompare(b.producer.location)
                        break
                    case 'production':
                        comparison = Number(a.producer.totalProduced - b.producer.totalProduced)
                        break
                    case 'date':
                        comparison = Number(a.producer.registrationTime - b.producer.registrationTime)
                        break
                }
                return sortOrder === 'asc' ? comparison : -comparison
            })

            setProducers(filtered)
        } catch (error) {
            console.error('Error loading producers:', error)
        } finally {
            setLoading(false)
        }
    }




    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <UserGroupIcon className="h-8 w-8 text-blue-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Producers</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractStats?.[3]?.toString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <BanknotesIcon className="h-8 w-8 text-green-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Production</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractStats?.[0] ? `${Number(formatEther(contractStats[0])).toFixed(0)} GHC` : '0 GHC'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <CheckCircleIcon className="h-8 w-8 text-purple-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Producers</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {producers.filter(p => p.producer.isActive).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search producers by name, location, or source..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Source Filter */}
                    <div className="flex gap-2">
                        <select
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Sources</option>
                            {RENEWABLE_SOURCES.map(source => (
                                <option key={source.value} value={source.value}>{source.label}</option>
                            ))}
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active Only</option>
                            <option value="inactive">Inactive Only</option>
                        </select>
                    </div>

                    {/* Sort */}
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'name' | 'location' | 'production' | 'date')}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="name">Sort by Name</option>
                            <option value="location">Sort by Location</option>
                            <option value="production">Sort by Production</option>
                            <option value="date">Sort by Date</option>
                        </select>

                        <button
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {sortOrder === 'asc' ? '↑' : '↓'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Producers Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {producers.map((producerData) => (
                    <ProducerCard
                        key={producerData.address}
                        producerData={producerData}
                        onSelect={() => setSelectedProducer(producerData)}
                        isSelected={selectedProducer?.address === producerData.address}
                    />
                ))}
            </div>

            {/* Empty State */}
            {producers.length === 0 && (
                <div className="text-center py-12">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No producers found</h3>
                    <p className="text-gray-500">
                        {searchTerm || filterSource !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'No producers have been registered yet.'}
                    </p>
                </div>
            )}

            {/* Selected Producer Details */}
            {selectedProducer && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {selectedProducer.producer.plantId}
                                </h3>
                                <button
                                    onClick={() => setSelectedProducer(null)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Plant ID</p>
                                        <p className="font-medium text-gray-900">{selectedProducer.producer.plantId}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedProducer.producer.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {selectedProducer.producer.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="font-medium text-gray-900">{selectedProducer.producer.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Renewable Source</p>
                                        <div className="flex items-center gap-2">
                                            {getSourceIcon(selectedProducer.producer.renewableSource)}
                                            <span className="font-medium text-gray-900">{selectedProducer.producer.renewableSource}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Produced</p>
                                        <p className="font-medium text-gray-900">
                                            {Number(formatEther(selectedProducer.producer.totalProduced)).toFixed(2)} GHC
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Registration Date</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(Number(selectedProducer.producer.registrationTime) * 1000).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-mono text-sm text-gray-900 break-all">
                                        {selectedProducer.address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Producer Card Component
interface ProducerCardProps {
    producerData: ProducerWithAddress
    onSelect: () => void
    isSelected: boolean
}

const ProducerCard: React.FC<ProducerCardProps> = ({
    producerData,
    onSelect,
    isSelected
}) => {
    const { address, producer } = producerData

    const formattedTotalProduced = Number(formatEther(producer.totalProduced))
    const registrationDate = new Date(Number(producer.registrationTime) * 1000)
    const sourceConfig = getSourceConfig(producer.renewableSource)

    return (
        <Card title={producer.plantId}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${sourceConfig.bgColor}`}>
                            {getSourceIcon(producer.renewableSource)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{producer.plantId}</h3>
                            <p className="text-sm text-gray-600">{producer.location}</p>
                        </div>
                    </div>

                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${producer.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {producer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Produced</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {formattedTotalProduced.toFixed(2)} GHC
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="text-sm font-medium text-gray-900">{producer.renewableSource}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Registered</p>
                        <p className="text-sm text-gray-900">
                            {registrationDate.toLocaleDateString()}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">
                            {address.slice(0, 6)}...{address.slice(-4)}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                    <button
                        onClick={onSelect}
                        className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        View Details
                    </button>
                </div>
            </div>
        </Card>
    )
}
