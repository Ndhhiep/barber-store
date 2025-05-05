/**
 * Utility for checking server connectivity and providing feedback
 */

const API_URL = 'http://localhost:5000'; // Base API URL

/**
 * Check if the server is reachable
 * @returns {Promise<boolean>} - True if server is reachable
 */
export const isServerOnline = async () => {
  try {
    // Use fetch with timeout to check if server is reachable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/api`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Server connectivity check failed:', error);
    return false;
  }
};

/**
 * Show server connection error message
 * @param {Function} setError - Function to set error state
 * @param {string} customMessage - Optional custom error message
 */
export const showServerError = (setError, customMessage = null) => {
  const defaultMessage = 'Could not connect to the server. Please check your internet connection and try again.';
  setError(customMessage || defaultMessage);
};

/**
 * Handle API errors based on response status
 * @param {Error} error - Error object from API call
 * @returns {string} - User-friendly error message
 */
export const handleApiError = (error) => {
  if (!error.response) {
    // Network error or server not reachable
    return 'Could not connect to the server. Please check your internet connection.';
  }
  
  const { status } = error.response;
  
  switch (status) {
    case 401:
      return 'Your session has expired. Please login again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    default:
      return error.response.data?.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Check for server connectivity with a fallback UI update
 * @param {Function} onlineCallback - Function to call if server is online
 * @param {Function} offlineCallback - Function to call if server is offline
 */
export const checkServerWithFallback = async (onlineCallback, offlineCallback) => {
  const isOnline = await isServerOnline();
  
  if (isOnline) {
    onlineCallback();
  } else {
    offlineCallback();
  }
};

/**
 * Wait for specified delay
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} - Promise that resolves after delay
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to retry API calls with exponential backoff
 * @param {Function} apiCall - Function that makes the API call
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in ms
 * @returns {Promise<any>} - Result of the API call
 */
export const retryWithBackoff = async (apiCall, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;
      
      // If reached max retries or it's not a connection error, throw
      if (retries >= maxRetries || (error.response && error.response.status !== 0)) {
        throw error;
      }
      
      // Wait with exponential backoff using the extracted helper function
      await wait(delay);
      delay *= 2; // Exponential backoff
    }
  }
};

// Create the object before exporting it as default
const serverCheckUtils = {
  isServerOnline,
  showServerError,
  handleApiError,
  checkServerWithFallback,
  retryWithBackoff
};

export default serverCheckUtils;