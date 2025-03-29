import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4001;

// Validate environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const jwtSecret = process.env.JWT_SECRET;

if (!supabaseUrl || !supabaseKey || !jwtSecret) {
  console.error('Missing required environment variables. Check your .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware - Allow all origins for development
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Add CORS preflight options
app.options('*', cors());

// Performance optimizations
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Add security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Enhanced authentication middleware
const authenticateEmployee = (req, res, next) => {
  // Check for token in cookies or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if token is about to expire (less than 1 hour remaining)
    const expiryTime = new Date(decoded.exp * 1000);
    const now = new Date();
    const timeUntilExpiry = expiryTime - now;
    
    // Attach employee info to request
    req.employee = decoded;
    
    // If token is about to expire, refresh it
    if (timeUntilExpiry < 3600000) { // Less than 1 hour
      const newToken = jwt.sign(
        { 
          id: decoded.id, 
          email: decoded.email, 
          name: decoded.name, 
          role: decoded.role 
        }, 
        jwtSecret, 
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );
      
      // Set new token in cookie
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Also send token in response for non-cookie storage
      res.setHeader('X-Refresh-Token', newToken);
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        message: 'Session expired, please login again' 
      });
    }
    
    return res.status(401).json({ 
      success: false,
      message: 'Invalid authentication token' 
    });
  }
};

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (roles.includes(req.employee.role)) {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
  };
};

// Routes

// Enhanced employee login with rate limiting and security features
let loginAttempts = {};

// Rate limiting middleware for login
const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Initialize or increment attempt counter
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = {
      count: 1,
      lastAttempt: Date.now()
    };
  } else {
    // Reset counter if last attempt was more than 15 minutes ago
    if (Date.now() - loginAttempts[ip].lastAttempt > 15 * 60 * 1000) {
      loginAttempts[ip] = {
        count: 1,
        lastAttempt: Date.now()
      };
    } else {
      // Increment counter
      loginAttempts[ip].count++;
      loginAttempts[ip].lastAttempt = Date.now();
    }
  }
  
  // Check if too many attempts
  if (loginAttempts[ip].count > 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.'
    });
  }
  
  next();
};

// Clean up login attempts periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(loginAttempts).forEach(ip => {
    if (now - loginAttempts[ip].lastAttempt > 15 * 60 * 1000) {
      delete loginAttempts[ip];
    }
  });
}, 10 * 60 * 1000); // Run every 10 minutes

// Employee login endpoint - Simplified for debugging
app.post('/api/employees/login', async (req, res) => {
  try {
    console.log('Login request received:', req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({ 
        message: 'Email and password are required' 
      });
    }
    
    // Hardcoded admin credentials for testing
    const adminCredentials = {
      email: 'admin@dframes.com',
      password: 'admin123',
      id: '1',
      name: 'Admin User',
      role: 'admin'
    };
    
    // Simple credential check
    if (email === adminCredentials.email && password === adminCredentials.password) {
      console.log('Login successful for:', email);
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: adminCredentials.id, 
          email: adminCredentials.email, 
          name: adminCredentials.name, 
          role: adminCredentials.role 
        }, 
        jwtSecret, 
        { expiresIn: '24h' }
      );
      
      // Set token in cookie
      res.cookie('token', token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Return employee info
      return res.status(200).json({
        message: 'Login successful',
        employee: {
          id: adminCredentials.id,
          email: adminCredentials.email,
          name: adminCredentials.name,
          role: adminCredentials.role
        },
        token
      });
    } else {
      console.log('Invalid credentials for:', email);
      return res.status(401).json({ 
        message: 'Invalid email or password' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      message: 'Server error during login' 
    });
  }
});

// Enhanced employee logout
app.post('/api/employees/logout', (req, res) => {
  // Clear authentication cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  
  return res.status(200).json({ 
    success: true,
    message: 'Logout successful' 
  });
});

// Get current employee profile - simplified for compatibility
app.get('/api/employees/me', authenticateEmployee, (req, res) => {
  console.log('Employee profile request received');
  return res.status(200).json({ 
    employee: req.employee 
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({ 
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Get all orders
app.get('/api/orders', authenticateEmployee, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: orders, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ message: 'Server error while fetching orders' });
  }
});

// Update order status
app.patch('/api/orders/:id/status', authenticateEmployee, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }
    
    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Record status change in order_history
    await supabase
      .from('order_history')
      .insert({
        order_id: id,
        status,
        updated_by: req.employee.id,
        notes: req.body.notes || ''
      });
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Server error while updating order status' });
  }
});

// Add tracking information to an order
app.post('/api/orders/:id/tracking', authenticateEmployee, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, tracking_number, tracking_url } = req.body;
    
    if (!carrier || !tracking_number) {
      return res.status(400).json({ message: 'Carrier and tracking number are required' });
    }
    
    // Update order with tracking info
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status: 'shipped',
        shipping_carrier: carrier,
        tracking_number,
        tracking_url: tracking_url || null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Record status change in order_history
    await supabase
      .from('order_history')
      .insert({
        order_id: id,
        status: 'shipped',
        updated_by: req.employee.id,
        notes: `Shipped via ${carrier}. Tracking #: ${tracking_number}`
      });
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error adding tracking information:', error);
    return res.status(500).json({ message: 'Server error while adding tracking information' });
  }
});

// Get order history
app.get('/api/orders/:id/history', authenticateEmployee, async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('order_history')
      .select(`
        *,
        employees (name, email, role)
      `)
      .eq('order_id', id)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching order history:', error);
    return res.status(500).json({ message: 'Server error while fetching order history' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
