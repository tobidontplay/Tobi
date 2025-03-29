import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Dashboard from '../components/admin/Dashboard';
import Login from '../components/admin/Login';
import EmployeePortalLanding from '../components/EmployeePortalLanding';

const EmployeePortal: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
      
      // Set up auth state change listener
      const { data: { subscription } } = await supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session);
        }
      );
      
      return () => subscription.unsubscribe();
    };
    
    checkSession();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      setSession(data.session);
      navigate('/employee-portal/dashboard');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setSession(null);
      navigate('/employee-portal');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // Use Routes to handle different paths within the employee portal
  return (
    <Routes>
      <Route path="/" element={<EmployeePortalLanding />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route 
        path="/dashboard/*" 
        element={
          session ? (
            <Dashboard session={session} onLogout={handleLogout} />
          ) : (
            // Redirect to login if no session
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
              <div className="bg-red-900/30 border border-red-500/30 p-6 rounded-lg max-w-md w-full text-center">
                <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
                <p className="text-gray-300 mb-4">You must be logged in to access the dashboard.</p>
                <button
                  onClick={() => navigate('/employee-portal/login')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                >
                  Go to Login
                </button>
              </div>
            </div>
          )
        } 
      />
    </Routes>
  );
};

export default EmployeePortal;
