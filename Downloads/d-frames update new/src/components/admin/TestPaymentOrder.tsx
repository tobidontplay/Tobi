 import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const TestPaymentOrder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [result, setResult] = useState<{ success: boolean; message: string; orderId?: string; error?: any }>({ 
    success: false, 
    message: '' 
  });
  
  // Check Supabase connection on component mount
  useEffect(() => {
    checkDatabaseConnection();
  }, []);
  
  // Function to check if we can connect to Supabase
  const checkDatabaseConnection = async () => {
    setDbStatus('checking');
    try {
      // Try to get a count of orders to verify connection
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Database connection error:', error);
        setDbStatus('error');
        return false;
      }
      
      console.log(`Database connected. Found ${count} orders.`);
      setDbStatus('connected');
      return true;
    } catch (err) {
      console.error('Exception checking database:', err);
      setDbStatus('error');
      return false;
    }
  };

  const createTestPaymentOrder = async () => {
    setLoading(true);
    setResult({ success: false, message: 'Processing...' });
    
    // First check if we can connect to the database
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      setResult({ 
        success: false, 
        message: 'Cannot connect to database. Please check your connection and try again.' 
      });
      setLoading(false);
      return;
    }
    
    try {
      // Create a unique timestamp for this test order
      const timestamp = new Date().toISOString();
      const uniqueId = Date.now().toString();
      
      // Create a test order that simulates what would be created by the payment system
      const orderData = {
        customer_name: `Test Customer ${uniqueId.slice(-4)}`,
        customer_email: `test${uniqueId.slice(-4)}@example.com`,
        customer_phone: '555-123-4567',
        product_name: 'Test Frame',
        product_id: `FRAME-TEST-${uniqueId.slice(-6)}`,
        quantity: 1,
        total_price: 99.99,
        status: 'pending',
        shipping_address: '123 Test St, Test City, TS 12345, Test Country',
        payment_method: 'credit_card',
        payment_id: `test_payment_${uniqueId}`,
        notes: `This is a test order created at ${timestamp}`,
        created_at: timestamp,
        updated_at: timestamp
      };
      
      console.log('Creating test payment order with data:', orderData);
      
      // Insert the order into the database
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select();
      
      if (error) {
        console.error('Error creating test payment order:', error);
        setResult({ 
          success: false, 
          message: `Failed to create test payment order: ${error.message}`,
          error: error
        });
        return;
      }
      
      if (!data || data.length === 0) {
        console.error('No data returned after inserting order');
        setResult({ 
          success: false, 
          message: 'Order was created but no data was returned. Check the orders list manually.'
        });
        return;
      }
      
      console.log('Test payment order created successfully:', data);
      setResult({ 
        success: true, 
        message: 'Test payment order created successfully! It should appear in the orders list.', 
        orderId: data[0]?.id 
      });
      
      // Verify the order was created by trying to fetch it
      setTimeout(async () => {
        try {
          const { data: verifyData, error: verifyError } = await supabase
            .from('orders')
            .select('*')
            .eq('payment_id', orderData.payment_id)
            .single();
            
          if (verifyError || !verifyData) {
            console.warn('Could not verify order was created:', verifyError);
          } else {
            console.log('Verified order exists in database:', verifyData);
          }
        } catch (err) {
          console.error('Error verifying order creation:', err);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Exception when creating test payment order:', error);
      setResult({ 
        success: false, 
        message: `Exception: ${error instanceof Error ? error.message : String(error)}`,
        error: error
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-2 w-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' : dbStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
        <span className="text-xs text-gray-400">
          Database: {dbStatus === 'connected' ? 'Connected' : dbStatus === 'checking' ? 'Checking...' : 'Error'}
        </span>
        {dbStatus === 'error' && (
          <button 
            onClick={checkDatabaseConnection}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Retry
          </button>
        )}
      </div>
      
      <button
        onClick={createTestPaymentOrder}
        disabled={loading || dbStatus === 'error'}
        className={`px-4 py-2 ${dbStatus === 'error' ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md flex items-center`}
      >
        {loading ? 'Creating...' : 'Create Test Payment Order'}
      </button>
      
      {result.message && (
        <div className={`mt-2 p-3 rounded-md ${result.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
          <p>{result.message}</p>
          {result.orderId && (
            <p className="mt-1 text-sm">Order ID: {result.orderId}</p>
          )}
          {result.error && (
            <div className="mt-2 p-2 bg-gray-800 rounded text-xs font-mono overflow-auto max-h-32">
              <pre>{JSON.stringify(result.error, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestPaymentOrder;
