/**
 * Cấu hình base API và các helper functions cho việc gọi API
 */
import axios from 'axios';
import { checkServerStatus } from '../../utils/serverCheck';

// Base URL cho tất cả API requests
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Helper function để xử lý các API calls với xác thực
 * @param {string} endpoint - Endpoint API (không bao gồm base URL)
 * @param {Object} options - Fetch API options
 * @returns {Promise<any>} - Kết quả từ API
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
  // Kiểm tra xem server có hoạt động không
  try {
    const isServerRunning = await checkServerStatus();
    if (!isServerRunning) {
      throw new Error('Server is not running or not accessible. Please check your backend server.');
    }
  } catch (serverCheckError) {
    console.error('Server check failed:', serverCheckError);
    // Tiếp tục với request, nhưng đã có warning trong console
  }

  // Lấy token từ localStorage
  const token = localStorage.getItem('token');
  
  // Tạo headers mặc định với Content-Type
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Thêm Authorization header nếu có token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    // Fix: Pass the data directly instead of parsing it again
    const response = await axios({
      url: `${API_BASE_URL}${endpoint}`,
      method: options.method || 'GET',
      headers,
      data: options.body ? JSON.parse(options.body) : options.data,
      withCredentials: true, // Để đảm bảo cookies được gửi
      timeout: 10000 // 10 seconds timeout
    });
    
    return response;
  } catch (error) {
    if (error.response) {
      // Server trả về response với mã lỗi
      if (error.response.status === 401) {
        console.error('Unauthorized access, clearing authentication');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect đến trang login sau 500ms để đảm bảo console message được hiển thị
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
        
        return null;
      }
      
      // Trả lỗi từ API
      const apiError = new Error(error.response.data?.message || `API Error: ${error.response.status}`);
      apiError.statusCode = error.response.status;
      apiError.data = error.response.data;
      apiError.response = error.response;
      throw apiError;
    } 
    else if (error.request) {
      // Request được gửi nhưng không nhận được response
      console.error('No response received from server:', error.request);
      const networkError = new Error('Unable to connect to the server. Please check your internet connection or server status.');
      networkError.code = 'ERR_NETWORK';
      throw networkError;
    } 
    else {
      // Lỗi khi thiết lập request
      console.error('Error setting up request:', error.message);
      throw error;
    }
  }
};

/**
 * Object chứa các phương thức chuẩn để gọi API
 */
const api = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - API response
   */
  get: (endpoint) => authenticatedFetch(endpoint),
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} - API response
   */
  post: (endpoint, data) => authenticatedFetch(endpoint, {
    method: 'POST',
    data: data // Fixed: Pass data directly rather than via body
  }),
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} - API response
   */
  put: (endpoint, data) => authenticatedFetch(endpoint, {
    method: 'PUT',
    data: data // Fixed: Pass data directly rather than via body
  }),
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<any>} - API response
   */
  delete: (endpoint) => authenticatedFetch(endpoint, {
    method: 'DELETE'
  })
};

export default api;