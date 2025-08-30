import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Notification as NotificationComponent } from '../ui/Notification';
import { UserGroupIcon, CheckCircleIcon, XCircleIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';

interface Verifier {
  id: string;
  user_id: string;
  wallet_address: string;
  organization_name: string;
  organization_type: string;
  accreditation_body?: string;
  accreditation_number?: string;
  specialization: string[];
  reputation_score: number;
  total_verifications: number;
  successful_verifications: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email: string; // From joined user data
}

interface RegisterVerifierForm {
  email: string;
  password?: string;
  walletAddress: string;
  organizationName: string;
  organizationType: string;
  accreditationBody: string;
  accreditationNumber: string;
  specialization: string;
}

export const VerifierManagement: React.FC = () => {
  const { user, token } = useUser();
  const [verifiers, setVerifiers] = useState<Verifier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [registerForm, setRegisterForm] = useState<RegisterVerifierForm>({
    email: '',
    password: '',
    walletAddress: '',
    organizationName: '',
    organizationType: '',
    accreditationBody: '',
    accreditationNumber: '',
    specialization: '',
  });
  const [selectedVerifier, setSelectedVerifier] = useState<Verifier | null>(null);
  const [reputationUpdate, setReputationUpdate] = useState<number>(0);

  const fetchVerifiers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !token || user.role !== 'admin') {
        setError('You must be logged in as an admin to view verifiers.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/verifiers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.verifiers) {
        setVerifiers(data.verifiers);
      } else {
        setError(data.error || 'Failed to fetch verifiers.');
      }
    } catch (err) {
      console.error('Error fetching verifiers:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && user.role === 'admin') {
      fetchVerifiers();
    }
  }, [user, token]);

  const handleRegisterVerifier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!registerForm.email || !registerForm.password || !registerForm.walletAddress || !registerForm.organizationName || !registerForm.organizationType) {
      alert('Please fill all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/verifiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: registerForm.email,
          password: registerForm.password,
          wallet_address: registerForm.walletAddress,
          organization_name: registerForm.organizationName,
          organization_type: registerForm.organizationType,
          accreditation_body: registerForm.accreditationBody || undefined,
          accreditation_number: registerForm.accreditationNumber || undefined,
          specialization: registerForm.specialization ? registerForm.specialization.split(',').map(s => s.trim()) : [],
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Verifier registered successfully!');
        setShowRegisterForm(false);
        setRegisterForm({
          email: '',
          password: '',
          walletAddress: '',
          organizationName: '',
          organizationType: '',
          accreditationBody: '',
          accreditationNumber: '',
          specialization: '',
        });
        fetchVerifiers();
      } else {
        setError(data.error || 'Failed to register verifier.');
      }
    } catch (err) {
      console.error('Error registering verifier:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (verifierId: string, currentStatus: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`http://localhost:3001/api/verifiers/${verifierId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`Verifier ${data.verifier.email} status toggled successfully.`);
        fetchVerifiers();
      } else {
        setError(data.error || 'Failed to toggle verifier status.');
      }
    } catch (err) {
      console.error('Error toggling verifier status:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateReputation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerifier) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`http://localhost:3001/api/verifiers/${selectedVerifier.id}/reputation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reputation_score: reputationUpdate }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage(`Verifier ${selectedVerifier.email} reputation updated successfully.`);
        setSelectedVerifier(null); // Close modal
        fetchVerifiers();
      } else {
        setError(data.error || 'Failed to update reputation.');
      }
    } catch (err) {
      console.error('Error updating reputation:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">
          You need to be an admin to manage verifiers.
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
      <h1 className="text-3xl font-bold text-gray-900">Verifier Management</h1>
      <p className="text-gray-600">Register and manage verifier organizations in the system.</p>

      {successMessage && (
        <NotificationComponent type="success" title="Success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}
      {error && (
        <NotificationComponent type="error" title="Error" message={error} onClose={() => setError(null)} />
      )}

      {/* Actions Bar */}
      <div className="flex justify-end">
        <Button onClick={() => setShowRegisterForm(true)} className="flex items-center gap-2">
          <PlusIcon className="h-5 w-5" /> Register Verifier
        </Button>
      </div>

      {/* Register Verifier Form */}
      {showRegisterForm && (
        <Card title="Register New Verifier">
          <form onSubmit={handleRegisterVerifier} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" id="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-700">Wallet Address</label>
              <input type="text" id="walletAddress" value={registerForm.walletAddress} onChange={(e) => setRegisterForm({ ...registerForm, walletAddress: e.target.value })} required placeholder="0x..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700">Organization Name</label>
              <input type="text" id="organizationName" value={registerForm.organizationName} onChange={(e) => setRegisterForm({ ...registerForm, organizationName: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700">Organization Type</label>
              <input type="text" id="organizationType" value={registerForm.organizationType} onChange={(e) => setRegisterForm({ ...registerForm, organizationType: e.target.value })} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="accreditationBody" className="block text-sm font-medium text-gray-700">Accreditation Body (Optional)</label>
              <input type="text" id="accreditationBody" value={registerForm.accreditationBody} onChange={(e) => setRegisterForm({ ...registerForm, accreditationBody: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="accreditationNumber" className="block text-sm font-medium text-gray-700">Accreditation Number (Optional)</label>
              <input type="text" id="accreditationNumber" value={registerForm.accreditationNumber} onChange={(e) => setRegisterForm({ ...registerForm, accreditationNumber: e.target.value })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">Specialization (Comma-separated, Optional)</label>
              <input type="text" id="specialization" value={registerForm.specialization} onChange={(e) => setRegisterForm({ ...registerForm, specialization: e.target.value })} placeholder="e.g., hydrogen_production, emissions_verification" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? <LoadingSpinner size="sm" /> : 'Register Verifier'}
              </Button>
              <Button type="button" onClick={() => setShowRegisterForm(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Verifiers List */}
      {verifiers.length === 0 ? (
        <div className="text-center py-12">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No verifiers found</h3>
          <p className="text-gray-500">
            Register your first verifier to get started!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reputation</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {verifiers.map((verifier) => (
                <tr key={verifier.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{verifier.organization_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{verifier.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{verifier.organization_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${verifier.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {verifier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{verifier.reputation_score}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleToggleStatus(verifier.id, verifier.is_active)}
                        variant={verifier.is_active ? "danger" : "secondary"}
                        size="sm"
                      >
                        {verifier.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedVerifier(verifier);
                          setReputationUpdate(verifier.reputation_score);
                        }}
                        variant="secondary"
                        size="sm"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" /> Reputation
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Update Reputation Modal */}
      {selectedVerifier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-11/12 md:w-1/2 lg:w-1/3 shadow-lg rounded-md bg-white space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Update Reputation for {selectedVerifier.organization_name}</h3>
            <form onSubmit={handleUpdateReputation} className="space-y-4">
              <div>
                <label htmlFor="reputation_score" className="block text-sm font-medium text-gray-700">Reputation Score</label>
                <input
                  type="number"
                  id="reputation_score"
                  value={reputationUpdate}
                  onChange={(e) => setReputationUpdate(parseInt(e.target.value))}
                  min="0"
                  max="100"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <LoadingSpinner size="sm" /> : 'Update Reputation'}
                </Button>
                <Button type="button" onClick={() => setSelectedVerifier(null)} variant="secondary">
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
