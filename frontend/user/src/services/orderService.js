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
    const response = await api.get('/orders/user/my-orders');
    console.log('Order service response:', response);
    
    // The backend returns: { success: true, count: number, data: array }
    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || []
      };
    } else {
      return {
        success: false,
        message: 'Unexpected response format',
        data: []
      };
    }
  } catch (error) {
    console.error('Get my orders error:', error);
    
    // Enhanced error handling
    const errorMessage = error.response?.data?.message 
      || (error.response ? `Server responded with status: ${error.response.status}` : error.message)
      || 'Failed to fetch orders';
    
    return {
      success: false,
      message: errorMessage,
      data: []
    };
  }
};

/**
 * Lấy thông tin chi tiết đơn hàng theo ID
 * @param {string} id - ID của đơn hàng
 * @returns {Promise<Object>} - Chi tiết đơn hàng
 */
export const getOrderById = async (id) => {
  try {
    const response = await api.get(`/orders/${id}`);
    console.log('Get order by ID response:', response);
    
    // Check if the response has the expected structure
    if (response.data) {
      return {
        success: true,
        data: response.data.data || response.data
      };
    } else {
      return {
        success: false,
        message: 'Order not found',
        data: null
      };
    }
  } catch (error) {
    console.error(`Get order ${id} error:`, error);
    
    // Enhanced error handling with more detailed information
    const errorMessage = error.response?.data?.message 
      || (error.response ? `Server responded with status: ${error.response.status}` : error.message)
      || 'Failed to fetch order details';
      
    return {
      success: false,
      message: errorMessage,
      data: null
    };
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
    }      const response = await api.post(`/orders`, orderData);
    return response.data;
  } catch (error) {
    console.error('Create order error:', error);
    throw new Error(error.response?.data?.message || 'Failed to create order');
  }
};

/**
 * Hủy đơn hàng
 * @param {string} id - ID của đơn hàng cần hủy
 * @returns {Promise<Object>} - Kết quả hủy đơn hàng
 */
export const cancelOrder = async (id) => {
  try {
    const response = await api.put(`/orders/${id}/cancel`);
    console.log('Cancel order response:', response);
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Order cancelled successfully',
        data: response.data.data
      };
    } else {
      return {
        success: false,
        message: 'Unexpected response format',
        data: null
      };
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    
    const errorMessage = error.response?.data?.message 
      || (error.response ? `Server responded with status: ${error.response.status}` : error.message)
      || 'Failed to cancel order';
    
    return {
      success: false,
      message: errorMessage,
      data: null
    };
  }
};

/**
 * Service object containing all order management functions
 */
const orderService = {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelOrder
};

export default orderService;