import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all orders with optional filtering
const getAllOrders = async (status = '', page = 1, limit = 10) => {
  try {
    const query = new URLSearchParams();
    if (status && status !== 'All Orders') query.append('status', status);
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

// Get order by ID
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

// Update order status
const updateOrderStatus = async (id, status) => {
  try {
    const response = await axios.patch(
      `${API_URL}/orders/${id}/status`,
      { status },
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update order status' };
  }
};

// Get recent orders for dashboard
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

// Get order statistics for dashboard
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

const staffOrderService = {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  getRecentOrders,
  getOrderStats
};

export default staffOrderService;