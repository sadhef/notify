const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting Push Notification Server...');

// MongoDB Connection
console.log('📊 Connecting to MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// VAPID Configuration
console.log('🔐 Configuring VAPID...');
webpush.setVapidDetails(
  `mailto:${process.env.VAPID_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
console.log('✅ VAPID configured successfully');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Serve static files (for production builds)
app.use(express.static(path.join(__dirname, 'public')));

// Import and register routes
console.log('🔧 Loading routes...');

try {
  const authRoutes = require('./routes/auth');
  const notificationRoutes = require('./routes/notifications');
  
  app.use('/api/auth', authRoutes);
  app.use('/api/notifications', notificationRoutes);
  
  console.log('✅ Routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.log('Creating basic routes as fallback...');
  
  // Fallback routes if files don't exist
  app.post('/api/notifications/send-to-all', (req, res) => {
    console.log('📧 Fallback notification route called');
    res.json({
      success: false,
      message: 'Route files missing. Please create routes/notifications.js'
    });
  });
  
  app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Fallback auth route called');
    res.json({
      success: false,
      message: 'Route files missing. Please create routes/auth.js'
    });
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Push Notification Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    mode: 'development',
    frontend: 'React app should be running on http://localhost:3001',
    routes: {
      auth: 'Available',
      notifications: 'Available'
    }
  });
});

// Get VAPID public key for client-side use
app.get('/api/vapid-public-key', (req, res) => {
  res.json({
    success: true,
    publicKey: process.env.VAPID_PUBLIC_KEY
  });
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working correctly',
    timestamp: new Date().toISOString()
  });
});

// Debug route to list all routes
app.get('/api/debug/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Regular routes
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const method = Object.keys(handler.route.methods)[0].toUpperCase();
          const basePath = middleware.regexp.source
            .replace('\\/?$', '')
            .replace('\\/?(?=\\/|$)', '');
          const fullPath = basePath + handler.route.path;
          routes.push({
            method,
            path: fullPath.replace(/\\\//g, '/')
          });
        }
      });
    }
  });
  
  res.json({
    success: true,
    totalRoutes: routes.length,
    routes: routes.sort((a, b) => a.path.localeCompare(b.path))
  });
});

// Development info route
app.get('/api/dev-info', (req, res) => {
  res.json({
    success: true,
    message: 'Development server information',
    setup: {
      backend: 'http://localhost:3000 (this server)',
      frontend: 'http://localhost:3001 (React development server)',
      recommendation: 'Use http://localhost:3001 to access your app'
    },
    apis: {
      health: 'http://localhost:3000/api/health',
      routes: 'http://localhost:3000/api/debug/routes',
      vapid: 'http://localhost:3000/api/vapid-public-key'
    }
  });
});

// Handle non-API routes for development
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Push Notification Backend Server',
    timestamp: new Date().toISOString(),
    info: 'This is the backend server. Your React app should be running on http://localhost:3001',
    endpoints: {
      health: '/api/health',
      devInfo: '/api/dev-info',
      routes: '/api/debug/routes'
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
    method: req.method,
    hint: 'Visit /api/debug/routes to see all available routes'
  });
});

// Catch-all for non-API routes (development mode)
app.get('*', (req, res) => {
  // Check if there's a built React app
  const indexPath = path.join(__dirname, 'public', 'index.html');
  const fs = require('fs');
  
  if (fs.existsSync(indexPath)) {
    // Serve the built React app
    res.sendFile(indexPath);
  } else {
    // Development mode - guide user to React dev server
    res.json({
      success: false,
      message: 'Development mode detected',
      info: 'React app is not built for production',
      solution: {
        current: 'You are accessing the backend server directly',
        recommendation: 'Please use http://localhost:3001 to access your React app',
        steps: [
          '1. Make sure your React app is running: cd client && npm start',
          '2. Access your app at: http://localhost:3001',
          '3. This backend serves API endpoints for your React app'
        ]
      },
      endpoints: {
        frontend: 'http://localhost:3001',
        backend: 'http://localhost:3000',
        api: 'http://localhost:3000/api/*'
      }
    });
  }
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
  console.log(`   🌐 Frontend (React): http://localhost:3001`);
  console.log('');
  console.log('📋 Quick Links:');
  console.log(`   - Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   - Dev Info: http://localhost:${PORT}/api/dev-info`);
  console.log(`   - API Routes: http://localhost:${PORT}/api/debug/routes`);
  console.log('');
  console.log('🎯 To access your app: http://localhost:3001');
  console.log('');
});