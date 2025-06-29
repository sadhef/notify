import React, { useState, useEffect } from 'react';
import { Bell, Users, Send, History, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { sendToAll, sendToUsers, getUsers, loading } = useNotification();
  
  const [activeTab, setActiveTab] = useState('broadcast');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: ''
  });
  const [sendingMode, setSendingMode] = useState('all'); // 'all' or 'selected'

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNotificationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      alert('Title and message are required');
      return;
    }

    try {
      // Create clean payload with only required fields
      const payload = {
        title: notificationForm.title.trim(),
        message: notificationForm.message.trim()
      };

      console.log('Notification form data:', notificationForm);
      console.log('Sending mode:', sendingMode);

      if (sendingMode === 'all') {
        console.log('Sending to all with payload:', payload);
        await sendToAll(payload);
      } else {
        if (selectedUsers.length === 0) {
          alert('Please select at least one user');
          return;
        }
        const targetedPayload = {
          ...payload,
          userIds: selectedUsers
        };
        console.log('Sending to selected users with payload:', targetedPayload);
        console.log('Selected users:', selectedUsers);
        await sendToUsers(targetedPayload);
      }
      
      // Reset form
      setNotificationForm({
        title: '',
        message: ''
      });
      setSelectedUsers([]);
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  };

  const stats = {
    totalUsers: users.length,
    activeSubscriptions: users.filter(user => user.hasActiveSubscription).length,
    adminUsers: users.filter(user => user.role === 'admin').length,
    regularUsers: users.filter(user => user.role === 'user').length
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.username}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Bell className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Admin Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.adminUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Regular Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.regularUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('broadcast')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'broadcast'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send className="inline-block w-4 h-4 mr-2" />
              Send Notifications
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="inline-block w-4 h-4 mr-2" />
              Manage Users
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'broadcast' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Send Push Notification</h2>
              
              {/* Sending Mode Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sending Mode
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendingMode"
                      value="all"
                      checked={sendingMode === 'all'}
                      onChange={(e) => setSendingMode(e.target.value)}
                      className="mr-2"
                    />
                    Send to All Users
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="sendingMode"
                      value="selected"
                      checked={sendingMode === 'selected'}
                      onChange={(e) => setSendingMode(e.target.value)}
                      className="mr-2"
                    />
                    Send to Selected Users
                  </label>
                </div>
              </div>

              {/* User Selection (if selected mode) */}
              {sendingMode === 'selected' && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Users ({selectedUsers.length} selected)
                    </label>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <label
                        key={user._id}
                        className="flex items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleUserSelect(user._id)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{user.username}</span>
                            <div className="flex items-center space-x-2">
                              {user.role === 'admin' && (
                                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                                  Admin
                                </span>
                              )}
                              {user.hasActiveSubscription ? (
                                <CheckCircle className="h-4 w-4 text-green-500" title="Active subscription" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" title="No active subscription" />
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notification Form - Simplified */}
              <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Notification Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    maxLength="100"
                    value={notificationForm.title}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification title..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {notificationForm.title.length}/100 characters
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    maxLength="500"
                    rows="4"
                    value={notificationForm.message}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification message..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {notificationForm.message.length}/500 characters
                  </p>
                </div>

                {/* Preview */}
                {notificationForm.title && notificationForm.message && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                    <div className="bg-white border border-gray-300 rounded-lg p-3 max-w-sm">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <Bell className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notificationForm.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {notificationForm.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !notificationForm.title.trim() || !notificationForm.message.trim()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                      {sendingMode === 'selected' && selectedUsers.length > 0 && (
                        <span className="ml-2 bg-blue-500 text-xs px-2 py-1 rounded-full">
                          {selectedUsers.length}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Users
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.hasActiveSubscription ? (
                              <>
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                                <span className="text-sm text-green-700">Active ({user.subscriptionCount})</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                                <span className="text-sm text-red-700">Inactive</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {users.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are no registered users yet.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;