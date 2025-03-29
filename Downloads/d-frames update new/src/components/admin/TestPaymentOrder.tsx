import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

const TestPaymentOrder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; orderId?: string }>({ 
    success: false, 
    message: '' 
  });

  const createTestPaymentOrder = async () => {
    setLoading(true);
    setResult({ success: false, message: 'Processing...' });
    
    try {
      // Create a test order that simulates what would be created by the payment system
      const orderData = {
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '555-123-4567',
        product_name: 'Test Frame',
        product_id: 'FRAME-TEST',
        quantity: 1,
        total_price: 99.99,
        status: 'pending',
        shipping_address: '123 Test St, Test City, TS 12345, Test Country',
        payment_method: 'credit_card',
        payment_id: `test_payment_${Date.now()}`,
        notes: 'This is a test order created to simulate the payment system'
      };
      
      console.log('Creating test payment order with data:', orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select();
      
      if (error) {
        console.error('Error creating test payment order:', error);
        setResult({ 
          success: false, 
          message: `Failed to create test payment order: ${error.message}` 
        });
        return;
      }
      
      console.log('Test payment order created successfully:', data);
      setResult({ 
        success: true, 
        message: 'Test payment order created successfully!', 
        orderId: data[0]?.id 
      });
    } catch (error) {
      console.error('Exception when creating test payment order:', error);
      setResult({ 
        success: false, 
        message: `Exception: ${error instanceof Error ? error.message : String(error)}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <button
        onClick={createTestPaymentOrder}
        disabled={loading}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
      >
        {loading ? 'Creating...' : 'Create Test Payment Order'}
      </button>
      
      {result.message && (
        <div className={`mt-2 p-3 rounded-md ${result.success ? 'bg-green-900/30 border border-green-500/30' : 'bg-red-900/30 border border-red-500/30'}`}>
          <p>{result.message}</p>
          {result.orderId && (
            <p className="mt-1 text-sm">Order ID: {result.orderId}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TestPaymentOrder;
