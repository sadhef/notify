import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState(null);

  useEffect(() => {
    if (isLoggedIn() && 'serviceWorker' in navigator) {
      checkSubscriptionStatus();
    }
  }, [user]);

  // Check if browser supports push notifications
  const checkSupport = () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }
    if (!('Notification' in window)) {
      throw new Error('Notification API not supported');
    }
    if (!('PushManager' in window)) {
      throw new Error('Push API not supported');
    }
    return true;
  };

  // Register service worker
  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('Service Worker registered:', registration);
      setRegistration(registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  };

  // Request notification permission
  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }
      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      throw error;
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    try {
      setLoading(true);
      
      // Check support
      checkSupport();
      
      // Request permission
      await requestPermission();
      
      // Register service worker
      let swRegistration = registration;
      if (!swRegistration) {
        swRegistration = await registerServiceWorker();
      }

      // Get VAPID public key from server
      const vapidResponse = await axios.get('/vapid-public-key');
      const publicKey = vapidResponse.data.publicKey;

      // Create push subscription
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      // Send subscription to server
      const response = await axios.post('/notifications/subscribe', subscription);
      
      if (response.data.success) {
        setIsSubscribed(true);
        toast.success('Push notifications enabled!');
        return { success: true };
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      const message = error.response?.data?.message || error.message || 'Failed to enable notifications';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      setLoading(true);
      
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
          setIsSubscribed(false);
          toast.info('Push notifications disabled');
          return { success: true };
        }
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      toast.error('Failed to disable notifications');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Check current subscription status
  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
        setRegistration(registration);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  // Send notification to all users (Admin only)
  const sendToAll = async (notificationData) => {
    try {
      setLoading(true);
      console.log('Sending notification to all:', notificationData);
      
      const response = await axios.post('/notifications/send-to-all', notificationData);
      
      if (response.data.success) {
        toast.success('Notifications sent successfully!');
        return response.data;
      }
    } catch (error) {
      console.error('Send notification failed:', error);
      const message = error.response?.data?.message || 'Failed to send notifications';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Send notification to specific users (Admin only)
  const sendToUsers = async (notificationData) => {
    try {
      setLoading(true);
      console.log('Sending notification to users:', notificationData);
      
      const response = await axios.post('/notifications/send-to-users', notificationData);
      
      if (response.data.success) {
        toast.success('Notifications sent successfully!');
        return response.data;
      }
    } catch (error) {
      console.error('Send targeted notification failed:', error);
      const message = error.response?.data?.message || 'Failed to send notifications';
      toast.error(message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get notification history (Admin only)
  const getHistory = async (page = 1, limit = 10) => {
    try {
      const response = await axios.get(`/notifications/history?page=${page}&limit=${limit}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      console.error('Get notification history failed:', error);
      const message = error.response?.data?.message || 'Failed to fetch notification history';
      toast.error(message);
      throw error;
    }
  };

  // Get all users (Admin only)
  const getUsers = async () => {
    try {
      const response = await axios.get('/notifications/users');
      if (response.data.success) {
        return response.data.data.users;
      }
    } catch (error) {
      console.error('Get users failed:', error);
      const message = error.response?.data?.message || 'Failed to fetch users';
      toast.error(message);
      throw error;
    }
  };

  const value = {
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    sendToAll,
    sendToUsers,
    getHistory,
    getUsers,
    checkSubscriptionStatus
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Helper function to convert VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};