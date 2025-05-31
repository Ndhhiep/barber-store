import axios from 'axios';
import { logout } from './authService';

// Always use localhost for development to avoid CORS issues
const API_URL = 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false // Disable sending cookies to prevent CORS preflight issues
});

// No need to track server status now
// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Add authorization header with JWT if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
api.interceptors.response.use(
  (response) => {
    // Return response directly
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      console.log('Session expired, please login again');
      logout();
      window.location.href = '/login?expired=true';
    }
    
    // Create user-friendly error message
    const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
    error.userMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

// Export the API instance
export default api;