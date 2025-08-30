import React, { useState, useEffect } from 'react';
import { Address, formatEther } from 'viem';
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
} from '@heroicons/react/24/outline';
import { Card } from './ui/Card';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface Producer {
    id: string;
    user_id: string;
    wallet_address: Address;
    plant_id: string;
    plant_name: string;
    location: string;
    country: string;
    renewable_source: string;
    capacity_kg_per_month: number;
    certification_body: string;
    certification_number: string;
    registration_time: string;
    is_active: boolean;
    is_verified: boolean;
    monthly_production_limit: string;
    total_produced: string;
    created_at: string;
    updated_at: string;
}

const RENEWABLE_SOURCES = [
    { value: 'Solar', label: 'Solar', icon: SunIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    { value: 'Wind', label: 'Wind', icon: CloudIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { value: 'Hydro', label: 'Hydroelectric', icon: BoltIcon, color: 'text-green-600', bgColor: 'bg-green-50' },
    { value: 'Geothermal', label: 'Geothermal', icon: BoltIcon, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { value: 'Biomass', label: 'Biomass', icon: BoltIcon, color: 'text-red-600', bgColor: 'bg-red-50' },
];

const getSourceIcon = (source: string) => {
    const sourceConfig = RENEWABLE_SOURCES.find(s => s.value === source);
    if (sourceConfig) {
        const IconComponent = sourceConfig.icon;
        return <IconComponent className={`h-5 w-5 ${sourceConfig.color}`} />;
    }
    return <BoltIcon className="h-5 w-5 text-gray-600" />;
};

const getSourceConfig = (source: string) => {
    return RENEWABLE_SOURCES.find(s => s.value === source) || RENEWABLE_SOURCES[0];
};

export const Producers: React.FC = () => {
    const [producers, setProducers] = useState<Producer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
    const [sortBy, setSortBy] = useState<'name' | 'location' | 'production' | 'date'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);

    useEffect(() => {
        loadProducers();
    }, []);

    const loadProducers = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/producers');
            const result = await response.json();
            if (result.success) {
                setProducers(result.data);
            }
        } catch (error) {
            console.error('Error loading producers:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducers = producers
        .filter(p => {
            if (searchTerm) {
                return (
                    p.plant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.renewable_source.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            return true;
        })
        .filter(p => {
            if (filterSource !== 'all') {
                return p.renewable_source === filterSource;
            }
            return true;
        })
        .filter(p => {
            if (filterStatus !== 'all') {
                return filterStatus === 'active' ? p.is_active : !p.is_active;
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.plant_name.localeCompare(b.plant_name);
                    break;
                case 'location':
                    comparison = a.location.localeCompare(b.location);
                    break;
                case 'production':
                    comparison = Number(a.total_produced) - Number(b.total_produced);
                    break;
                case 'date':
                    comparison = new Date(a.registration_time).getTime() - new Date(b.registration_time).getTime();
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
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
                                {producers.length}
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
                                {producers.reduce((acc, p) => acc + Number(p.total_produced), 0).toFixed(0)} GHC
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
                                {producers.filter(p => p.is_active).length}
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
                {filteredProducers.map((producer) => (
                    <ProducerCard
                        key={producer.id}
                        producer={producer}
                        onSelect={() => setSelectedProducer(producer)}
                        isSelected={selectedProducer?.id === producer.id}
                    />
                ))}
            </div>

            {/* Empty State */}
            {filteredProducers.length === 0 && (
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
                                    {selectedProducer.plant_name}
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
                                        <p className="font-medium text-gray-900">{selectedProducer.plant_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${selectedProducer.is_active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {selectedProducer.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Location</p>
                                        <p className="font-medium text-gray-900">{selectedProducer.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Renewable Source</p>
                                        <div className="flex items-center gap-2">
                                            {getSourceIcon(selectedProducer.renewable_source)}
                                            <span className="font-medium text-gray-900">{selectedProducer.renewable_source}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Total Produced</p>
                                        <p className="font-medium text-gray-900">
                                            {Number(selectedProducer.total_produced).toFixed(2)} GHC
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Registration Date</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(selectedProducer.registration_time).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-mono text-sm text-gray-900 break-all">
                                        {selectedProducer.wallet_address}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Producer Card Component
interface ProducerCardProps {
    producer: Producer;
    onSelect: () => void;
    isSelected: boolean;
}

const ProducerCard: React.FC<ProducerCardProps> = ({
    producer,
    onSelect,
    isSelected
}) => {
    const registrationDate = new Date(producer.registration_time);
    const sourceConfig = getSourceConfig(producer.renewable_source);

    return (
        <Card title={producer.plant_name}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${sourceConfig.bgColor}`}>
                            {getSourceIcon(producer.renewable_source)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">{producer.plant_name}</h3>
                            <p className="text-sm text-gray-600">{producer.location}</p>
                        </div>
                    </div>

                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${producer.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {producer.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-600">Total Produced</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {Number(producer.total_produced).toFixed(2)} GHC
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="text-sm font-medium text-gray-900">{producer.renewable_source}</p>
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
                            {producer.wallet_address.slice(0, 6)}...{producer.wallet_address.slice(-4)}
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
    );
};