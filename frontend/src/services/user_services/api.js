/**
 * Cấu hình base API và các helper functions cho việc gọi API
 */

// Base URL cho tất cả API requests
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Helper function để xử lý các API calls với xác thực
 * @param {string} endpoint - Endpoint API (không bao gồm base URL)
 * @param {Object} options - Fetch API options
 * @returns {Promise<any>} - Kết quả từ API
 */
export const authenticatedFetch = async (endpoint, options = {}) => {
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
    // Thực hiện request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include' // Để đảm bảo cookies được gửi
    });
    
    // Kiểm tra lỗi xác thực (401)
    if (response.status === 401) {
      console.error('Unauthorized access, clearing authentication');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect đến trang login sau 500ms để đảm bảo console message được hiển thị
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
      
      return null;
    }
    

    // Kiểm tra content type
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      console.warn('Response is not JSON:', data);
      // Nếu không phải JSON, trả về text như là data
      return {
        success: response.ok,
        data,
        statusCode: response.status
      };
    }
    
    // Nếu response không ok, throw error với message từ API
    if (!response.ok) {
      const error = new Error(data.message || `API Error: ${response.status}`);
      error.statusCode = response.status;
      error.data = data;
      throw error;
    }
    
    // Trả về dữ liệu từ API
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
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
    body: JSON.stringify(data)
  }),
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<any>} - API response
   */
  put: (endpoint, data) => authenticatedFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data)
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