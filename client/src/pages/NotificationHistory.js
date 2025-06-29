import React, { useState, useEffect } from 'react';
import { History, ChevronLeft, ChevronRight, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationHistory = () => {
  const { getHistory } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalNotifications: 0,
    hasNext: false,
    hasPrev: false
  });
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    loadNotifications(1);
  }, []);

  const loadNotifications = async (page = 1) => {
    setLoading(true);
    try {
      const data = await getHistory(page, 10);
      setNotifications(data.notifications);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load notification history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadNotifications(newPage);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notification History</h1>
        <p className="text-gray-600 mt-2">View all sent push notifications and their delivery status</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <History className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.totalNotifications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Successfully Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.reduce((sum, notif) => sum + notif.totalDelivered, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Failed Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.reduce((sum, notif) => sum + notif.totalFailed, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications.reduce((sum, notif) => sum + notif.totalSent, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no sent notifications yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {notification.sentTo.length} recipients
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">{notification.message}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(notification.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>By {notification.sentBy.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-green-600">{notification.totalDelivered} delivered</span>
                      </div>
                      {notification.totalFailed > 0 && (
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">{notification.totalFailed} failed</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        Success: {Math.round((notification.totalDelivered / notification.totalSent) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing page {pagination.currentPage} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Details</h3>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNotification.title}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sent By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedNotification.sentBy.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sent At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedNotification.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Sent</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedNotification.totalSent}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Delivered</label>
                    <p className="mt-1 text-sm text-green-600">{selectedNotification.totalDelivered}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Failed</label>
                    <p className="mt-1 text-sm text-red-600">{selectedNotification.totalFailed}</p>
                  </div>
                </div>

                {selectedNotification.deliveryStatus && selectedNotification.deliveryStatus.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Status</label>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                      {selectedNotification.deliveryStatus.map((status, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(status.status)}
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status.status)}`}>
                              {status.status}
                            </span>
                          </div>
                          {status.deliveredAt && (
                            <span className="text-xs text-gray-500">
                              {formatDate(status.deliveredAt)}
                            </span>
                          )}
                          {status.error && (
                            <span className="text-xs text-red-500 truncate max-w-xs" title={status.error}>
                              {status.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;