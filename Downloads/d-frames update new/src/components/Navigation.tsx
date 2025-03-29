import React, { useState, useEffect, useCallback } from 'react';
import { Menu, X, Home, ChevronDown, Instagram, Music, User, Package, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import { validateEmail, validatePassword } from '../utils/validators';
import ErrorBoundary from './ErrorBoundary';
import LoadingSpinner from './LoadingSpinner';

interface NavigationProps {
  onOrderNow: () => void;
}

interface EmployeeInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Navigation({ onOrderNow }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSocial, setShowSocial] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setShowSocial(false);
    }
  };

  const toggleSocial = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSocial(!showSocial);
  };
  
  // Enhanced authentication check on component mount
  useEffect(() => {
    const verifyAuthentication = async () => {
      const storedEmployeeInfo = localStorage.getItem('employeeInfo');
      
      if (storedEmployeeInfo) {
        try {
          // Parse stored employee info
          const parsedInfo = JSON.parse(storedEmployeeInfo);
          
          // Set employee info from local storage immediately for fast UI rendering
          setEmployeeInfo(parsedInfo);
          
          // Verify with server that session is still valid
          try {
            const response = await fetch('http://localhost:4001/api/employees/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            credentials: 'include'
          });
          
            if (!response.ok) {
              // Session expired or invalid
              throw new Error('Session expired');
            }
            
            const data = await response.json();
            
            // Don't check for success flag as it might not be present
            if (!data.employee) {
              throw new Error('Invalid response format');
            }
          
            // Update employee info with latest from server
            localStorage.setItem('employeeInfo', JSON.stringify(data.employee));
            setEmployeeInfo(data.employee);
            
            console.log('Authentication verified successfully');
          } catch (error: unknown) {
            const fetchError = error as Error;
            console.error('Error verifying authentication:', fetchError);
            // Don't clear session on network errors - only on auth errors
            if (fetchError.message !== 'Failed to fetch') {
              localStorage.removeItem('employeeInfo');
              localStorage.removeItem('employeeToken');
              setEmployeeInfo(null);
            }
          }
        } catch (error) {
          console.error('Authentication verification error:', error);
          // Clear invalid session data
          localStorage.removeItem('employeeInfo');
          localStorage.removeItem('employeeToken');
          setEmployeeInfo(null);
        }
      }
    };
    
    verifyAuthentication();
  }, []);
  
  // Handle employee logout with better error handling
  
  // Enhanced employee logout with better error handling
  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:4001/api/employees/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
      
      // Clear employee info from localStorage
      localStorage.removeItem('employeeInfo');
      localStorage.removeItem('employeeToken');
      
      // Update state
      setEmployeeInfo(null);
      setIsOpen(false);
      
      // Redirect to home if on admin page
      if (window.location.pathname.includes('/admin')) {
        navigate('/');
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, clear local data
      localStorage.removeItem('employeeInfo');
      localStorage.removeItem('employeeToken');
      setEmployeeInfo(null);
      setIsOpen(false);
    }
  };
  
  // Navigate to orders dashboard
  const goToOrdersDashboard = () => {
    navigate('/admin/dashboard');
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 right-0 z-50 p-4">
      {/* Hamburger Menu Button */}
      <button
        onClick={toggleMenu}
        className="relative z-50 p-2 rounded-full bg-purple-600/20 backdrop-blur-sm hover:bg-purple-600/30 transition-all duration-300"
        aria-label="Toggle Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <Menu className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      >
        {/* Menu Content */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-sm bg-purple-950/90 shadow-xl transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8 pt-20">
            <ul className="space-y-6">
              <li>
                <a
                  href="#"
                  className="flex items-center gap-3 text-white hover:text-purple-400 transition-colors text-lg"
                >
                  <Home className="w-5 h-5" />
                  Home
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    onOrderNow();
                    setIsOpen(false);
                  }}
                  className="text-left w-full text-white hover:text-purple-400 transition-colors text-lg"
                >
                  Order Now
                </button>
              </li>
              <li>
                <a
                  href="#about"
                  className="text-white hover:text-purple-400 transition-colors text-lg"
                >
                  About
                </a>
              </li>
              
              <li className="relative pt-4 border-t border-purple-800">
                <button
                  onClick={toggleSocial}
                  className="flex items-center gap-2 text-white hover:text-purple-400 transition-colors text-lg font-semibold"
                >
                  Social Media
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showSocial ? 'rotate-180' : ''}`} />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 pb-2 ${
                    showSocial ? 'max-h-40 mt-4' : 'max-h-0 opacity-0'
                  }`}
                >
                  <ul className="pl-4 space-y-4">
                    <li>
                      <a
                        href="https://instagram.com/theeframestudio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-purple-300 hover:text-purple-400 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                        @theeframestudio
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://tiktok.com/@dframestudio"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-purple-300 hover:text-purple-400 transition-colors"
                      >
                        <Music className="w-5 h-5" />
                        @dframestudio
                      </a>
                    </li>
                  </ul>
                </div>
              </li>
              {/* Employee section - shows login or employee options */}
              {employeeInfo ? (
                <>
                  <li className="pt-2">
                    <div className="text-purple-300 text-sm mb-2">Employee: {employeeInfo.name}</div>
                  </li>
                  <li>
                    <button
                      onClick={goToOrdersDashboard}
                      className="flex items-center gap-3 text-white hover:text-purple-400 transition-colors text-lg"
                    >
                      <Package className="w-5 h-5" />
                      Track Orders
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-white hover:text-purple-400 transition-colors text-lg"
                    >
                      <LogOut className="w-5 h-5" />
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <li className="pt-2">
                  <a
                    href="/admin"
                    className="flex items-center gap-3 text-white hover:text-purple-400 transition-colors text-lg"
                  >
                    <User className="w-5 h-5" />
                    Admin Section
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      

    </nav>
  );
}