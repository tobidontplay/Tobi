import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, BarChart4, Package, Mail } from 'lucide-react';

const EmployeePortalLanding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 py-6">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">D-Frames Employee Portal</h1>
              <p className="text-sm text-gray-400">Secure Administrative Access</p>
            </div>
            <div>
              <Link 
                to="/"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Back to Main Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-purple-600/20 rounded-full mb-4">
              <Shield className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome to the Secure Employee Portal</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              This dedicated portal provides D-Frames employees with secure access to administrative tools, analytics, and customer management systems.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-600/20 rounded-md mr-4">
                  <Lock className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Secure Access</h3>
              </div>
              <p className="text-gray-400">
                This portal is completely separate from our customer-facing website, providing enhanced security for sensitive company data and operations.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-600/20 rounded-md mr-4">
                  <BarChart4 className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Real-time Analytics</h3>
              </div>
              <p className="text-gray-400">
                Access comprehensive dashboards with real-time data on sales, customer engagement, and business performance metrics.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-600/20 rounded-md mr-4">
                  <Package className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Order Management</h3>
              </div>
              <p className="text-gray-400">
                View, process, and track customer orders in real-time. Update order status and manage shipping information from a centralized interface.
              </p>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 border border-purple-500/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-purple-600/20 rounded-md mr-4">
                  <Mail className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold">Email Management</h3>
              </div>
              <p className="text-gray-400">
                Access our centralized email system with encrypted storage and comprehensive organization tools for customer communications.
              </p>
            </div>
          </div>

          {/* Login Button */}
          <div className="text-center">
            <Link
              to="/employee-portal/login"
              className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-md font-medium text-lg transition-colors duration-200"
            >
              Employee Login
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Access restricted to authorized D-Frames personnel only
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 py-8 mt-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 D-Frames Studios. All rights reserved.</p>
            <p className="text-sm mt-2">This is a secure system. Unauthorized access is prohibited.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EmployeePortalLanding;
