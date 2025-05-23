import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả đơn hàng với tùy chọn lọc
const getAllOrders = async (status = '', page = 1, limit = 10) => {
  try {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    query.append('page', page);
    query.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/orders?${query.toString()}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch orders' };
  }
};

// Lấy đơn hàng theo ID
const getOrderById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/orders/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch order' };
  }
};

// Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (id, status) => {
  try {
    // Thêm log debug
    console.log(`Updating order ${id} status to ${status}`);
    
    // Ensure the API URL has proper formatting
    const endpoint = `${API_URL}/orders/${id}/status`;
    console.log(`API endpoint: ${endpoint}`);
    
    // Log auth header for debugging
    const headers = staffAuthService.authHeader();
    console.log('Auth headers:', JSON.stringify(headers));
    
    const response = await axios.patch(
      endpoint,
      { status },
      { headers }
    );
    
    console.log('Success Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error.response?.data || { message: 'Failed to update order status' };
  }
};

// Lấy đơn hàng gần đây cho dashboard
const getRecentOrders = async (limit = 5) => {
  try {
    const response = await axios.get(`${API_URL}/orders/recent?limit=${limit}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch recent orders' };
  }
};

// Lấy thống kê đơn hàng cho dashboard
const getOrderStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/orders/stats`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch order statistics' };
  }
};

// Tìm kiếm đơn hàng theo short ID (6 ký tự cuối của ID)
const searchOrders = async (searchTerm) => {
  try {
    // Kiểm tra xem searchTerm có phải là 6 ký tự hay không
    if (!searchTerm || searchTerm.trim().length !== 6) {
      console.log('Search term must be exactly 6 characters');
      return { success: false, data: [], totalPages: 0 };
    }
    
    console.log('Searching by short ID:', searchTerm);
    
    // Chuẩn hóa searchTerm (chuyển thành chữ hoa)
    const normalizedSearchTerm = searchTerm.trim().toUpperCase();
    
    // Lấy tất cả đơn hàng gần đây (tối đa 100 đơn)
    const allOrders = await getAllOrders('', 1, 100);
    
    if (allOrders.data && Array.isArray(allOrders.data)) {
      // Lọc đơn hàng có 6 ký tự cuối của ID trùng khớp với searchTerm
      const filteredOrders = allOrders.data.filter(order => {
        const fullId = order._id || '';
        const shortId = fullId.slice(-6).toUpperCase();
        const match = shortId === normalizedSearchTerm;
        if (match) console.log('Tìm thấy đơn hàng có short ID:', shortId);
        return match;
      });
      
      console.log(`Tìm thấy ${filteredOrders.length} đơn hàng với short ID "${normalizedSearchTerm}"`);
      return {
        success: true,
        data: filteredOrders,
        totalPages: 1
      };
    }
    
    return { success: false, data: [], totalPages: 0 };
  } catch (error) {
    console.error('Search order error:', error);
    throw error.response?.data || { message: 'Failed to search orders' };
  }
};

const staffOrderService = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getRecentOrders,
  getOrderStats,
  searchOrders
};

export default staffOrderService;