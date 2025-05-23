import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả thống kê cho trang tổng quan
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

// Lấy dữ liệu biểu đồ cho đơn hàng và lịch hẹn
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

// Lấy doanh thu hàng tháng từ lịch hẹn hoàn thành và đơn hàng đã giao
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