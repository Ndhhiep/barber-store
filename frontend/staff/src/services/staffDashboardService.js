import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all dashboard stats
const getDashboardStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/stats`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dashboard statistics' };
  }
};

// Get chart data for orders and appointments
const getChartData = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/chart-data`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch chart data' };
  }
};

// Get monthly revenue from completed appointments and delivered orders
const getMonthlyRevenue = async () => {
  try {
    const response = await axios.get(`${API_URL}/dashboard/monthly-revenue`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch monthly revenue' };
  }
};

const staffDashboardService = {
  getDashboardStats,
  getChartData,
  getMonthlyRevenue
};

export default staffDashboardService;