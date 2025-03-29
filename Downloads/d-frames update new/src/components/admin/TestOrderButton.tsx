
import { supabase } from '../../lib/supabase';

export default function TestOrderButton() {
  const checkTableExists = async () => {
    try {
      // First, check if the orders table exists
      const { data: tables, error: tableError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'orders');
      
      if (tableError) {
        console.error('Error checking if table exists:', tableError);
        alert(`Error checking if orders table exists: ${tableError.message}`);
        return false;
      }
      
      if (!tables || tables.length === 0) {
        alert('The orders table does not exist in your Supabase database. Please run the setup_all_tables.sql script first.');
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Error checking table existence:', err);
      alert(`Error checking table existence: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  };
  
  const createTestOrder = async () => {
    try {
      // Check if the table exists first
      const tableExists = await checkTableExists();
      if (!tableExists) return;
      
      // Generate a random order ID for testing
      const orderId = `test-${Math.floor(Math.random() * 1000000)}`;
      
      console.log('Attempting to create test order...');
      
      // Create a test order in Supabase
      const { data, error } = await supabase.from('orders').insert({
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '555-123-4567',
        product_name: 'Test Product',
        product_id: 'TEST-001',
        quantity: 1,
        total_price: 99.99,
        status: 'pending',
        shipping_address: '123 Test Street, Test City, Test State 12345, USA',
        payment_method: 'test_payment',
        payment_id: orderId,
        notes: 'This is a test order created at ' + new Date().toISOString()
      }).select();
      
      if (error) {
        console.error('Error creating test order:', error);
        alert(`Failed to create test order: ${error.message}
Code: ${error.code}
Details: ${error.details || 'No details'}`);
      } else {
        console.log('Test order created successfully:', data);
        alert('Test order created successfully! Check the Orders Management page.');
      }
    } catch (err) {
      console.error('Error in createTestOrder:', err);
      alert(`An error occurred while creating the test order: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  return (
    <button
      onClick={createTestOrder}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
    >
      Create Test Order
    </button>
  );
}
