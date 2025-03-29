import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  message: string;
  employee: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}

const EmployeeLogin: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:4001/api/employees/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const loginData = data as LoginResponse;
      
      // Store employee info in localStorage (but not the token, which is in the cookie)
      localStorage.setItem('employeeInfo', JSON.stringify({
        id: loginData.employee.id,
        name: loginData.employee.name,
        email: loginData.employee.email,
        role: loginData.employee.role,
      }));

      // Redirect to dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-950">
      <div className="bg-gray-900 p-8 rounded-lg shadow-md w-full max-w-md border border-purple-700">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">D-Frames Admin Portal</h1>
          <p className="text-purple-300 mt-2">Log in to access the employee dashboard</p>
          <p className="text-purple-400 mt-4"><a href="/" className="hover:text-purple-200 underline transition-colors">← Back to main site</a></p>
        </div>

        {error && (
          <div className="bg-red-900/30 text-red-300 p-4 rounded-md mb-6 border border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium text-purple-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-purple-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white"
              placeholder="your.email@dframes.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-purple-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-800 border border-purple-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-purple-400" />
                ) : (
                  <Eye className="h-5 w-5 text-purple-400" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              <span className="flex items-center">
                <LogIn className="h-5 w-5 mr-2" />
                Log In
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EmployeeLogin;
