import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Settings, 
  LogOut,
  ChevronDown,
  BarChart4,
  Truck,
  DollarSign,
  Home,
  Mail,
  AlertTriangle
} from 'lucide-react';
import OrdersView from './OrdersView';
import EmailManagement from './EmailManagement';
import AnalyticsDashboard from './AnalyticsDashboard';
import { supabase } from '../../lib/supabase';

interface EmployeeInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface DashboardProps {
  session?: any;
  onLogout?: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ session, onLogout }) => {
  const [activeView, setActiveView] = useState<string>('orders');
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    // If session is provided (employee portal), use it
    if (session) {
      setEmployeeInfo({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || 'Employee',
        email: session.user.email,
        role: session.user.user_metadata?.role || 'staff'
      });
      setIsLoading(false);
    } else {
      // Otherwise use the default admin flow
      const storedInfo = localStorage.getItem('employeeInfo');
      if (!storedInfo) {
        navigate('/admin/login');
        return;
      }

      try {
        const parsedInfo = JSON.parse(storedInfo) as EmployeeInfo;
        setEmployeeInfo(parsedInfo);
        
        // Verify token is still valid by fetching profile
        fetchEmployeeProfile();
      } catch (error) {
        console.error('Error parsing employee info:', error);
        handleLogout();
      }
    }
    
    // Check Supabase connection status
    checkDatabaseStatus();
    
    // Set up interval to periodically check database status
    const intervalId = setInterval(checkDatabaseStatus, 60000); // Check every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, [navigate]);

  // Check Supabase connection status
  const checkDatabaseStatus = async () => {
    setDbStatus('checking');
    try {
      const { error } = await supabase.from('emails').select('count');
      
      if (error) {
        console.error('Database connection error:', error);
        setDbStatus('offline');
      } else {
        setDbStatus('online');
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      setDbStatus('offline');
    }
  };

  const fetchEmployeeProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:4001/api/employees/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });

      if (!response.ok) {
        throw new Error('Session expired or invalid');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Authentication error:', error);
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        // If onLogout is provided, use it (for employee portal)
        await onLogout();
      } else {
        // Otherwise use the default admin logout flow
        await fetch('http://localhost:4001/api/employees/logout', {
          method: 'POST',
          credentials: 'include',
        });
        localStorage.removeItem('employeeInfo');
        navigate('/admin/login');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  const goToMainSite = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-900 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-bold">D-Frames Admin</h1>
          <p className="text-sm text-gray-400">Order Management System</p>
          <div className="flex items-center mt-1">
            <div className={`h-2 w-2 rounded-full mr-2 ${dbStatus === 'online' ? 'bg-green-500' : dbStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
            <span className="text-xs text-gray-400">
              {dbStatus === 'online' ? 'Database Online' : dbStatus === 'offline' ? 'Database Offline' : 'Checking Database'}
            </span>
            {dbStatus === 'offline' && (
              <AlertTriangle className="w-3 h-3 text-yellow-500 ml-1" />
            )}
          </div>
          <button 
            onClick={goToMainSite}
            className="mt-2 flex items-center text-sm text-purple-400 hover:text-purple-300"
          >
            <Home className="w-4 h-4 mr-1" /> Back to Main Site
          </button>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeView === 'dashboard' ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
              >
                <LayoutDashboard className="w-5 h-5 mr-3" />
                Dashboard
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveView('orders')}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeView === 'orders' ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
              >
                <Package className="w-5 h-5 mr-3" />
                Orders
              </button>
            </li>
            {(employeeInfo?.role === 'admin' || employeeInfo?.role === 'manager') && (
              <li>
                <button
                  onClick={() => setActiveView('emails')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeView === 'emails' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Emails
                </button>
              </li>
            )}
            {(employeeInfo?.role === 'admin' || employeeInfo?.role === 'manager') && (
              <li>
                <button
                  onClick={() => setActiveView('analytics')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeView === 'analytics' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                >
                  <BarChart4 className="w-5 h-5 mr-3" />
                  Analytics
                </button>
              </li>
            )}
            {employeeInfo?.role === 'admin' && (
              <li>
                <button
                  onClick={() => setActiveView('employees')}
                  className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                    activeView === 'employees' ? 'bg-purple-600' : 'hover:bg-gray-700'
                  }`}
                >
                  <Users className="w-5 h-5 mr-3" />
                  Employees
                </button>
              </li>
            )}
            <li>
              <button
                onClick={() => setActiveView('settings')}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeView === 'settings' ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
              >
                <Settings className="w-5 h-5 mr-3" />
                Settings
              </button>
            </li>
          </ul>
        </nav>

        <div className="mt-auto">
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center mr-3">
                {employeeInfo?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{employeeInfo?.name}</p>
                <p className="text-xs text-gray-400 truncate">{employeeInfo?.role}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeView === 'dashboard' && (
          <div className="p-6 space-y-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-600/20 mr-4">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pending Orders</p>
                    <h3 className="text-2xl font-bold">24</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-600/20 mr-4">
                    <Truck className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Shipped Orders</p>
                    <h3 className="text-2xl font-bold">12</h3>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-600/20 mr-4">
                    <DollarSign className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Revenue</p>
                    <h3 className="text-2xl font-bold">$4,320</h3>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-blue-500/20 mr-3">
                    <Package className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm">Order #12345 status changed to <span className="text-blue-400">Shipped</span></p>
                    <p className="text-xs text-gray-400">2 hours ago by {employeeInfo?.name}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-green-500/20 mr-3">
                    <Package className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm">Order #12342 status changed to <span className="text-green-400">Delivered</span></p>
                    <p className="text-xs text-gray-400">5 hours ago by Sarah</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="p-2 rounded-full bg-yellow-500/20 mr-3">
                    <Package className="w-4 h-4 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm">New order #12349 received</p>
                    <p className="text-xs text-gray-400">Yesterday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeView === 'orders' && <OrdersView />}
        
        {activeView === 'emails' && <EmailManagement />}
        {activeView === 'analytics' && <AnalyticsDashboard />}
        
        {activeView === 'employees' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Employee Management</h1>
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <p className="text-center text-gray-400">Employee management interface will be displayed here</p>
            </div>
          </div>
        )}
        
        {activeView === 'settings' && (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <p className="text-center text-gray-400">Settings interface will be displayed here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
