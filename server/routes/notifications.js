const express = require('express');
const webpush = require('web-push');
const { body, validationResult } = require('express-validator');
const { User, Subscription, Notification } = require('../models');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

console.log('📧 Loading notification routes...');

// Simplified validation - only validate required fields
const notificationValidation = [
  body('title').isLength({ min: 1, max: 100 }).trim().escape(),
  body('message').isLength({ min: 1, max: 500 }).trim().escape()
];

// Send notification to all users (Admin only)
router.post('/send-to-all', verifyToken, requireAdmin, notificationValidation, async (req, res) => {
  try {
    console.log('📧 === SEND TO ALL REQUEST ===');
    console.log('📧 User:', req.user ? { id: req.user._id, username: req.user.username, role: req.user.role } : 'No user');
    console.log('📧 Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('📧 ❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { title, message } = req.body;
    console.log('📧 Processed data:', { title, message });

    // Get all active subscriptions
    console.log('📧 Looking for active subscriptions...');
    const subscriptions = await Subscription.find({ isActive: true }).populate('userId');
    console.log('📧 Found subscriptions:', subscriptions.length);
    
    if (subscriptions.length === 0) {
      console.log('📧 No active subscriptions found');
      return res.json({
        success: true,
        message: 'No active subscriptions found',
        data: {
          totalSent: 0,
          delivered: 0,
          failed: 0
        }
      });
    }

    // Create notification record
    console.log('📧 Creating notification record...');
    const notification = new Notification({
      title,
      message,
      icon: '/logo192.png', // Default icon
      url: '/dashboard',     // Default URL
      sentBy: req.user._id,
      sentTo: subscriptions.map(sub => sub.userId._id),
      totalSent: subscriptions.length
    });

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/logo192.png',
      url: '/dashboard'
    });
    console.log('📧 Notification payload:', payload);

    console.log('📧 Sending to', subscriptions.length, 'subscribers...');
    const deliveryPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
        
        notification.deliveryStatus.push({
          userId: subscription.userId._id,
          status: 'delivered',
          deliveredAt: new Date()
        });
        
        return { success: true, userId: subscription.userId._id };
      } catch (error) {
        console.error('📧 Notification delivery failed:', error);
        
        // Mark subscription as inactive if endpoint is invalid
        if (error.statusCode === 410) {
          await Subscription.findByIdAndUpdate(subscription._id, { isActive: false });
        }
        
        notification.deliveryStatus.push({
          userId: subscription.userId._id,
          status: 'failed',
          error: error.message
        });
        
        return { success: false, userId: subscription.userId._id, error: error.message };
      }
    });

    const results = await Promise.all(deliveryPromises);
    const delivered = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Update notification with final counts
    notification.totalDelivered = delivered;
    notification.totalFailed = failed;
    await notification.save();

    console.log('📧 ✅ Notification sent to all users:', { delivered, failed });

    res.json({
      success: true,
      message: 'Notification sent successfully',
      data: {
        notificationId: notification._id,
        totalSent: subscriptions.length,
        delivered,
        failed
      }
    });

  } catch (error) {
    console.error('📧 ❌ Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send notification to specific users (Admin only)
router.post('/send-to-users', verifyToken, requireAdmin, notificationValidation, async (req, res) => {
  try {
    console.log('📧 === SEND TO USERS REQUEST ===');
    console.log('📧 User:', req.user ? { id: req.user._id, username: req.user.username, role: req.user.role } : 'No user');
    console.log('📧 Request body:', req.body);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('📧 ❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { title, message, userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('📧 ❌ Invalid userIds:', userIds);
      return res.status(400).json({
        success: false,
        message: 'UserIds array is required and cannot be empty'
      });
    }

    // Get subscriptions for specified users
    const subscriptions = await Subscription.find({
      userId: { $in: userIds },
      isActive: true
    }).populate('userId');

    console.log('📧 Found', subscriptions.length, 'subscriptions for', userIds.length, 'users');

    if (subscriptions.length === 0) {
      return res.json({
        success: true,
        message: 'No active subscriptions found for specified users',
        data: {
          totalSent: 0,
          delivered: 0,
          failed: 0
        }
      });
    }

    // Create notification record
    const notification = new Notification({
      title,
      message,
      icon: '/logo192.png', // Default icon
      url: '/dashboard',     // Default URL
      sentBy: req.user._id,
      sentTo: userIds,
      totalSent: subscriptions.length
    });

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/logo192.png',
      url: '/dashboard'
    });

    const deliveryPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(subscription, payload);
        
        notification.deliveryStatus.push({
          userId: subscription.userId._id,
          status: 'delivered',
          deliveredAt: new Date()
        });
        
        return { success: true, userId: subscription.userId._id };
      } catch (error) {
        console.error('Notification delivery failed:', error);
        
        if (error.statusCode === 410) {
          await Subscription.findByIdAndUpdate(subscription._id, { isActive: false });
        }
        
        notification.deliveryStatus.push({
          userId: subscription.userId._id,
          status: 'failed',
          error: error.message
        });
        
        return { success: false, userId: subscription.userId._id, error: error.message };
      }
    });

    const results = await Promise.all(deliveryPromises);
    const delivered = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    notification.totalDelivered = delivered;
    notification.totalFailed = failed;
    await notification.save();

    console.log('📧 ✅ Targeted notification sent:', { delivered, failed });

    res.json({
      success: true,
      message: 'Targeted notification sent successfully',
      data: {
        notificationId: notification._id,
        totalSent: subscriptions.length,
        delivered,
        failed
      }
    });

  } catch (error) {
    console.error('📧 ❌ Send targeted notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send targeted notification'
    });
  }
});

