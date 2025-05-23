import axios from 'axios';
import { isServerOnline, handleApiError } from '../utils/serverCheck';
import { logout } from './authService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api'; // Use variable from .env file

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Track server online status to avoid repeated checks
let isServerConfirmedOnline = false;

// Add a request interceptor
api.interceptors.request.use(
  async (config) => {
    // Only check server connectivity if we haven't confirmed it's online
    // or if it's a critical operation like login/register    
    const isAuthRequest = config.url && (config.url.includes('/auth/login') || 
                                        config.url.includes('/auth/register'));
    
    if (!isServerConfirmedOnline || isAuthRequest) {
      try {
        const online = await isServerOnline();
        if (online) {
          isServerConfirmedOnline = true;
        } else {
          console.warn('Server connectivity check failed');
          return Promise.reject(new Error('Server is not reachable'));
        }
      } catch (error) {
        console.error('Error checking server status:', error);
        return Promise.reject(new Error('Server is not reachable'));
      }
    }
    
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
    // Server is definitely online if we got a response
    isServerConfirmedOnline = true;
    return response;
  },
  (error) => {
    // If there's a network error, mark server as not confirmed online
    if (!error.response) {
      isServerConfirmedOnline = false;
    }
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      console.log('Session expired, please login again');
      logout();
      window.location.href = '/login?expired=true';
    }
    
    // Transform error to user-friendly message
    const errorMessage = handleApiError(error);
    error.userMessage = errorMessage;
    
    return Promise.reject(error);
  }
);

// Export the API instance
export default api;