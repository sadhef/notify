const express = require('express');
const webpush = require('web-push');
const router = express.Router();

console.log('📧 Loading notification routes...');

// Simple middleware to log requests
router.use((req, res, next) => {
  console.log(`🔔 Notification route: ${req.method} ${req.path}`);
  next();
});

// Mock user authentication middleware (replace with real auth later)
const mockAuth = (req, res, next) => {
  // For testing, create a mock user
  req.user = {
    _id: 'mock-user-id',
    username: 'test-admin',
    role: 'admin'
  };
  next();
};

// Send notification to all users (Admin only)
router.post('/send-to-all', mockAuth, async (req, res) => {
  try {
    console.log('📧 Send to all route called');
    console.log('Request body:', req.body);
    
    const { title, message, icon = '/icon.png', url = '/' } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required'
      });
    }

    // For now, just return success without actually sending
    // In production, this would get subscriptions from database and send notifications
    const mockResult = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      notificationId: 'mock-notification-id'
    };

    console.log('📧 Mock notification created:', { title, message });

    res.json({
      success: true,
      message: 'Notification sent successfully (mock)',
      data: mockResult
    });

  } catch (error) {
    console.error('❌ Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Send notification to specific users (Admin only)
router.post('/send-to-users', mockAuth, async (req, res) => {
  try {
    console.log('📧 Send to users route called');
    console.log('Request body:', req.body);
    
    const { title, message, userIds, icon = '/icon.png', url = '/' } = req.body;

    if (!title || !message || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, and userIds array are required'
      });
    }

    const mockResult = {
      totalSent: userIds.length,
      delivered: userIds.length,
      failed: 0,
      notificationId: 'mock-notification-id-targeted'
    };

    console.log('📧 Mock targeted notification created:', { title, message, userCount: userIds.length });

    res.json({
      success: true,
      message: 'Targeted notification sent successfully (mock)',
      data: mockResult
    });

  } catch (error) {
    console.error('❌ Send targeted notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send targeted notification'
    });
  }
});

// Subscribe to push notifications
router.post('/subscribe', mockAuth, async (req, res) => {
  try {
    console.log('📧 Subscribe route called');
    console.log('Request body:', req.body);

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    console.log('📧 Mock subscription saved for user:', req.user.username);

    res.json({
      success: true,
      message: 'Subscription saved successfully (mock)'
    });

  } catch (error) {
    console.error('❌ Subscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save subscription'
    });
  }
});

// Get notification history (Admin only)
router.get('/history', mockAuth, async (req, res) => {
  try {
    console.log('📧 History route called');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Mock notification history
    const mockNotifications = [
      {
        _id: 'notification-1',
        title: 'Test Notification 1',
        message: 'This is a test notification',
        sentBy: { username: 'admin', email: 'admin@test.com' },
        totalSent: 5,
        totalDelivered: 4,
        totalFailed: 1,
        createdAt: new Date()
      },
      {
        _id: 'notification-2',
        title: 'Test Notification 2',
        message: 'Another test notification',
        sentBy: { username: 'admin', email: 'admin@test.com' },
        totalSent: 3,
        totalDelivered: 3,
        totalFailed: 0,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    res.json({
      success: true,
      data: {
        notifications: mockNotifications,
        pagination: {
          currentPage: page,
          totalPages: 1,
          totalNotifications: mockNotifications.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });

  } catch (error) {
    console.error('❌ History error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification history'
    });
  }
});

// Get all users (Admin only)
router.get('/users', mockAuth, async (req, res) => {
  try {
    console.log('📧 Users route called');

    // Mock users data
    const mockUsers = [
      {
        _id: 'user-1',
        username: 'testuser1',
        email: 'user1@test.com',
        role: 'user',
        createdAt: new Date(),
        hasActiveSubscription: true,
        subscriptionCount: 1
      },
      {
        _id: 'user-2',
        username: 'testuser2',
        email: 'user2@test.com',
        role: 'user',
        createdAt: new Date(),
        hasActiveSubscription: false,
        subscriptionCount: 0
      },
      {
        _id: 'user-3',
        username: 'admin',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: new Date(),
        hasActiveSubscription: true,
        subscriptionCount: 2
      }
    ];

    res.json({
      success: true,
      data: {
        users: mockUsers
      }
    });

  } catch (error) {
    console.error('❌ Users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

console.log('✅ Notification routes loaded successfully');

module.exports = router;