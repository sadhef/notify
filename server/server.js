const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Push Notification Server...');

// MongoDB Connection
console.log('📊 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  createIndexes();
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// Create database indexes
const createIndexes = async () => {
  try {
    const { User, Subscription, Notification } = require('./models');
    
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ username: 1 }, { unique: true });
    await Subscription.collection.createIndex({ userId: 1, endpoint: 1 }, { unique: true });
    await Subscription.collection.createIndex({ isActive: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    await Notification.collection.createIndex({ sentBy: 1 });
    
    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.log('ℹ️ Indexes already exist or error creating them:', error.message);
  }
};

// VAPID Configuration
console.log('🔐 Configuring VAPID...');
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_EMAIL) {
  console.error('❌ VAPID keys are missing in environment variables');
  process.exit(1);
}

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
console.log('✅ VAPID configured successfully');

// CORS Configuration - Updated for correct ports
app.use(cors({
  origin: [
    'http://localhost:3000',  // React development server
    'http://localhost:3001',  // Alternative React port
    'http://192.168.41.1:3000', // Network access
    'http://127.0.0.1:3000'   // Local access
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl} - Origin: ${req.get('Origin')}`);
  next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Import and register routes
console.log('🔧 Loading routes...');

const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);

console.log('✅ Routes loaded successfully');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Push Notification Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    port: PORT
  });
});

// Get VAPID public key for client-side use
app.get('/api/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

// Handle non-API routes for development
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Push Notification Backend Server',
    timestamp: new Date().toISOString(),
    info: 'This is the backend server. Your React app should be running on http://localhost:3000',
    ports: {
      backend: PORT,
      frontend: 3000
    }
  });
});

// Catch-all for API routes
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API endpoint not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🎉 Backend Server started successfully!');
  console.log(`📍 Backend running on: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📋 Development Setup:');
  console.log(`   🖥️  Backend (API): http://localhost:${PORT}`);
  console.log(`   🌐 Frontend (React): http://localhost:3000`);
  console.log('');
  console.log('📋 Quick Links:');
  console.log(`   - Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   - VAPID Public Key: http://localhost:${PORT}/api/vapid-public-key`);
  console.log('');
  console.log('🎯 Frontend should be accessible at: http://localhost:3000');
  console.log('');
});