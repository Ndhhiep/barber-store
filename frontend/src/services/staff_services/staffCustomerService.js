import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all customers with optional search
const getAllCustomers = async (search = '', page = 1, limit = 10) => {
  try {
    const query = new URLSearchParams();
    if (search) query.append('search', search);
    query.append('page', page);
    query.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/users?${query.toString()}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customers' };
  }
};

// Get customer by ID
const getCustomerById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer' };
  }
};

// Update customer information
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

// Get customer's bookings
const getCustomerBookings = async (customerId) => {
  try {
    const response = await axios.get(`${API_URL}/bookings/user/${customerId}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer bookings' };
  }
};

// Get customer's orders
const getCustomerOrders = async (customerId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/user/${customerId}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch customer orders' };
  }
};

// Get customer statistics for dashboard
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