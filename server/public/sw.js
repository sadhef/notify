// Service Worker for Push Notifications with Authentication

const CACHE_NAME = 'push-notification-app-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Helper function to convert VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Get auth token from localStorage (accessed via client)
const getAuthToken = () => {
  return new Promise((resolve) => {
    // We'll get the token through a message from the main thread
    self.clients.matchAll().then(clients => {
      if (clients.length > 0) {
        clients[0].postMessage({ type: 'GET_TOKEN' });
      }
    });
    
    // Listen for token response
    self.addEventListener('message', function handler(event) {
      if (event.data.type === 'TOKEN_RESPONSE') {
        self.removeEventListener('message', handler);
        resolve(event.data.token);
      }
    });
  });
};

// Save subscription to server
const saveSubscription = async (subscription) => {
  try {
    const token = await getAuthToken();
    
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Subscription saved:', data);
    return data;
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
};

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache installation failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and set up push subscription
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Set up push subscription
      setupPushSubscription()
    ])
  );
  
  self.clients.claim();
});

// Set up push subscription
const setupPushSubscription = async () => {
  try {
    // Check if already subscribed
    const existingSubscription = await self.registration.pushManager.getSubscription();
    
    if (!existingSubscription) {
      // Get VAPID public key from server
      const vapidResponse = await fetch('/api/vapid-public-key');
      const { publicKey } = await vapidResponse.json();
      
      // Create new subscription
      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      
      console.log('New push subscription created:', subscription);
      
      // Save to server (will need auth token from main thread)
      await saveSubscription(subscription);
    } else {
      console.log('Existing push subscription found:', existingSubscription);
    }
  } catch (error) {
    console.error('Error setting up push subscription:', error);
  }
};

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch((error) => {
        console.error('Fetch failed:', error);
        // Return a fallback page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {};
  
  try {
    if (event.data) {
      notificationData = event.data.json();
    }
  } catch (error) {
    console.error('Error parsing push data:', error);
    notificationData = {
      title: 'New Notification',
      body: 'You have received a new notification'
    };
  }
  
  const title = notificationData.title || 'Push Notification';
  const options = {
    body: notificationData.body || 'You received a push message!',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/badge-72x72.png',
    image: notificationData.image,
    data: {
      url: notificationData.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/close-icon.png'
      }
    ],
    requireInteraction: false,
    silent: false,
    tag: 'push-notification'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  if (event.action === 'close') {
    // Just close the notification
    return;
  }
  
  // Handle notification click or 'open' action
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window/tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Optional: Track notification dismissals
  // You can send analytics data here if needed
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      handleBackgroundSync()
    );
  }
});

// Handle background sync
const handleBackgroundSync = async () => {
  try {
    console.log('Performing background sync...');
    
    // Check for pending notifications or updates
    // This could include syncing offline actions, updating cache, etc.
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
};

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({
        type: 'VERSION',
        version: CACHE_NAME
      });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED'
          });
        })
      );
      break;
      
    default:
      console.log('Unknown message type:', event.data.type);
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker script loaded successfully');