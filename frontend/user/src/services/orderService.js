/**
 * Service quản lý các API liên quan đến đơn hàng
 */
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api'; // Use variable from .env file

// Helper function to get auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại
 * @returns {Promise<Object>} - Danh sách đơn hàng
 */
export const getMyOrders = async () => {
  try {
    const response = await axios.get(`${API_URL}/orders/user/my-orders`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Get my orders error:', error);
    
    // Enhanced error handling
    const errorMessage = error.response?.data?.message 
      || (error.response ? `Server responded with status: ${error.response.status}` : error.message)
      || 'Failed to fetch orders';
    
    throw new Error(errorMessage);
  }
};

/**
 * Lấy thông tin chi tiết đơn hàng theo ID
 * @param {string} id - ID của đơn hàng
 * @returns {Promise<Object>} - Chi tiết đơn hàng
 */
export const getOrderById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error(`Get order ${id} error:`, error);
    
    // Enhanced error handling with more detailed information
    const errorMessage = error.response?.data?.message 
      || (error.response ? `Server responded with status: ${error.response.status}` : error.message)
      || 'Failed to fetch order details';
      
    throw new Error(errorMessage);
  }
};

/**
 * Tạo đơn hàng mới
 * @param {Object} orderData - Dữ liệu đơn hàng
 * @returns {Promise<Object>} - Đơn hàng đã tạo
 */
export const createOrder = async (orderData) => {
  try {
    // Thêm userId vào orderData nếu người dùng đã đăng nhập
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUserData = JSON.parse(userData);
        if (parsedUserData._id) {
          orderData.userId = parsedUserData._id;
        }
      } catch (error) {
        console.warn('Error parsing user data:', error);
      }
    }
      const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Create order error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

/**
 * Service object containing all order management functions
 */
const orderService = {
  getMyOrders,
  getOrderById,
  createOrder
};

export default orderService;