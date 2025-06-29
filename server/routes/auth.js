const express = require('express');
const router = express.Router();

console.log('🔐 Loading auth routes...');

// Simple middleware to log requests
router.use((req, res, next) => {
  console.log(`🔐 Auth route: ${req.method} ${req.path}`);
  next();
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('🔐 Register route called');
    console.log('Request body:', req.body);
    
    const { username, email, password, role = 'user' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    // Mock user creation
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      username,
      email,
      role
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    console.log('🔐 Mock user registered:', mockUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully (mock)',
      data: {
        token: mockToken,
        user: mockUser
      }
    });

  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login route called');
    console.log('Request body:', req.body);
    
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required'
      });
    }

    // Mock login validation
    if (password === 'wrongpassword') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Mock successful login
    const mockUser = {
      id: 'mock-user-' + Date.now(),
      username: login,
      email: login.includes('@') ? login : `${login}@test.com`,
      role: login.toLowerCase().includes('admin') ? 'admin' : 'user'
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    console.log('🔐 Mock user logged in:', mockUser);

    res.json({
      success: true,
      message: 'Login successful (mock)',
      data: {
        token: mockToken,
        user: mockUser
      }
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    console.log('🔐 Profile route called');
    
    // Mock profile data
    const mockUser = {
      id: 'mock-user-profile',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user'
    };

    res.json({
      success: true,
      data: {
        user: mockUser
      }
    });

  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  console.log('🔐 Logout route called');
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

console.log('✅ Auth routes loaded successfully');

module.exports = router;