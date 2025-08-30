import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { CheckCircleIcon, XCircleIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Submission {
  id: string;
  producer_id: string;
  data_hash: string;
  plant_id: string;
  amount: string;
  production_time: string;
  submission_time: string;
  ipfs_hash: string;
  status: string;
  producer_email: string;
  plant_name: string;
  plant_location: string;
  renewable_source: string;
}

export const ReviewSubmissions: React.FC = () => {
  const { user, token } = useUser();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/submissions/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.submissions) {
        setSubmissions(data.submissions);
      } else {
        setError(data.error || 'Failed to fetch pending submissions.');
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'verifier' || user?.role === 'admin') {
      fetchSubmissions();
    } else {
      setIsLoading(false);
    }
  }, [user, token]);

  const handleVerification = async (submissionId: string, dataHash: string, isValid: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch(`http://localhost:3001/api/submissions/${submissionId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          data_hash: dataHash,
          is_valid: isValid,
          verification_notes: isValid ? 'Approved by verifier' : 'Rejected by verifier',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Submission ${isValid ? 'approved' : 'rejected'} successfully!`);
        setSelectedSubmission(null); // Close modal
        fetchSubmissions(); // Refresh list
      } else {
        setError(data.error || 'Failed to verify submission.');
      }
    } catch (err) {
      console.error('Error verifying submission:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'verifier' && user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">
          You need to be a verifier or admin to review submissions.
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
      <h1 className="text-3xl font-bold text-gray-900">Review Production Submissions</h1>
      <p className="text-gray-600">Review and verify pending green hydrogen production data submissions.</p>

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

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pending submissions</h3>
          <p className="text-gray-500">
            All production data has been reviewed or there are no new submissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {submissions.map((submission) => (
            <Card key={submission.id} title={`Submission from ${submission.plant_name}`}>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Plant ID: <span className="font-medium text-gray-900">{submission.plant_id}</span></p>
                <p className="text-sm text-gray-600">Amount: <span className="font-medium text-gray-900">{submission.amount} kg</span></p>
                <p className="text-sm text-gray-600">Source: <span className="font-medium text-gray-900">{submission.renewable_source}</span></p>
                <p className="text-sm text-gray-600">Submitted: <span className="font-medium text-gray-900">{new Date(submission.submission_time).toLocaleDateString()}</span></p>
                <p className="text-sm text-gray-600">Producer: <span className="font-medium text-gray-900">{submission.producer_email}</span></p>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={() => setSelectedSubmission(submission)} size="sm" className="flex-1">
                  <EyeIcon className="h-4 w-4 mr-2" /> View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
          <div className="relative p-8 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Submission Details</h3>
            <p className="text-sm text-gray-600">Plant: <span className="font-medium text-gray-900">{selectedSubmission.plant_name} ({selectedSubmission.plant_id})</span></p>
            <p className="text-sm text-gray-600">Location: <span className="font-medium text-gray-900">{selectedSubmission.plant_location}</span></p>
            <p className="text-sm text-gray-600">Amount: <span className="font-medium text-gray-900">{selectedSubmission.amount} kg</span></p>
            <p className="text-sm text-gray-600">Production Time: <span className="font-medium text-gray-900">{new Date(selectedSubmission.production_time).toLocaleString()}</span></p>
            <p className="text-sm text-gray-600">Submitted By: <span className="font-medium text-gray-900">{selectedSubmission.producer_email}</span></p>
            <p className="text-sm text-gray-600">IPFS Hash: <span className="font-mono text-gray-900 break-all">{selectedSubmission.ipfs_hash}</span></p>
            <p className="text-sm text-gray-600">Data Hash: <span className="font-mono text-gray-900 break-all">{selectedSubmission.data_hash}</span></p>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => handleVerification(selectedSubmission.id, selectedSubmission.data_hash, true)} className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5" /> Approve
              </Button>
              <Button onClick={() => handleVerification(selectedSubmission.id, selectedSubmission.data_hash, false)} variant="danger" className="flex items-center gap-2">
                <XCircleIcon className="h-5 w-5" /> Reject
              </Button>
              <Button onClick={() => setSelectedSubmission(null)} variant="secondary">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
