import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const UserDashboard = () => {
  const { user } = useAuth();
  const { isSubscribed, loading, subscribe, unsubscribe, checkSubscriptionStatus } = useNotification();
  const [browserSupport, setBrowserSupport] = useState({
    serviceWorker: false,
    notification: false,
    pushManager: false
  });

  useEffect(() => {
    // Check browser support
    checkBrowserSupport();
    // Check subscription status
    checkSubscriptionStatus();
  }, []);

  const checkBrowserSupport = () => {
    setBrowserSupport({
      serviceWorker: 'serviceWorker' in navigator,
      notification: 'Notification' in window,
      pushManager: 'PushManager' in window
    });
  };

  const handleToggleNotifications = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  const handleRefreshStatus = () => {
    checkSubscriptionStatus();
  };

  const isFullySupported = Object.values(browserSupport).every(Boolean);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.username}!</p>
      </div>

      {/* Notification Status Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Push Notification Status</h2>
          <button
            onClick={handleRefreshStatus}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            title="Refresh status"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Status */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {isSubscribed ? (
                <>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-lg font-medium text-green-700">Notifications Enabled</p>
                    <p className="text-sm text-green-600">You'll receive push notifications</p>
                  </div>
                </>
              ) : (
                <>
                  <BellOff className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">Notifications Disabled</p>
                    <p className="text-sm text-gray-600">Enable to receive push notifications</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleToggleNotifications}
              disabled={loading || !isFullySupported}
              className={`w-full flex items-center justify-center py-3 px-4 rounded-md font-medium transition-colors ${
                isSubscribed
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isSubscribed ? 'Disabling...' : 'Enabling...'}
                </div>
              ) : (
                <div className="flex items-center">
                  {isSubscribed ? (
                    <>
                      <BellOff className="h-5 w-5 mr-2" />
                      Disable Notifications
                    </>
                  ) : (
                    <>
                      <Bell className="h-5 w-5 mr-2" />
                      Enable Notifications
                    </>
                  )}
                </div>
              )}
            </button>
          </div>

          {/* Browser Support Status */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Browser Compatibility</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Worker</span>
                {browserSupport.serviceWorker ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Notification API</span>
                {browserSupport.notification ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Push Manager</span>
                {browserSupport.pushManager ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            {!isFullySupported && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">Browser Not Supported</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your browser doesn't support all required features for push notifications.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* How it Works */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">How Push Notifications Work</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <p className="text-sm text-gray-600">Enable notifications by clicking the button above</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <p className="text-sm text-gray-600">Your browser will ask for permission to show notifications</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                3
              </div>
              <p className="text-sm text-gray-600">Administrators can send you important updates and announcements</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                4
              </div>
              <p className="text-sm text-gray-600">Receive notifications even when the website is closed</p>
            </div>
          </div>
        </div>

        {/* Privacy & Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy & Control</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">You can disable notifications at any time</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">Only authorized administrators can send notifications</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">Your notification preferences are stored securely</p>
            </div>
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600">No personal data is shared with third parties</p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h3>
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-blue-800 font-medium">Not receiving notifications?</p>
                <ul className="text-xs text-blue-700 mt-1 space-y-1">
                  <li>• Make sure notifications are enabled in your browser settings</li>
                  <li>• Check that you haven't blocked notifications for this site</li>
                  <li>• Try disabling and re-enabling notifications</li>
                  <li>• Ensure your browser supports push notifications</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <div className="flex">
              <Info className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-800 font-medium">Browser Support</p>
                <p className="text-xs text-gray-600 mt-1">
                  Push notifications work best in Chrome, Firefox, Safari, and Edge. 
                  Some features may not work in older browsers or private browsing mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;