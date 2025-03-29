import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import EmployeeLogin from '../components/admin/EmployeeLogin';
import Dashboard from '../components/admin/Dashboard';
import OrdersView from '../components/admin/OrdersView';
import { useEffect, useState } from 'react';

// Protected route component that checks if user is authenticated
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Check if employee info exists in localStorage
    const employeeInfo = localStorage.getItem('employeeInfo');
    setIsAuthenticated(!!employeeInfo);
  }, []);

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Render children if authenticated
  return children;
};

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<EmployeeLogin />} />
      <Route 
        path="/dashboard/*" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/orders" 
        element={
          <ProtectedRoute>
            <OrdersView />
          </ProtectedRoute>
        } 
      />
      <Route
        path="/portal/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
