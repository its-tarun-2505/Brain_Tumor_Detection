import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create auth context
const AuthContext = createContext();

// API base URL - explicitly use the full URL instead of relying on proxy
const API_BASE_URL = 'http://localhost:5000';

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptors for authentication
  useEffect(() => {
    // Request interceptor to add token to headers
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Get the current token from localStorage to ensure latest token is used
        const currentToken = localStorage.getItem('token');
        
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        // If the URL doesn't include http/https, prepend the base URL
        if (config.url && !config.url.startsWith('http')) {
          config.url = `${API_BASE_URL}${config.url}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle authentication errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response && error.response.status === 401) {
          // Unauthorized - clear auth state
          console.log('Unauthorized access, logging out');
          logout();
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on component unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          // Validate token by getting user profile
          const response = await axios.get(`${API_BASE_URL}/api/dashboard/user-profile`);
          setCurrentUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          // If token is invalid, clear auth state
          console.error('Token validation error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Login user
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const { token, user } = response.data;
      setToken(token);
      setCurrentUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Signup function
  const signup = async (userData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
      return { 
        success: true, 
        userId: response.data.userId 
      };
    } catch (error) {
      console.error('Signup error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP function
  const verifyOTP = async (userId, otp) => {
    try {
      console.log(`Verifying OTP for user ${userId}:`, { userId, otp });
      const response = await axios.post(`${API_BASE_URL}/api/auth/verify-otp`, { userId, otp });
      console.log('OTP verification response:', response.data);
      
      // Save token and set authenticated state
      const { token, user } = response.data;
      
      if (!token) {
        console.error('No token received from server');
        return {
          success: false,
          error: 'Authentication failed: No token received'
        };
      }
      
      // Save token
      localStorage.setItem('token', token);
      setToken(token);
      
      // Set user data directly from response if available
      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        // Otherwise fetch user data
        try {
          const userResponse = await axios.get(`${API_BASE_URL}/api/dashboard/user-profile`);
          setCurrentUser(userResponse.data);
          setIsAuthenticated(true);
          return { success: true };
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          // Still return success as verification was successful
          setIsAuthenticated(true);
          return { success: true };
        }
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'OTP verification failed'
      };
    }
  };

  // Resend OTP function
  const resendOTP = async (userId, type = 'signup') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/resend-otp`, { 
        userId, 
        type 
      });
      return { 
        success: true,
        email: response.data.email
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to resend OTP'
      };
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      return { 
        success: true, 
        userId: response.data.userId 
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to send reset email'
      };
    }
  };

  // Reset password function
  const resetPassword = async (userId, otp, newPassword) => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, { 
        userId, 
        otp, 
        newPassword 
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Password reset failed'
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Context value
  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    signup,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 