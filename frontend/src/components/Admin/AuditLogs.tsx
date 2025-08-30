import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const AuditLogs: React.FC = () => {
  const { user, token } = useUser();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState('all');
  const [filterResourceType, setFilterResourceType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !token || user.role !== 'admin') {
        setError('You must be logged in as an admin to view audit logs.');
        setIsLoading(false);
        return;
      }

      let url = 'http://localhost:3001/api/admin/audit-logs';
      const params = [];

      if (filterAction !== 'all') params.push(`action=${filterAction}`);
      if (filterResourceType !== 'all') params.push(`resource_type=${filterResourceType}`);
      if (filterUser !== 'all') params.push(`user_id=${filterUser}`);

      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.audit_logs) {
        setAuditLogs(data.audit_logs);
      } else {
        setError(data.error || 'Failed to fetch audit logs.');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && user.role === 'admin') {
      fetchAuditLogs();
    }
  }, [user, token, filterAction, filterResourceType, filterUser]);

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">
          You need to be an admin to view audit logs.
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
      <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
      <p className="text-gray-600">Review system activities and changes.</p>

      {error && (
        <NotificationComponent type="error" title="Error" message={error} onClose={() => setError(null)} />
      )}

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterAction" className="block text-sm font-medium text-gray-700">Action</label>
            <select
              id="filterAction"
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All Actions</option>
              {/* Populate with actual actions from backend if available */}
              <option value="user_login">User Login</option>
              <option value="user_registered">User Registered</option>
              <option value="producer_registered">Producer Registered</option>
              <option value="production_submitted">Production Submitted</option>
              <option value="production_verified">Production Verified</option>
              <option value="kyc_status_updated">KYC Status Updated</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterResourceType" className="block text-sm font-medium text-gray-700">Resource Type</label>
            <select
              id="filterResourceType"
              value={filterResourceType}
              onChange={(e) => setFilterResourceType(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All Resource Types</option>
              {/* Populate with actual resource types from backend if available */}
              <option value="user">User</option>
              <option value="producer">Producer</option>
              <option value="production_submission">Production Submission</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterUser" className="block text-sm font-medium text-gray-700">User</label>
            <select
              id="filterUser"
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="all">All Users</option>
              {/* Populate with actual user IDs/emails from backend if available */}
              {/* This would require another API call to get a list of users */}
            </select>
          </div>
        </div>
      </Card>

      {auditLogs.length === 0 ? (
        <div className="text-center py-12">
          <DocumentMagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
          <p className="text-gray-500">
            There are no audit logs to display based on your filters.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user_email} ({log.user_role})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.resource_type} {log.resource_id ? `(${log.resource_id.slice(0, 8)}...)` : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify({ old: log.old_values, new: log.new_values }, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};