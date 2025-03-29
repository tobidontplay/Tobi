import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import { AlertCircle, Database, FileSpreadsheet, RefreshCw, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../LoadingSpinner';

// Types for the component
interface EmailError {
  id: string;
  timestamp: string;
  error_type: string;
  error_message: string;
  attempted_action: string;
  email_id?: string;
  resolved: boolean;
}

interface DatabaseStatus {
  status: 'connected' | 'disconnected' | 'degraded';
  latency: number;
  lastChecked: string;
  errorCount: number;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

interface TimeSeriesData {
  time: string;
  errors: number;
  successful: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  region: string;
  product: string;
}

const AnalyticsDashboard: React.FC = () => {
  // States for email errors, stats and database status
  const [emailErrors, setEmailErrors] = useState<EmailError[]>([]);
  const [filteredErrors, setFilteredErrors] = useState<EmailError[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [errorTypeData, setErrorTypeData] = useState<ChartData[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    status: 'connected',
    latency: 0,
    lastChecked: new Date().toISOString(),
    errorCount: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [usingFallback, setUsingFallback] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [realTimeUpdates, setRealTimeUpdates] = useState<boolean>(true);

  // Sales data states
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [salesTimeRange, setSalesTimeRange] = useState<string>('30d');
  const [salesRegionFilter, setSalesRegionFilter] = useState<string>('all');
  const [salesCategoryFilter, setSalesCategoryFilter] = useState<string>('all');
  const [topProducts, setTopProducts] = useState<ChartData[]>([]);
  const [regionalSales, setRegionalSales] = useState<ChartData[]>([]);
  
  // Reference for Excel file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Subscription for real-time updates
  const subscriptionRef = useRef<any>(null);

  // Colors for charts
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
  
  // Initial data fetch
  useEffect(() => {
    // Try to fetch data from Supabase
    fetchEmailErrors().catch(() => {
      // If fetching from Supabase fails, fall back to sample data
      loadSampleData();
    });
    checkDatabaseStatus();
    fetchSalesData();
    
    // Set up interval for real-time database status checks
    const intervalId = setInterval(() => {
      if (realTimeUpdates) {
        checkDatabaseStatus();
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(intervalId);
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [realTimeUpdates]);

  // Fetch sales data
  const fetchSalesData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales_analytics')
        .select('*')
        .order('sale_date', { ascending: false });

      if (error) throw error;

      if (data) {
        setSalesData(data);
        processSalesData(data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Process sales data for charts
  const processSalesData = (data: SalesData[]) => {
    // Process top products
    const productSales: Record<string, number> = {};
    data.forEach(sale => {
      if (productSales[sale.product]) {
        productSales[sale.product] += sale.revenue;
      } else {
        productSales[sale.product] = sale.revenue;
      }
    });

    const topProductsData = Object.keys(productSales)
      .map(product => ({
        name: product,
        value: productSales[product],
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    setTopProducts(topProductsData);

    // Process regional sales
    const regionalSalesData: Record<string, number> = {};
    data.forEach(sale => {
      if (regionalSalesData[sale.region]) {
        regionalSalesData[sale.region] += sale.revenue;
      } else {
        regionalSalesData[sale.region] = sale.revenue;
      }
    });

    const regionalSalesChartData = Object.keys(regionalSalesData).map(region => ({
      name: region,
      value: regionalSalesData[region],
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));

    setRegionalSales(regionalSalesChartData);
  };
  
  // Effect for filtering errors based on selected filter
  useEffect(() => {
    if (emailErrors.length > 0) {
      filterErrors();
    }
  }, [filter, emailErrors, timeRange]);
  
  // Effect for setting up real-time subscriptions
  useEffect(() => {
    if (realTimeUpdates && !usingFallback) {
      setupRealTimeSubscription();
    } else if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
  }, [realTimeUpdates, usingFallback]);
  
  // Function to check database status
  const checkDatabaseStatus = async () => {
    try {
      const startTime = performance.now();
      const { error } = await supabase.from('email_errors').select('count');
      const endTime = performance.now();
      
      if (error) {
        setDbStatus({
          status: 'disconnected',
          latency: 0,
          lastChecked: new Date().toISOString(),
          errorCount: dbStatus.errorCount + 1
        });
        console.error('Database connection error:', error);
        
        // Switch to fallback if we have multiple errors
        if (dbStatus.errorCount >= 2 && !usingFallback) {
          setUsingFallback(true);
          loadFallbackData();
        }
      } else {
        setDbStatus({
          status: 'connected',
          latency: Math.round(endTime - startTime),
          lastChecked: new Date().toISOString(),
          errorCount: 0
        });
        
        // If we were using fallback but DB is now available, switch back
        if (usingFallback) {
          setUsingFallback(false);
          fetchEmailErrors();
        }
      }
    } catch (error) {
      console.error('Error checking database status:', error);
      setDbStatus({
        status: 'disconnected',
        latency: 0,
        lastChecked: new Date().toISOString(),
        errorCount: dbStatus.errorCount + 1
      });
      
      // Switch to fallback if needed
      if (dbStatus.errorCount >= 2 && !usingFallback) {
        setUsingFallback(true);
        loadFallbackData();
      }
    }
  };
  
  // Load sample data for demonstration
  const loadSampleData = () => {
    setIsLoading(true);
    
    // Create sample error data
    const sampleData: EmailError[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        error_type: 'network_error',
        error_message: 'Failed to connect to mail server',
        attempted_action: 'fetch_new_emails',
        resolved: false
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        error_type: 'auth_error',
        error_message: 'Invalid credentials',
        attempted_action: 'authenticate',
        resolved: true
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hours ago
        error_type: 'timeout_error',
        error_message: 'Operation timed out',
        attempted_action: 'fetch_email_body',
        email_id: '123e4567-e89b-12d3-a456-426614174000',
        resolved: false
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hours ago
        error_type: 'parse_error',
        error_message: 'Failed to parse email content',
        attempted_action: 'process_email',
        email_id: '123e4567-e89b-12d3-a456-426614174001',
        resolved: false
      },
      {
        id: '5',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(), // 5 hours ago
        error_type: 'network_error',
        error_message: 'Connection reset by peer',
        attempted_action: 'fetch_new_emails',
        resolved: true
      },
      {
        id: '6',
        timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), // 6 hours ago
        error_type: 'storage_error',
        error_message: 'Failed to save attachment',
        attempted_action: 'save_attachment',
        email_id: '123e4567-e89b-12d3-a456-426614174002',
        resolved: false
      },
      {
        id: '7',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        error_type: 'auth_error',
        error_message: 'Token expired',
        attempted_action: 'refresh_token',
        resolved: true
      },
      {
        id: '8',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
        error_type: 'network_error',
        error_message: 'DNS resolution failed',
        attempted_action: 'connect_to_server',
        resolved: false
      },
      {
        id: '9',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(), // 16 hours ago
        error_type: 'timeout_error',
        error_message: 'SMTP timeout',
        attempted_action: 'send_email',
        resolved: true
      },
      {
        id: '10',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), // 20 hours ago
        error_type: 'parse_error',
        error_message: 'Invalid email format',
        attempted_action: 'validate_email',
        resolved: false
      },
      {
        id: '11',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 24 hours ago
        error_type: 'network_error',
        error_message: 'TLS handshake failed',
        attempted_action: 'secure_connection',
        resolved: false
      },
      {
        id: '12',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 36 hours ago
        error_type: 'auth_error',
        error_message: 'Permission denied',
        attempted_action: 'access_folder',
        resolved: true
      }
    ];
    
    // Store in localStorage for persistence
    localStorage.setItem('email_errors_cache', JSON.stringify(sampleData));
    
    // Update state with sample data
    setEmailErrors(sampleData);
    processChartData(sampleData);
    setIsLoading(false);
  };

  // Setup real-time subscription to email errors
  const setupRealTimeSubscription = () => {
    // Clean up existing subscription if any
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }
    
    // Create new subscription
    subscriptionRef.current = supabase
      .channel('email-errors-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'email_errors' }, 
        payload => {
          console.log('Real-time update received:', payload);
          fetchEmailErrors(); // Refresh data when changes occur
        }
      )
      .subscribe();
  };
  
  // Fetch email errors from Supabase
  const fetchEmailErrors = async () => {
    setIsLoading(true);
    try {
      // Get time range filter
      const rangeLimit = getTimeRangeLimit();
      
      // Query with time range
      const { data, error } = await supabase
        .from('email_errors')
        .select('*')
        .gt('timestamp', rangeLimit)
        .order('timestamp', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setEmailErrors(data);
        processChartData(data);
      } else {
        setEmailErrors([]);
      }
    } catch (error) {
      console.error('Error fetching email errors:', error);
      // If fetch fails, try to use fallback
      if (!usingFallback) {
        setUsingFallback(true);
        loadFallbackData();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get timestamp for time range filter
  const getTimeRangeLimit = (): string => {
    const now = new Date();
    let rangeDate = new Date();
    
    switch (timeRange) {
      case '24h':
        rangeDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        rangeDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        rangeDate.setDate(now.getDate() - 30);
        break;
      default:
        rangeDate.setHours(now.getHours() - 24);
    }
    
    return rangeDate.toISOString();
  };
  
  // Process data for charts
  const processChartData = (data: EmailError[]) => {
    // Process error types for pie chart
    const errorTypes: Record<string, number> = {};
    data.forEach(error => {
      if (errorTypes[error.error_type]) {
        errorTypes[error.error_type]++;
      } else {
        errorTypes[error.error_type] = 1;
      }
    });
    
    const errorTypeChartData: ChartData[] = Object.keys(errorTypes).map((type, index) => ({
      name: type,
      value: errorTypes[type],
      color: COLORS[index % COLORS.length]
    }));
    
    setErrorTypeData(errorTypeChartData);
    
    // Process time series data
    const timeMap: Record<string, { errors: number, successful: number }> = {};
    const now = new Date();
    const rangeHours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
    const interval = timeRange === '24h' ? 1 : timeRange === '7d' ? 6 : 24; // Hours per interval
    
    // Initialize time intervals
    for (let i = 0; i < rangeHours; i += interval) {
      const time = new Date(now);
      time.setHours(now.getHours() - (rangeHours - i));
      const timeKey = formatTimeKey(time, timeRange);
      
      if (!timeMap[timeKey]) {
        timeMap[timeKey] = { errors: 0, successful: 0 };
      }
    }
    
    // Count errors by time interval
    data.forEach(error => {
      const errorTime = new Date(error.timestamp);
      const timeKey = formatTimeKey(errorTime, timeRange);
      
      if (timeMap[timeKey]) {
        timeMap[timeKey].errors++;
      }
    });
    
    // Transform to array for chart
    const timeSeriesArray = Object.keys(timeMap).map(time => ({
      time,
      errors: timeMap[time].errors,
      successful: timeMap[time].successful
    }));
    
    setTimeSeriesData(timeSeriesArray.sort((a, b) => {
      return a.time.localeCompare(b.time);
    }));
  };
  
  // Format time key based on selected time range
  const formatTimeKey = (date: Date, range: string): string => {
    if (range === '24h') {
      return `${date.getHours()}:00`;
    } else if (range === '7d') {
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:00`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };
  
  // Filter errors based on selected filter
  const filterErrors = () => {
    let filtered = [...emailErrors];
    
    // Apply error type filter if not 'all'
    if (filter !== 'all') {
      filtered = filtered.filter(error => error.error_type === filter);
    }
    
    setFilteredErrors(filtered);
  };
  
  // Export data to Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredErrors);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Email Errors");
    
    // Generate file name with current date
    const fileName = `email_errors_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    // Write and download
    XLSX.writeFile(workbook, fileName);
  };
  
  // Load fallback data from Excel file
  const loadFallbackData = () => {
    // Check if there's cached data in localStorage
    const cachedData = localStorage.getItem('email_errors_cache');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setEmailErrors(parsed);
        processChartData(parsed);
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing cached data:', error);
        // If cache fails, prompt for Excel upload
        promptExcelUpload();
      }
    } else {
      // No cache, prompt for Excel upload
      promptExcelUpload();
    }
  };
  
  // Prompt for Excel upload
  const promptExcelUpload = () => {
    // Show UI indicator that we need Excel data
    setIsLoading(false);
    
    // User will need to click the upload button
    // Which triggers the file input
  };
  
  // Handle Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsLoading(true);
    const file = e.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const data = event.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Assume first sheet contains the data
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Store in localStorage for cache
          localStorage.setItem('email_errors_cache', JSON.stringify(jsonData));
          
          // Update state
          setEmailErrors(jsonData as EmailError[]);
          processChartData(jsonData as EmailError[]);
        } catch (error) {
          console.error('Error processing Excel file:', error);
          alert('Error processing the Excel file. Please check the format and try again.');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.onerror = () => {
        console.error('Error reading file');
        setIsLoading(false);
        alert('Error reading the file. Please try again.');
      };
      
      reader.readAsBinaryString(file);
    } else {
      setIsLoading(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    if (usingFallback) {
      loadFallbackData();
    } else {
      fetchEmailErrors();
      checkDatabaseStatus();
    }
  };
  
  // Render database status badge
  const renderDatabaseStatus = () => {
    const statusColors = {
      connected: 'bg-green-500',
      degraded: 'bg-yellow-500',
      disconnected: 'bg-red-500'
    };
    
    return (
      <div className="flex items-center">
        <div className={`${statusColors[dbStatus.status]} h-3 w-3 rounded-full mr-2`}></div>
        <span className="font-medium">{dbStatus.status === 'connected' ? 'Supabase Online' : dbStatus.status === 'degraded' ? 'Supabase Degraded' : 'Supabase Offline'}</span>
        {dbStatus.status === 'connected' && (
          <span className="ml-2 text-sm text-gray-400">{dbStatus.latency}ms</span>
        )}
        {usingFallback && (
          <span className="ml-3 text-yellow-500 text-sm font-medium">Using Excel Fallback</span>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <div className="flex items-center space-x-4">
          {renderDatabaseStatus()}
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Controls and Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Error Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Errors</option>
              {errorTypeData.map(type => (
                <option key={type.name} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <label className="block text-sm text-gray-400 mr-2">Real-time Updates</label>
            <div
              className={`relative w-10 h-5 transition-colors duration-200 ease-in-out rounded-full ${realTimeUpdates ? 'bg-purple-600' : 'bg-gray-600'}`}
              onClick={() => setRealTimeUpdates(!realTimeUpdates)}
            >
              <div
                className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${realTimeUpdates ? 'transform translate-x-5' : ''}`}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Excel Fallback Controls */}
          {usingFallback ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-md text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Upload Excel Backup
            </button>
          ) : (
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          )}
          <input 
            type="file" 
            ref={fileInputRef}
            accept=".xlsx, .xls" 
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Error Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-600/20 mr-4">
                  <AlertCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Errors</p>
                  <h3 className="text-2xl font-bold">{filteredErrors.length}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-600/20 mr-4">
                  <Database className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Database Status</p>
                  <h3 className="text-xl font-bold flex items-center">
                    <span className={`h-3 w-3 rounded-full mr-2 ${
                      dbStatus.status === 'connected' ? 'bg-green-500' : 
                      dbStatus.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></span>
                    {dbStatus.status.charAt(0).toUpperCase() + dbStatus.status.slice(1)}
                  </h3>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-purple-600/20 mr-4">
                  <FileSpreadsheet className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Data Source</p>
                  <h3 className="text-xl font-bold">{usingFallback ? 'Excel Fallback' : 'Supabase DB'}</h3>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Series Chart */}
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <h2 className="text-lg font-bold mb-4">Error Trends</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={timeSeriesData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#444' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="errors" 
                      stroke="#ff5252" 
                      activeDot={{ r: 8 }} 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="successful" 
                      stroke="#4caf50"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Error Type Distribution */}
            <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
              <h2 className="text-lg font-bold mb-4">Error Type Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={errorTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {errorTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#444' }}
                      labelStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Error List */}
          <div className="bg-purple-900/20 rounded-lg p-6 border border-purple-500/30">
            <h2 className="text-lg font-bold mb-4">Recent Email Errors</h2>
            
            {filteredErrors.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No errors found for the selected filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Error Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredErrors.slice(0, 10).map((error) => (
                      <tr key={error.id} className="hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(error.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            error.error_type.includes('network') ? 'bg-red-900 text-red-200' :
                            error.error_type.includes('auth') ? 'bg-yellow-900 text-yellow-200' :
                            'bg-blue-900 text-blue-200'
                          }`}>
                            {error.error_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {error.error_message}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {error.attempted_action}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            error.resolved ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                          }`}>
                            {error.resolved ? 'Resolved' : 'Unresolved'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredErrors.length > 10 && (
                  <div className="mt-4 text-center text-sm text-gray-400">
                    Showing 10 of {filteredErrors.length} errors
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
