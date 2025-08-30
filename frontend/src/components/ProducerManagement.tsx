import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { Address, formatEther, parseEther } from 'viem'
import {
    PlusIcon,
    UserPlusIcon,
    BanknotesIcon,
    MapPinIcon,
    SunIcon,
    CloudIcon,
    BoltIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Card, SimpleCard } from './ui/Card'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'
import { Notification } from './ui/Notification'
import { getContractAddresses } from '../config/contracts'
import { HYDROGEN_CREDIT_ABI } from '../config/contracts'
import { useChainId } from 'wagmi'

interface Producer {
    plantId: string
    location: string
    renewableSource: string
    totalProduced: bigint
    registrationTime: bigint
    isActive: boolean
}

interface ProducerWithAddress {
    address: Address
    producer: Producer
}

interface RegisterProducerForm {
    producerAddress: string
    plantId: string
    location: string
    renewableSource: string
}

interface IssueCreditsForm {
    producerAddress: string
    amount: string
    productionTime: string
}

const RENEWABLE_SOURCES = [
    { value: 'Solar', label: 'Solar', icon: SunIcon, color: 'text-yellow-600' },
    { value: 'Wind', label: 'Wind', icon: CloudIcon, color: 'text-blue-600' },
    { value: 'Hydro', label: 'Hydroelectric', icon: BoltIcon, color: 'text-green-600' },
    { value: 'Geothermal', label: 'Geothermal', icon: BoltIcon, color: 'text-orange-600' },
    { value: 'Biomass', label: 'Biomass', icon: BoltIcon, color: 'text-red-600' },
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

export const ProducerManagement: React.FC = () => {
    const { address } = useAccount()
    const chainId = useChainId()
    const contractAddresses = getContractAddresses(chainId)

    // State
    const [producers, setProducers] = useState<ProducerWithAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [showRegisterForm, setShowRegisterForm] = useState(false)
    const [showIssueForm, setShowIssueForm] = useState(false)
    const [registerForm, setRegisterForm] = useState<RegisterProducerForm>({
        producerAddress: '',
        plantId: '',
        location: '',
        renewableSource: 'Solar'
    })
    const [issueForm, setIssueForm] = useState<IssueCreditsForm>({
        producerAddress: '',
        amount: '',
        productionTime: ''
    })
    const [selectedProducer, setSelectedProducer] = useState<Address | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterSource, setFilterSource] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

    // Contract reads
    const { data: owner } = useReadContract({
        address: contractAddresses.hydrogenCredit,
        abi: HYDROGEN_CREDIT_ABI,
        functionName: 'owner',
    }) as { data: Address | undefined }

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

    // Contract writes
    const { writeContract, data: writeData, isPending: isWriting } = useWriteContract()
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: writeData,
    })

    // Check if user is admin
    const isAdmin = address && owner && address.toLowerCase() === owner.toLowerCase()

    // Load producers
    useEffect(() => {
        if (allProducers) {
            loadProducers()
        }
    }, [allProducers])

    // Filter producers
    useEffect(() => {
        if (allProducers) {
            loadProducers()
        }
    }, [searchTerm, filterSource, filterStatus])

    const loadProducers = async () => {
        if (!allProducers) return

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
                    p.producer.location.toLowerCase().includes(searchTerm.toLowerCase())
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

            setProducers(filtered)
        } catch (error) {
            console.error('Error loading producers:', error)
        } finally {
            setLoading(false)
        }
    }

    const readProducerData = async (producerAddress: Address): Promise<Producer | null> => {
        try {
            // For now, return null as we'll need to implement this differently
            // The readContract function signature has changed in Wagmi v2
            console.warn('readProducerData needs to be implemented with proper Wagmi v2 approach')
            return null
        } catch (error) {
            console.error(`Error reading producer data for ${producerAddress}:`, error)
            return null
        }
    }

    const handleRegisterProducer = async () => {
        if (!registerForm.producerAddress || !registerForm.plantId || !registerForm.location || !registerForm.renewableSource) {
            return
        }

        try {
            await writeContract({
                address: contractAddresses.hydrogenCredit,
                abi: HYDROGEN_CREDIT_ABI,
                functionName: 'registerProducer',
                args: [
                    registerForm.producerAddress as Address,
                    registerForm.plantId,
                    registerForm.location,
                    registerForm.renewableSource
                ],
            }, {})

            setRegisterForm({
                producerAddress: '',
                plantId: '',
                location: '',
                renewableSource: 'Solar'
            })
            setShowRegisterForm(false)
            await loadProducers()
        } catch (error) {
            console.error('Error registering producer:', error)
        }
    }

    const handleIssueCredits = async () => {
        if (!issueForm.producerAddress || !issueForm.amount || !issueForm.productionTime) {
            return
        }

        try {
            const amount = parseEther(issueForm.amount)
            const productionTime = Math.floor(new Date(issueForm.productionTime).getTime() / 1000)

            await writeContract({
                address: contractAddresses.hydrogenCredit,
                abi: HYDROGEN_CREDIT_ABI,
                functionName: 'issueCredits',
                args: [
                    issueForm.producerAddress as Address,
                    amount,
                    BigInt(productionTime)
                ],
            }, {})

            setIssueForm({
                producerAddress: '',
                amount: '',
                productionTime: ''
            })
            setShowIssueForm(false)
            await loadProducers()
        } catch (error) {
            console.error('Error issuing credits:', error)
        }
    }

    const handleToggleProducerStatus = async (producerAddress: Address, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                await writeContract({
                    address: contractAddresses.hydrogenCredit,
                    abi: HYDROGEN_CREDIT_ABI,
                    functionName: 'deactivateProducer',
                    args: [producerAddress],
                }, {})
            } else {
                await writeContract({
                    address: contractAddresses.hydrogenCredit,
                    abi: HYDROGEN_CREDIT_ABI,
                    functionName: 'reactivateProducer',
                    args: [producerAddress],
                }, {})
            }

            await loadProducers()
        } catch (error) {
            console.error('Error toggling producer status:', error)
        }
    }



    if (!isAdmin) {
        return (
            <div className="text-center py-12">
                <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-500">
                    You need to be the contract owner to access producer management.
                </p>
            </div>
        )
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
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
                <h1 className="text-3xl font-bold mb-2">Producer Management</h1>
                <p className="text-blue-100">
                    Register and manage hydrogen producers, issue credits, and monitor production
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <UserPlusIcon className="h-8 w-8 text-blue-600" />
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
                            <p className="text-sm font-medium text-gray-600">Total Supply</p>
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
                            <p className="text-sm font-medium text-gray-600">Total Batches</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractStats?.[1]?.toString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center">
                        <XCircleIcon className="h-8 w-8 text-orange-600" />
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Retired Credits</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {contractStats?.[2] ? `${Number(formatEther(contractStats[2])).toFixed(0)} GHC` : '0 GHC'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search producers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filters */}
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        onClick={() => setShowRegisterForm(true)}
                        className="flex items-center gap-2"
                    >
                        <UserPlusIcon className="h-5 w-5" />
                        Register Producer
                    </Button>

                    <Button
                        onClick={() => setShowIssueForm(true)}
                        variant="secondary"
                        className="flex items-center gap-2"
                    >
                        <BanknotesIcon className="h-5 w-5" />
                        Issue Credits
                    </Button>
                </div>
            </div>

            {/* Register Producer Form */}
            {showRegisterForm && (
                <Card title="Register New Producer">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Producer Address
                            </label>
                            <input
                                type="text"
                                value={registerForm.producerAddress}
                                onChange={(e) => setRegisterForm({ ...registerForm, producerAddress: e.target.value })}
                                placeholder="0x..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Plant ID
                            </label>
                            <input
                                type="text"
                                value={registerForm.plantId}
                                onChange={(e) => setRegisterForm({ ...registerForm, plantId: e.target.value })}
                                placeholder="PLANT-001"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Location
                            </label>
                            <input
                                type="text"
                                value={registerForm.location}
                                onChange={(e) => setRegisterForm({ ...registerForm, location: e.target.value })}
                                placeholder="City, Country"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Renewable Source
                            </label>
                            <select
                                value={registerForm.renewableSource}
                                onChange={(e) => setRegisterForm({ ...registerForm, renewableSource: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {RENEWABLE_SOURCES.map(source => (
                                    <option key={source.value} value={source.value}>{source.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleRegisterProducer}
                                disabled={isWriting || isConfirming || !registerForm.producerAddress || !registerForm.plantId || !registerForm.location}
                                className="flex-1"
                            >
                                {isWriting || isConfirming ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        {isWriting ? 'Registering...' : 'Confirming...'}
                                    </>
                                ) : (
                                    'Register Producer'
                                )}
                            </Button>

                            <Button
                                onClick={() => setShowRegisterForm(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Issue Credits Form */}
            {showIssueForm && (
                <Card title="Issue Credits to Producer">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Producer Address
                            </label>
                            <select
                                value={issueForm.producerAddress}
                                onChange={(e) => setIssueForm({ ...issueForm, producerAddress: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select a producer</option>
                                {producers.filter(p => p.producer.isActive).map(producer => (
                                    <option key={producer.address} value={producer.address}>
                                        {producer.producer.plantId} - {producer.address.slice(0, 6)}...{producer.address.slice(-4)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Amount (GHC)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={issueForm.amount}
                                onChange={(e) => setIssueForm({ ...issueForm, amount: e.target.value })}
                                placeholder="100.00"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Production Time
                            </label>
                            <input
                                type="datetime-local"
                                value={issueForm.productionTime}
                                onChange={(e) => setIssueForm({ ...issueForm, productionTime: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={handleIssueCredits}
                                disabled={isWriting || isConfirming || !issueForm.producerAddress || !issueForm.amount || !issueForm.productionTime}
                                className="flex-1"
                            >
                                {isWriting || isConfirming ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        {isWriting ? 'Issuing...' : 'Confirming...'}
                                    </>
                                ) : (
                                    'Issue Credits'
                                )}
                            </Button>

                            <Button
                                onClick={() => setShowIssueForm(false)}
                                variant="secondary"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Producers List */}
            <div className="space-y-4">
                {producers.map((producerData) => (
                    <ProducerCard
                        key={producerData.address}
                        producerData={producerData}
                        onToggleStatus={handleToggleProducerStatus}
                        onSelect={() => setSelectedProducer(producerData.address)}
                        isSelected={selectedProducer === producerData.address}
                    />
                ))}
            </div>

            {/* Empty State */}
            {producers.length === 0 && (
                <div className="text-center py-12">
                    <UserPlusIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No producers found</h3>
                    <p className="text-gray-500">
                        {searchTerm || filterSource !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your filters'
                            : 'Register your first producer to get started!'}
                    </p>
                </div>
            )}

            {/* Transaction Notifications */}
            {isConfirmed && (
                <Notification
                    type="success"
                    title="Transaction Confirmed"
                    message="Your transaction has been confirmed on the blockchain!"
                    onClose={() => { }}
                />
            )}
        </div>
    )
}

// Producer Card Component
interface ProducerCardProps {
    producerData: ProducerWithAddress
    onToggleStatus: (address: Address, currentStatus: boolean) => void
    onSelect: () => void
    isSelected: boolean
}

const ProducerCard: React.FC<ProducerCardProps> = ({
    producerData,
    onToggleStatus,
    onSelect,
    isSelected
}) => {
    const { address, producer } = producerData

    const formattedTotalProduced = Number(formatEther(producer.totalProduced))
    const registrationDate = new Date(Number(producer.registrationTime) * 1000)

    return (
        <Card title={producer.plantId}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getSourceIcon(producer.renewableSource)}
                        <div>
                            <h3 className="font-semibold text-gray-900">{producer.plantId}</h3>
                            <p className="text-sm text-gray-600">{producer.location}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${producer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {producer.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Address</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">
                            {address.slice(0, 6)}...{address.slice(-4)}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Total Produced</p>
                        <p className="text-sm font-medium text-gray-900">
                            {formattedTotalProduced.toFixed(2)} GHC
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="text-sm font-medium text-gray-900">{producer.renewableSource}</p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Registered</p>
                        <p className="text-sm font-medium text-gray-900">
                            {registrationDate.toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <Button
                        onClick={() => onToggleStatus(address, producer.isActive)}
                        variant={producer.isActive ? "danger" : "secondary"}
                        size="sm"
                        className="flex-1"
                    >
                        {producer.isActive ? 'Deactivate' : 'Activate'}
                    </Button>

                    <Button
                        onClick={onSelect}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                    >
                        {isSelected ? 'Selected' : 'Select'}
                    </Button>
                </div>
            </div>
        </Card>
    )
}
