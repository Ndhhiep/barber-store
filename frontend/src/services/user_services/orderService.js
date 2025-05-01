/**
 * Service quản lý các API liên quan đến đơn hàng
 */
import api from './api';

/**
 * Lấy danh sách đơn hàng của người dùng hiện tại
 * @returns {Promise<Object>} - Danh sách đơn hàng
 */
export const getMyOrders = async () => {
  try {
    return await api.get('/orders/user/my-orders');
  } catch (error) {
    console.error('Get my orders error:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết đơn hàng theo ID
 * @param {string} id - ID của đơn hàng
 * @returns {Promise<Object>} - Chi tiết đơn hàng
 */
export const getOrderById = async (id) => {
  try {
    return await api.get(`/orders/${id}`);
  } catch (error) {
    console.error(`Get order ${id} error:`, error);
    throw error;
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
    
    return await api.post('/orders', orderData);
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
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