import React, { useState, useEffect } from 'react';
import { useUser } from '../../context/UserContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Notification as NotificationComponent } from '../ui/Notification';
import { BellIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export const Notifications: React.FC = () => {
  const { user, token } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!user || !token) {
        setError('You must be logged in to view notifications.');
        setIsLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.notifications) {
        setNotifications(data.notifications);
      } else {
        setError(data.error || 'Failed to fetch notifications.');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Network error or server unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setSuccessMessage('Notification marked as read.');
        fetchNotifications(); // Refresh list
      } else {
        setError('Failed to mark notification as read.');
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Network error or server unreachable.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('http://3001/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setSuccessMessage('All notifications marked as read.');
        fetchNotifications(); // Refresh list
      } else {
        setError('Failed to mark all notifications as read.');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Network error or server unreachable.');
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
        <p className="text-gray-500">Failed to load notifications. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">My Notifications</h1>
      <p className="text-gray-600">Stay updated with important system alerts and activities.</p>

      {successMessage && (
        <NotificationComponent type="success" title="Success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      <div className="flex justify-end">
        <Button onClick={handleMarkAllAsRead} variant="secondary" className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5" /> Mark All as Read
        </Button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No new notifications</h3>
          <p className="text-gray-500">
            You're all caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card key={notification.id} title={notification.title}>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">{notification.message}</p>
                <p className="text-xs text-gray-500">Type: {notification.type} | Created: {new Date(notification.created_at).toLocaleString()}</p>
                {!notification.is_read && (
                  <Button onClick={() => handleMarkAsRead(notification.id)} size="sm">
                    Mark as Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