// Subscribe to push notifications
router.post('/subscribe', verifyToken, async (req, res) => {
  try {
    console.log('📧 Subscribe route called for user:', req.user.username);

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
      userId: req.user._id,
      endpoint
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.keys = keys;
      existingSubscription.isActive = true;
      existingSubscription.userAgent = req.get('User-Agent');
      await existingSubscription.save();
      console.log('📧 Subscription updated for user:', req.user.username);
    } else {
      // Create new subscription
      const subscription = new Subscription({
        userId: req.user._id,
        endpoint,
        keys,
        userAgent: req.get('User-Agent')
      });
      
      await subscription.save();
      console.log('📧 New subscription created for user:', req.user.username);
    }

    res.json({
      success: true,
      message: 'Subscription saved successfully'
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
router.get('/history', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('📧 History route called');
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find()
        .populate('sentBy', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments()
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages,
          totalNotifications: total,
          hasNext: page < totalPages,
          hasPrev: page > 1
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
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    console.log('📧 Users route called');

    // Aggregate users with subscription data
    const users = await User.aggregate([
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'userId',
          as: 'subscriptions'
        }
      },
      {
        $addFields: {
          hasActiveSubscription: {
            $gt: [
              { $size: { $filter: { input: '$subscriptions', cond: { $eq: ['$$this.isActive', true] } } } },
              0
            ]
          },
          subscriptionCount: { $size: '$subscriptions' }
        }
      },
      {
        $project: {
          password: 0,
          subscriptions: 0
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        users
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

// Unsubscribe from notifications
router.delete('/unsubscribe', verifyToken, async (req, res) => {
  try {
    console.log('📧 Unsubscribe route called');

    await Subscription.updateMany(
      { userId: req.user._id },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Unsubscribed successfully'
    });

  } catch (error) {
    console.error('❌ Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe'
    });
  }
});

// Get user's subscription status
router.get('/subscription-status', verifyToken, async (req, res) => {
  try {
    const activeSubscriptions = await Subscription.countDocuments({
      userId: req.user._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        hasActiveSubscription: activeSubscriptions > 0,
        subscriptionCount: activeSubscriptions
      }
    });

  } catch (error) {
    console.error('❌ Subscription status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription status'
    });
  }
});

console.log('✅ Notification routes loaded successfully');

module.exports = router;