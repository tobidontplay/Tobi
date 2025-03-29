import { useEffect, useState } from 'react';
import { Map, Marker } from 'react-map-gl';
import { 
  Package, 
  Search,
  RefreshCw,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TestOrderButton from './TestOrderButton';
import CheckDatabaseSetup from './CheckDatabaseSetup';
import DebugSupabase from './DebugSupabase';
import TestPaymentOrder from './TestPaymentOrder';

interface Order {
  id: string;
  status: string;
  total_price: number;
  created_at: string;
  updated_at?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: string;
  payment_method: string;
  payment_id?: string;
  product_name: string;
  product_id?: string;
  quantity: number;
  notes?: string;
  shipping_carrier?: string;
  tracking_number?: string;
  tracking_url?: string;
  delivery_tracking?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState<string | null>(null);
  const [trackingInfo, setTrackingInfo] = useState({
    carrier: '',
    tracking_number: '',
    tracking_url: ''
  });
  const [showDebugTools, setShowDebugTools] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for orders table
    const setupRealtimeSubscription = async () => {
      try {
        // First, remove any existing subscriptions to avoid duplicates
        const channels = supabase.getChannels();
        channels.forEach(channel => {
          if (channel.topic.includes('orders')) {
            supabase.removeChannel(channel);
          }
        });
        
        console.log('Setting up real-time subscription for orders table...');
        
        const ordersSubscription = supabase
          .channel('orders-channel-' + Date.now())
          .on('postgres_changes', 
            { event: 'INSERT', schema: 'public', table: 'orders' }, 
            (payload) => {
              console.log('Real-time INSERT received:', payload);
              // Add the new order to the existing orders list
              if (payload.new) {
                const newOrder = payload.new as Order;
                setOrders(prevOrders => {
                  // Check if order already exists to avoid duplicates
                  const exists = prevOrders.some(order => order.id === newOrder.id);
                  if (exists) {
                    console.log('Order already exists in state, not adding duplicate');
                    return prevOrders;
                  }
                  console.log('Adding new order to state:', newOrder);
                  return [newOrder, ...prevOrders];
                });
              }
            }
          )
          .on('postgres_changes', 
            { event: 'UPDATE', schema: 'public', table: 'orders' }, 
            (payload) => {
              console.log('Real-time UPDATE received:', payload);
              // Update the modified order in the existing orders list
              if (payload.new) {
                const updatedOrder = payload.new as Order;
                setOrders(prevOrders => 
                  prevOrders.map(order => 
                    order.id === updatedOrder.id ? updatedOrder : order
                  )
                );
              }
            }
          )
          .on('postgres_changes', 
            { event: 'DELETE', schema: 'public', table: 'orders' }, 
            (payload) => {
              console.log('Real-time DELETE received:', payload);
              // Remove the deleted order from the existing orders list
              if (payload.old) {
                const deletedOrderId = payload.old.id;
                setOrders(prevOrders => 
                  prevOrders.filter(order => order.id !== deletedOrderId)
                );
              }
            }
          )
          .subscribe((status) => {
            console.log('Supabase subscription status:', status);
          });
          
        return ordersSubscription;
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
        return null;
      }
    };
    
    // Set up the subscription
    const subscriptionPromise = setupRealtimeSubscription();
    
    // Clean up subscription when component unmounts
    return () => {
      subscriptionPromise.then(subscription => {
        if (subscription) {
          console.log('Removing subscription on unmount');
          supabase.removeChannel(subscription);
        }
      });
    };
  }, []);  // Remove filter dependency to avoid recreating subscription on filter change
  
  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };
  
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setStatusUpdateLoading(orderId);
      
      // Update the order status directly in Supabase
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setStatusUpdateLoading(null);
    }
  };
  
  const handleTrackingSubmit = async (orderId: string) => {
    try {
      setStatusUpdateLoading(orderId);
      
      // Update the tracking information directly in Supabase
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'shipped',
          shipping_carrier: trackingInfo.carrier,
          tracking_number: trackingInfo.tracking_number,
          tracking_url: trackingInfo.tracking_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) {
        throw error;
      }
      
      // Update the order in the local state
      setOrders(orders.map(order => 
        order.id === orderId ? { 
          ...order, 
          status: 'shipped',
          shipping_carrier: trackingInfo.carrier,
          tracking_number: trackingInfo.tracking_number,
          tracking_url: trackingInfo.tracking_url
        } : order
      ));
      
      // Reset tracking form
      setTrackingInfo({
        carrier: '',
        tracking_number: '',
        tracking_url: ''
      });
    } catch (error) {
      console.error('Error adding tracking information:', error);
      alert('Failed to add tracking information');
    } finally {
      setStatusUpdateLoading(null);
    }
  };

  async function fetchOrders() {
    try {
      setLoading(true);
      console.log('Fetching orders from Supabase...');
      
      // First, check if we can get a simple count of orders
      const { count, error: countError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
        
      if (countError) {
        console.error('Error counting orders:', countError);
      } else {
        console.log(`Found ${count} orders in database`);
      }
      
      // Now fetch the actual orders
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        console.error('Error code:', error.code);
        console.error('Error details:', error.details);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No orders found in database');
        setOrders([]);
      } else {
        console.log(`Orders fetched successfully: ${data.length} orders found`);
        console.log('First order:', data[0]);
        setOrders(data);
      }
    } catch (error) {
      console.error('Exception in fetchOrders:', error);
      // If there's an error, set orders to an empty array
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'processing': return <Package className="w-4 h-4 text-blue-400" />;
      case 'shipped': return <Truck className="w-4 h-4 text-purple-400" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Package className="w-4 h-4 text-gray-400" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'processing': return 'bg-blue-500/20 text-blue-400';
      case 'shipped': return 'bg-purple-500/20 text-purple-400';
      case 'delivered': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };
  
  const filteredOrders = orders.filter(order => {
    if (searchTerm === '') return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_email?.toLowerCase().includes(searchLower) ||
      order.payment_id?.toLowerCase().includes(searchLower) ||
      order.product_name?.toLowerCase().includes(searchLower) ||
      order.id?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Orders Management</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDebugTools(!showDebugTools)}
            className={`px-4 py-2 ${showDebugTools ? 'bg-purple-600' : 'bg-gray-700'} hover:bg-opacity-90 text-white rounded-md flex items-center gap-1 transition-colors duration-200`}
          >
            BYTE BENDING MODE {showDebugTools ? '(On)' : '(Off)'}
          </button>
          
          {/* Add a button to manually refresh orders */}
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              fetchOrders();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-400"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Debug Tools Section - Only visible when toggle is on */}
      {showDebugTools && (
        <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-purple-400">Debug Tools</h2>
            <span className="px-2 py-1 bg-purple-600/30 rounded text-xs font-medium text-purple-300">BETA</span>
          </div>
          
          <div className="space-y-4">
            {/* Check Database Setup */}
            <div className="p-3 bg-gray-800/80 rounded-lg">
              <h3 className="text-md font-semibold mb-2">Database Setup</h3>
              <CheckDatabaseSetup />
            </div>
            
            {/* Test Order Button */}
            <div className="p-3 bg-gray-800/80 rounded-lg">
              <h3 className="text-md font-semibold mb-2">Create Test Order</h3>
              <TestOrderButton />
            </div>
            
            {/* Supabase Debug Tools */}
            <div className="p-3 bg-gray-800/80 rounded-lg">
              <h3 className="text-md font-semibold mb-2">Supabase Connection</h3>
              <DebugSupabase />
            </div>
            
            {/* Test Payment Order */}
            <div className="p-3 bg-gray-800/80 rounded-lg">
              <h3 className="text-md font-semibold mb-2">Test Payment Flow</h3>
              <p className="mb-3 text-sm text-gray-400">This simulates an order created by the payment system (as if a customer placed an order on the website).</p>
              <TestPaymentOrder />
            </div>
            
            {/* Debug Orders Display */}
            <div className="p-3 bg-gray-800/80 rounded-lg">
              <h3 className="text-md font-semibold mb-2">Orders State</h3>
              <p className="text-sm text-gray-400">Orders in state: {orders.length}</p>
              <div className="mt-2">
                <button
                  onClick={fetchOrders}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md mr-2 text-sm"
                >
                  Manually Fetch Orders
                </button>
                <button
                  onClick={() => console.log('Current orders state:', orders)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm"
                >
                  Log Orders to Console
                </button>
              </div>
              {orders.length > 0 && (
                <div className="mt-4 p-3 bg-gray-900 rounded-md font-mono text-sm max-h-40 overflow-y-auto">
                  {orders.map(order => (
                    <div key={order.id} className="mb-2 pb-2 border-b border-gray-700">
                      ID: {order.id.substring(0, 8)}... | 
                      Name: {order.customer_name} | 
                      Status: {order.status}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Orders Table */}
        <div className="md:col-span-2 bg-purple-900/20 rounded-lg p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-purple-900/30 border border-purple-500/30 focus:border-purple-400 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-purple-400" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No orders found
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg bg-purple-900/30 border border-purple-500/30 hover:border-purple-400 transition-colors overflow-hidden"
                >
                  <div 
                    className="p-4 cursor-pointer" 
                    onClick={() => toggleOrderExpand(order.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <span className="font-medium">Order #{order.payment_id?.slice(-8) || order.id.slice(0, 8)}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        {expandedOrder === order.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 pt-2 border-t border-purple-500/30">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-purple-400 mb-2">Customer Information</h3>
                          <p className="text-sm"><span className="text-gray-400">Name:</span> {order.customer_name}</p>
                          <p className="text-sm"><span className="text-gray-400">Email:</span> {order.customer_email}</p>
                          {order.customer_phone && (
                            <p className="text-sm"><span className="text-gray-400">Phone:</span> {order.customer_phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <h3 className="text-sm font-medium text-purple-400 mb-2">Order Details</h3>
                          <p className="text-sm"><span className="text-gray-400">Amount:</span> USD {order.total_price.toFixed(2)}</p>
                          <p className="text-sm"><span className="text-gray-400">Date:</span> {new Date(order.created_at).toLocaleString()}</p>
                          <p className="text-sm"><span className="text-gray-400">Payment ID:</span> {order.payment_id || 'N/A'}</p>
                        </div>
                        
                        {order.shipping_address && (
                          <div className="col-span-2">
                            <h3 className="text-sm font-medium text-purple-400 mb-2">Shipping Address</h3>
                            <p className="text-sm">{order.shipping_address}</p>
                          </div>
                        )}
                        
                        {order.shipping_carrier && (
                          <div className="col-span-2">
                            <h3 className="text-sm font-medium text-purple-400 mb-2">Tracking Information</h3>
                            <p className="text-sm"><span className="text-gray-400">Carrier:</span> {order.shipping_carrier}</p>
                            <p className="text-sm"><span className="text-gray-400">Tracking Number:</span> {order.tracking_number}</p>
                            {order.tracking_url && (
                              <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">Track Package</a>
                            )}
                          </div>
                        )}
                        
                        <div className="col-span-2 mt-4">
                          <h3 className="text-sm font-medium text-purple-400 mb-2">Actions</h3>
                          <div className="flex flex-wrap gap-2">
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'processing')}
                                disabled={statusUpdateLoading === order.id}
                                className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors"
                              >
                                {statusUpdateLoading === order.id ? 'Updating...' : 'Start Processing'}
                              </button>
                            )}
                            
                            {order.status === 'processing' && (
                              <div className="w-full space-y-3">
                                <div className="grid grid-cols-3 gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Carrier (e.g., UPS)" 
                                    value={trackingInfo.carrier}
                                    onChange={(e) => setTrackingInfo({...trackingInfo, carrier: e.target.value})}
                                    className="col-span-3 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-md focus:outline-none focus:border-purple-400"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Tracking Number" 
                                    value={trackingInfo.tracking_number}
                                    onChange={(e) => setTrackingInfo({...trackingInfo, tracking_number: e.target.value})}
                                    className="col-span-2 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-md focus:outline-none focus:border-purple-400"
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Tracking URL (optional)" 
                                    value={trackingInfo.tracking_url}
                                    onChange={(e) => setTrackingInfo({...trackingInfo, tracking_url: e.target.value})}
                                    className="col-span-3 px-3 py-1 bg-purple-900/30 border border-purple-500/30 rounded-md focus:outline-none focus:border-purple-400"
                                  />
                                </div>
                                <button 
                                  onClick={() => handleTrackingSubmit(order.id)}
                                  disabled={!trackingInfo.carrier || !trackingInfo.tracking_number || statusUpdateLoading === order.id}
                                  className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-md hover:bg-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {statusUpdateLoading === order.id ? 'Updating...' : 'Mark as Shipped'}
                                </button>
                              </div>
                            )}
                            
                            {order.status === 'shipped' && (
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'delivered')}
                                disabled={statusUpdateLoading === order.id}
                                className="px-3 py-1 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors"
                              >
                                {statusUpdateLoading === order.id ? 'Updating...' : 'Mark as Delivered'}
                              </button>
                            )}
                            
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <button 
                                onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                                disabled={statusUpdateLoading === order.id}
                                className="px-3 py-1 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
                              >
                                {statusUpdateLoading === order.id ? 'Updating...' : 'Cancel Order'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Map View */}
        <div className="bg-purple-900/20 rounded-lg p-4 h-[600px]">
          <h3 className="text-sm font-medium text-purple-400 mb-2">Order Locations</h3>
          <Map
            initialViewState={{
              longitude: -100,
              latitude: 40,
              zoom: 3.5
            }}
            style={{ width: '100%', height: '90%', borderRadius: '0.5rem' }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
          >
            {orders.map((order) => (
              order.delivery_tracking?.location && (
                <Marker
                  key={order.id}
                  longitude={order.delivery_tracking.location.lng}
                  latitude={order.delivery_tracking.location.lat}
                >
                  <div className="text-purple-400">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                  </div>
                </Marker>
              )
            ))}
          </Map>
        </div>
      </div>
    </div>
  );
}