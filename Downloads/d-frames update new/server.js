import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT Secret for employee authentication
const JWT_SECRET = process.env.JWT_SECRET || 'dframes-employee-portal-secret';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://dframes.com', 'https://admin.dframes.com'] 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());

// Authentication middleware for employee routes
const authenticateEmployee = (req, res, next) => {
  const token = req.cookies.employeeToken || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.employee = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based authorization middleware
const authorizeRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (allowedRoles.includes(req.employee.role)) {
      next();
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
  };
};

// Create a payment intent
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body;
    
    console.log('Creating payment intent:', { amount, currency, metadata });
    
    // Parse shipping address from metadata if it exists
    let shippingAddress = {};
    if (metadata.shippingAddress) {
      try {
        shippingAddress = JSON.parse(metadata.shippingAddress);
      } catch (e) {
        console.error('Error parsing shipping address:', e);
      }
    }
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
    });

    console.log('Payment intent created:', paymentIntent.id);
    
    // Store the order in Supabase
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          payment_intent_id: paymentIntent.id,
          amount: amount,
          currency: currency,
          status: 'pending',
          customer_name: metadata.customerName,
          customer_email: metadata.customerEmail,
          customer_phone: metadata.customerPhone,
          shipping_address: shippingAddress
        }
      ]);
      
    if (orderError) {
      console.error('Error storing order in database:', orderError);
    }
    
    // Send the client secret to the client
    res.json({ 
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Employee authentication routes
app.post('/api/employee/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get employee from database
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .eq('email', email.toLowerCase())
      .limit(1);
      
    if (error) throw error;
    
    const employee = employees?.[0];
    
    if (!employee) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: employee.id, 
        email: employee.email,
        name: employee.name,
        role: employee.role 
      }, 
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    // Set cookie with token
    res.cookie('employeeToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours
    });
    
    // Return employee info (without password)
    const { password_hash, ...employeeData } = employee;
    
    res.json({
      message: 'Login successful',
      employee: employeeData,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/employee/logout', (req, res) => {
  res.clearCookie('employeeToken');
  res.json({ message: 'Logout successful' });
});

// Get current employee profile
app.get('/api/employee/profile', authenticateEmployee, async (req, res) => {
  try {
    const { data: employee, error } = await supabase
      .from('employees')
      .select('id, email, name, role, created_at')
      .eq('id', req.employee.id)
      .single();
      
    if (error) throw error;
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Order management routes (protected by authentication)

// Get all orders
app.get('/api/orders', authenticateEmployee, authorizeRole(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    
    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });
      
    // Apply filters if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,payment_intent_id.ilike.%${search}%`);
    }
    
    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    const { data: orders, error, count } = await query;
    
    if (error) throw error;
    
    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single order by ID
app.get('/api/orders/:id', authenticateEmployee, authorizeRole(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.patch('/api/orders/:id/status', authenticateEmployee, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update the order
    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        updated_by: req.employee.id
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the status change
    await supabase
      .from('order_history')
      .insert([
        {
          order_id: id,
          status,
          employee_id: req.employee.id,
          employee_name: req.employee.name,
          employee_role: req.employee.role
        }
      ]);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add shipping tracking information
app.post('/api/orders/:id/tracking', authenticateEmployee, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, tracking_number, tracking_url } = req.body;
    
    // Validate input
    if (!carrier || !tracking_number) {
      return res.status(400).json({ error: 'Carrier and tracking number are required' });
    }
    
    // Update the order with tracking info
    const { data: order, error } = await supabase
      .from('orders')
      .update({ 
        shipping_carrier: carrier,
        tracking_number,
        tracking_url,
        status: 'shipped',
        updated_at: new Date().toISOString(),
        updated_by: req.employee.id
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    
    // Log the status change
    await supabase
      .from('order_history')
      .insert([
        {
          order_id: id,
          status: 'shipped',
          employee_id: req.employee.id,
          employee_name: req.employee.name,
          employee_role: req.employee.role,
          notes: `Shipped via ${carrier}, tracking: ${tracking_number}`
        }
      ]);
    
    res.json(order);
  } catch (error) {
    console.error('Error adding tracking information:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order history
app.get('/api/orders/:id/history', authenticateEmployee, authorizeRole(['admin', 'manager', 'support']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: history, error } = await supabase
      .from('order_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    res.json(history);
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoints
app.get('/api/analytics/orders', authenticateEmployee, authorizeRole(['admin', 'manager']), async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    let timeFrame;
    const now = new Date();
    
    switch(period) {
      case 'day':
        timeFrame = new Date(now.setDate(now.getDate() - 1)).toISOString();
        break;
      case 'week':
        timeFrame = new Date(now.setDate(now.getDate() - 7)).toISOString();
        break;
      case 'month':
        timeFrame = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        break;
      case 'year':
        timeFrame = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
        break;
      default:
        timeFrame = new Date(now.setDate(now.getDate() - 7)).toISOString();
    }
    
    // Get order counts by status
    const { data: statusCounts, error: statusError } = await supabase
      .from('orders')
      .select('status, count')
      .gte('created_at', timeFrame)
      .group('status');
      
    if (statusError) throw statusError;
    
    // Get total revenue
    const { data: revenueData, error: revenueError } = await supabase
      .from('orders')
      .select('amount, currency')
      .gte('created_at', timeFrame)
      .not('status', 'eq', 'cancelled');
      
    if (revenueError) throw revenueError;
    
    // Calculate revenue by currency
    const revenue = {};
    revenueData.forEach(order => {
      if (!revenue[order.currency]) {
        revenue[order.currency] = 0;
      }
      revenue[order.currency] += order.amount;
    });
    
    res.json({
      ordersByStatus: statusCounts,
      revenue,
      period
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Stripe API version: ${stripe.version}`);
});
