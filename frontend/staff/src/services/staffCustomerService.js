import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả khách hàng với tùy chọn tìm kiếm
const getAllCustomers = async (search = '', page = 1, limit = 10) => {
  try {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    query.append('page', page);
    query.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/users?${query.toString()}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Xử lý các cấu trúc phản hồi khác nhau
    const responseData = response.data;
    return {
      data: responseData.data?.users || responseData.data || responseData.users || responseData || [],
      totalPages: responseData.totalPages || responseData.total_pages || Math.ceil((responseData.total || 0) / limit) || 1
    };
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customers' };
  }
};

// Lấy khách hàng theo ID
const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Trích xuất dữ liệu người dùng từ phản hồi, xử lý các cấu trúc khác nhau
    const responseData = response.data;
    return responseData.data?.user || responseData.data || responseData.user || responseData;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer' };
  }
};

// Cập nhật thông tin khách hàng
const updateCustomer = async (id, customerData) => {
  try {
    const response = await axios.put(
      `${API_URL}/users/${id}`,
      customerData,
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update customer' };
  }
};

// Lấy lịch đặt của khách hàng
const getCustomerBookings = async (customerId) => {
  try {
    // Sử dụng endpoint đặt lịch chung với tham số lọc theo người dùng
    const response = await axios.get(`${API_URL}/bookings?userId=${customerId}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Xử lý các cấu trúc phản hồi khác nhau
    const responseData = response.data;
    return {
      bookings: responseData.data || responseData.bookings || [],
      total: responseData.total || responseData.count || 0
    };
  } catch (error) {
    console.error('Error fetching customer bookings:', error.message);
    return { bookings: [], total: 0 }; // Trả về dữ liệu rỗng thay vì ném lỗi
  }
};

// Lấy đơn hàng của khách hàng
const getCustomerOrders = async (customerId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/user/${customerId}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Xử lý các cấu trúc phản hồi khác nhau
    const responseData = response.data;
    return {
      orders: responseData.data || responseData.orders || [],
      total: responseData.total || responseData.count || 0
    };
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer orders' };
  }
};

// Lấy thống kê khách hàng cho dashboard
const getCustomerStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/stats`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer statistics' };
  }
};

const staffCustomerService = {
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  getCustomerBookings,
  getCustomerOrders,
  getCustomerStats
};

export default staffCustomerService;