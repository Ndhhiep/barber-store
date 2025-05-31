/**
 * Configuration for API endpoints and common utility functions related to API
 */

// Determine if we're running in production
export const IS_PRODUCTION = window.location.hostname !== 'localhost';

// Default API URL - Always use localhost:5000 when running locally
export const API_URL = 'http://localhost:5000/api';

// Log API URL at startup
console.log('API Configuration:', {
  environment: process.env.NODE_ENV,
  isProduction: IS_PRODUCTION,
  apiUrl: API_URL
});

// Default API request configuration
export const API_CONFIG = {
  withCredentials: false, // Disable credentials to avoid CORS issues
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
};

// Helper to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper to create a full request config with auth
export const getRequestConfig = (additionalConfig = {}) => {
  return {
    ...API_CONFIG,
    headers: {
      ...API_CONFIG.headers,
      ...getAuthHeaders(),
      ...additionalConfig.headers
    },
    ...additionalConfig
  };
};
