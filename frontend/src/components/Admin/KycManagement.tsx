import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Notification as NotificationComponent } from '../ui/Notification';
import { UserGroupIcon, CheckCircleIcon, XCircleIcon, PencilIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  role: string;
  wallet_address: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  is_active: boolean;
  is_verified: boolean;
  kyc_status: string;
  created_at: string;
  last_login?: string;
}

export const KycManagement: React.FC = () => {
  const { user, token } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [kycStatusUpdate, setKycStatusUpdate] = useState({
    kyc_status: '',
    is_verified: false,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !token || user.role !== 'admin') {
        setError('You must be logged in as an admin to view KYC submissions.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/admin/kyc', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.users) {
        setUsers(data.users);
      } else {
        setError(data.error || 'Failed to fetch KYC submissions.');
      }
    } catch (err) {
      console.error('Error fetching KYC submissions:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && user.role === 'admin') {
      fetchUsers();
    }
  }, [user, token]);

  const handleUpdateKycStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`http://localhost:3001/api/admin/kyc/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(kycStatusUpdate),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`User ${selectedUser.email} KYC status updated successfully.`);
        setSelectedUser(null); // Close modal
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update KYC status.');
      }
    } catch (err) {
      console.error('Error updating KYC status:', err);
      setError('Network error or server unreachable.');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">
          You need to be an admin to manage KYC submissions.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">KYC Management</h1>
      <p className="text-gray-600">Review and manage user KYC verification statuses.</p>

      {successMessage && (
        <NotificationComponent type="success" title="Success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {error && (
        <NotificationComponent type="error" title="Error" message={error} onClose={() => setError(null)} />
      )}

      {users.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KYC submissions found</h3>
          <p className="text-gray-500">
            There are no pending or existing KYC submissions to review.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verified</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.kyc_status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {u.kyc_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.is_verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {u.is_verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => {
                        setSelectedUser(u);
                        setKycStatusUpdate({ kyc_status: u.kyc_status, is_verified: u.is_verified });
                      }}
                      variant="secondary"
                      size="sm"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" /> Update
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* KYC Update Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Update KYC Status for {selectedUser.email}</h3>
            <form onSubmit={handleUpdateKycStatus} className="space-y-4">
              <div>
                <label htmlFor="kyc_status" className="block text-sm font-medium text-gray-700">KYC Status</label>
                <select
                  id="kyc_status"
                  value={kycStatusUpdate.kyc_status}
                  onChange={(e) => setKycStatusUpdate({ ...kycStatusUpdate, kyc_status: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="under_review">Under Review</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  id="is_verified"
                  type="checkbox"
                  checked={kycStatusUpdate.is_verified}
                  onChange={(e) => setKycStatusUpdate({ ...kycStatusUpdate, is_verified: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_verified" className="ml-2 block text-sm text-gray-900">Is Verified</label>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Update Status'}
                </Button>
                <Button onClick={() => setSelectedUser(null)} variant="secondary">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
