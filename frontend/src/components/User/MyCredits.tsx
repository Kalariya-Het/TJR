import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Notification } from '../ui/Notification';
import { BanknotesIcon, ArrowPathIcon, ArchiveBoxIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface CreditBatch {
  id: string;
  batch_id: number;
  producer_id: string;
  amount: string;
  issuance_time: string;
  renewable_source: string;
  is_retired: boolean;
  retirement_time?: string;
}

interface CreditTransaction {
  id: string;
  transaction_hash: string;
  transaction_type: string;
  from_address: string;
  to_address: string;
  amount: string;
  created_at: string;
}

export const MyCredits: React.FC = () => {
  const { user, token } = useUser();
  const [balance, setBalance] = useState<string | null>(null);
  const [batches, setBatches] = useState<CreditBatch[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [retireAmount, setRetireAmount] = useState('');
  const [retireReason, setRetireReason] = useState('');

  const fetchCreditData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !token || !user.wallet_address) {
        setError('User not logged in or wallet not connected.');
        setIsLoading(false);
        return;
      }

      // Fetch balance
      const balanceResponse = await fetch(`http://localhost:3001/api/credits/balance/${user.wallet_address}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const balanceData = await balanceResponse.json();
      if (balanceResponse.ok && balanceData.balance) {
        setBalance(balanceData.balance);
      } else {
        setError(balanceData.error || 'Failed to fetch balance.');
      }

      // Fetch batches
      const batchesResponse = await fetch(`http://localhost:3001/api/credits/batches?producer_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const batchesData = await batchesResponse.json();
      if (batchesResponse.ok && batchesData.batches) {
        setBatches(batchesData.batches);
      } else {
        setError(batchesData.error || 'Failed to fetch batches.');
      }

      // Fetch transactions
      const transactionsResponse = await fetch(`http://localhost:3001/api/credits/transactions?user_id=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const transactionsData = await transactionsResponse.json();
      if (transactionsResponse.ok && transactionsData.transactions) {
        setTransactions(transactionsData.transactions);
      } else {
        setError(transactionsData.error || 'Failed to fetch transactions.');
      }

    } catch (err) {
      console.error('Error fetching credit data:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchCreditData();
    }
  }, [user, token]);

  const handleRetireCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!user || !token || !user.wallet_address) {
      setError('You must be logged in to retire credits.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/credits/retire', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(retireAmount),
          reason: retireReason,
          wallet_address: user.wallet_address,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Credits retired successfully!');
        setRetireAmount('');
        setRetireReason('');
        fetchCreditData(); // Refresh data
      } else {
        setError(data.error || 'Failed to retire credits.');
      }
    } catch (err) {
      console.error('Credit retirement error:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-900 mb-2">Error: {error}</h3>
        <p className="text-gray-500">Failed to load credit data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My Credits</h1>
      <p className="text-gray-600">View your green hydrogen credit balance, batches, and transactions.</p>

      {successMessage && (
        <Notification type="success" title="Success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      {/* Balance Overview */}
      <Card title="Current Balance">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BanknotesIcon className="h-8 w-8 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">
              {balance !== null ? `${Number(balance).toFixed(2)} GHC` : 'Loading...'}
            </p>
          </div>
          <Button onClick={fetchCreditData} variant="secondary">
            <ArrowPathIcon className="h-5 w-5 mr-2" /> Refresh
          </Button>
        </div>
      </Card>

      {/* Retire Credits Form */}
      <Card title="Retire Credits">
        <form onSubmit={handleRetireCredits} className="space-y-4">
          <p className="text-gray-600">Permanently remove credits from circulation.</p>
          <div>
            <label htmlFor="retireAmount" className="block text-sm font-medium text-gray-700">Amount to Retire (GHC)</label>
            <input
              type="number"
              id="retireAmount"
              step="0.01"
              min="0.01"
              value={retireAmount}
              onChange={(e) => setRetireAmount(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="retireReason" className="block text-sm font-medium text-gray-700">Reason for Retirement</label>
            <textarea
              id="retireReason"
              value={retireReason}
              onChange={(e) => setRetireReason(e.target.value)}
              rows={3}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            ></textarea>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <><LoadingSpinner size="sm" /> Retiring...</>
            ) : (
              'Retire Credits'
            )}
          </Button>
        </form>
      </Card>

      {/* Credit Batches */}
      <Card title="My Credit Batches">
        {batches.length === 0 ? (
          <p className="text-gray-500">No credit batches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (GHC)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issued</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.batch_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(batch.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.renewable_source}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(batch.issuance_time).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${batch.is_retired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {batch.is_retired ? 'Retired' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Credit Transactions */}
      <Card title="My Credit Transactions">
        {transactions.length === 0 ? (
          <p className="text-gray-500">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hash</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount (GHC)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.transaction_hash.slice(0, 10)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.transaction_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(tx.amount).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.from_address.slice(0, 6)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.to_address.slice(0, 6)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
