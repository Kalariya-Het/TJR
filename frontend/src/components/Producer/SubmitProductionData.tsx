import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export const SubmitProductionData: React.FC = () => {
  const { user, token } = useUser();
  const [plantId, setPlantId] = useState('');
  const [amount, setAmount] = useState('');
  const [productionTime, setProductionTime] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!user || !token) {
      setError('You must be logged in to submit production data.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/producers/${user.id}/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plant_id: plantId,
          amount: parseFloat(amount),
          production_time: new Date(productionTime).toISOString(),
          ipfs_hash: ipfsHash,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Production data submitted successfully! It is now pending verification.');
        setPlantId('');
        setAmount('');
        setProductionTime('');
        setIpfsHash('');
      } else {
        setError(data.error || 'Failed to submit production data.');
      }
    } catch (err) {
      console.error('Production submission error:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'producer' && user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">
          Only producers can submit production data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Submit New Production Data</h1>
      <p className="text-gray-600">Submit your green hydrogen production details for verification and credit issuance.</p>

      <Card title="Production Details">
        <form onSubmit={handleSubmit} className="space-y-6">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{successMessage}</span>
            </div>
          )}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="plantId" className="block text-sm font-medium text-gray-700">Plant ID</label>
            <input
              type="text"
              id="plantId"
              value={plantId}
              onChange={(e) => setPlantId(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (kg)</label>
            <input
              type="number"
              id="amount"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="productionTime" className="block text-sm font-medium text-gray-700">Production Time</label>
            <input
              type="datetime-local"
              id="productionTime"
              value={productionTime}
              onChange={(e) => setProductionTime(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="ipfsHash" className="block text-sm font-medium text-gray-700">IPFS Hash (e.g., Qm...)</label>
            <input
              type="text"
              id="ipfsHash"
              value={ipfsHash}
              onChange={(e) => setIpfsHash(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <><LoadingSpinner size="sm" /> Submitting...</>
              ) : (
                'Submit Production Data'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
