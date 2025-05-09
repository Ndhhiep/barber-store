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
    
    // Handle different response structures
    const responseData = response.data;
    return {
      data: responseData.data?.users || responseData.data || responseData.users || responseData || [],
      totalPages: responseData.totalPages || responseData.total_pages || Math.ceil((responseData.total || 0) / limit) || 1
    };
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
    
    // Extract user data from the response, handling different structures
    const responseData = response.data;
    return responseData.data?.user || responseData.data || responseData.user || responseData;
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
    // Use the general bookings endpoint with a user filter query parameter
    const response = await axios.get(`${API_URL}/bookings?userId=${customerId}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Handle different response structures
    const responseData = response.data;
    return {
      bookings: responseData.data || responseData.bookings || [],
      total: responseData.total || responseData.count || 0
    };
  } catch (error) {
    console.error('Error fetching customer bookings:', error.message);
    return { bookings: [], total: 0 }; // Return empty data instead of throwing an error
  }
};

// Get customer's orders
const getCustomerOrders = async (customerId) => {
  try {
    const response = await axios.get(`${API_URL}/orders/user/${customerId}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Handle different response structures
    const responseData = response.data;
    return {
      orders: responseData.data || responseData.orders || [],
      total: responseData.total || responseData.count || 0
    };
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