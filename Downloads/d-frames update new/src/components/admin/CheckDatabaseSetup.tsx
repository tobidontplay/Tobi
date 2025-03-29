import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CheckDatabaseSetup() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const checkDatabase = async () => {
    setLoading(true);
    setStatus('Checking database setup...');
    
    try {
      // Check if the orders table exists by querying information_schema
      const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'orders');
      
      if (tableError) {
        console.error('Error checking tables:', tableError);
        setStatus(`Error checking database: ${tableError.message}`);
        return;
      }
      
      if (!tables) {
        setStatus('The orders table does not exist. Please run the setup_all_tables.sql script in the Supabase SQL Editor.');
        return;
      }
      
      // Try to fetch a sample order
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(1);
        
      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        setStatus(`Error fetching orders: ${ordersError.message}`);
        return;
      }
      
      if (orders && orders.length > 0) {
        setStatus('Database is properly set up! Found existing orders.');
      } else {
        setStatus('Orders table exists but no orders found. Try creating a test order.');
      }
    } catch (err) {
      console.error('Error checking database:', err);
      setStatus(`Error checking database: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/30 mb-4">
      <h2 className="text-xl font-semibold mb-2">Database Setup Check</h2>
      
      <button
        onClick={checkDatabase}
        disabled={loading}
        className={`px-4 py-2 rounded-md mr-4 ${
          loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {loading ? 'Checking...' : 'Check Database Setup'}
      </button>
      
      {status && (
        <div className={`mt-3 p-3 rounded-md ${
          status.includes('Error') 
            ? 'bg-red-900/30 border border-red-500/30' 
            : status.includes('properly') 
              ? 'bg-green-900/30 border border-green-500/30'
              : 'bg-yellow-900/30 border border-yellow-500/30'
        }`}>
          {status}
        </div>
      )}
      
      {status.includes('does not exist') && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">How to fix:</h3>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Go to your Supabase dashboard</li>
            <li>Navigate to the SQL Editor</li>
            <li>Open the setup_all_tables.sql file from your project</li>
            <li>Copy its contents and paste into the SQL Editor</li>
            <li>Run the script</li>
            <li>Come back and check again</li>
          </ol>
        </div>
      )}
    </div>
  );
}
