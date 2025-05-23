import axios from 'axios';
import staffAuthService from './staffAuthService';

// Use environment variable from .env file
const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token to each request
api.interceptors.request.use(
  (config) => {
    const authHeader = staffAuthService.authHeader();
    if (authHeader.Authorization) {
      config.headers.Authorization = authHeader.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle HTTP error codes
    if (error.response) {
      // Expired or invalid token
      if (error.response.status === 401) {
        // Add logic to log out user if needed
        console.log('Session expired, please login again');
        staffAuthService.staffLogout();
      }
      
      return Promise.reject(error.response.data || { message: 'Server error' });
    }
    
    return Promise.reject({ message: 'Network error. Please check your connection.' });
  }
);

// Utility functions to call API
const apiService = {
  // GET method
  get: async (endpoint, params = {}) => {
    try {
      return await api.get(endpoint, { params });
    } catch (error) {
      throw error;
    }
  },

  // POST method
  post: async (endpoint, data = {}) => {
    try {
      return await api.post(endpoint, data);
    } catch (error) {
      throw error;
    }
  },

  // PUT method
  put: async (endpoint, data = {}) => {
    try {
      return await api.put(endpoint, data);
    } catch (error) {
      throw error;
    }
  },

  // DELETE method
  delete: async (endpoint) => {
    try {
      return await api.delete(endpoint);
    } catch (error) {
      throw error;
    }
  },

  // Get API URL
  getApiUrl: () => API_URL
};

export default apiService;