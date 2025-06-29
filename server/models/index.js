// server/models/index.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('📦 Loading MongoDB models...');

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Push Subscription Schema
const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    default: '/icon.png'
  },
  url: {
    type: String,
    default: '/'
  },
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deliveryStatus: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed'],
      default: 'pending'
    },
    deliveredAt: Date,
    error: String
  }],
  totalSent: {
    type: Number,
    default: 0
  },
  totalDelivered: {
    type: Number,
    default: 0
  },
  totalFailed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
const Subscription = mongoose.model('Subscription', subscriptionSchema);
const Notification = mongoose.model('Notification', notificationSchema);

console.log('✅ Models loaded successfully');

module.exports = {
  User,
  Subscription,
  Notification
};