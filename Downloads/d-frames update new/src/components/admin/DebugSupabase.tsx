import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugSupabase() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const testConnection = async () => {
    setLoading(true);
    setResult('Testing Supabase connection...');
    
    try {
      // Test basic connection with a simple query that doesn't use aggregates
      const { data, error } = await supabase.from('orders').select('id');
      
      if (error) {
        setResult(`Error connecting to Supabase: ${error.message}\nCode: ${error.code}\nDetails: ${JSON.stringify(error.details)}`);
        return;
      }
      
      setResult(`Successfully connected to Supabase! Found ${data.length} orders.`);
    } catch (err) {
      setResult(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  const insertTestOrder = async () => {
    setLoading(true);
    setResult('Inserting test order...');
    
    try {
      // Create a test order with detailed logging
      console.log('Starting test order insertion');
      
      const orderData = {
        customer_name: 'Debug Test',
        customer_email: 'debug@test.com',
        customer_phone: '555-DEBUG',
        product_name: 'Debug Frame',
        product_id: 'DEBUG-001',
        quantity: 1,
        total_price: 99.99,
        status: 'pending',
        shipping_address: '123 Debug St, Test City, Test State 12345, USA',
        payment_method: 'test',
        payment_id: `debug-${Date.now()}`,
        notes: 'Debug test order'
      };
      
      console.log('Order data prepared:', orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
        .select();
      
      console.log('Insert response:', { data, error });
      
      if (error) {
        setResult(`Error inserting test order: ${error.message}\nCode: ${error.code}\nDetails: ${JSON.stringify(error.details)}`);
        return;
      }
      
      setResult(`Successfully inserted test order! Order ID: ${data[0].id}`);
      
      // Check if the real-time subscription is working
      setResult(prev => `${prev}\n\nWaiting for real-time update... (check if the order appears in the list)`);
    } catch (err) {
      console.error('Exception during test order insertion:', err);
      setResult(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-red-900/20 rounded-lg border border-red-500/30 mb-4">
      <h2 className="text-xl font-semibold mb-2">Supabase Debug Tools</h2>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={testConnection}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
        >
          Test Connection
        </button>
        
        <button
          onClick={insertTestOrder}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md"
        >
          Insert Debug Order
        </button>
      </div>
      
      {result && (
        <div className="p-3 bg-gray-800 rounded-md font-mono text-sm whitespace-pre-wrap">
          {result}
        </div>
      )}
    </div>
  );
}
