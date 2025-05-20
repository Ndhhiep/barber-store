import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all appointments with optional filtering and pagination
const getAllAppointments = async (page = 1, limit = 10, filter = '') => {
  try {
    let queryString = `?page=${page}&limit=${limit}`;
    
    // If filter is not empty, append it to the query string
    if (filter) {
      // Remove leading '?' from filter if it exists, as we've already added it
      const filterStr = filter.startsWith('?') ? filter.substring(1) : filter;
      queryString += `&${filterStr}`;
    }
    
    const response = await axios.get(`${API_URL}/bookings${queryString}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch appointments' };
  }
};

// Get appointments for today with pagination
const getTodayAppointments = async (page = 1, limit = 10) => {
  const today = new Date().toISOString().split('T')[0];
  return getAllAppointments(page, limit, `date=${today}`);
};

// Get appointments for this week with pagination
const getWeekAppointments = async (page = 1, limit = 10) => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const start = startOfWeek.toISOString().split('T')[0];
  const end = endOfWeek.toISOString().split('T')[0];
  
  return getAllAppointments(page, limit, `startDate=${start}&endDate=${end}`);
};

// Get appointment by ID
const getAppointmentById = async (id) => {
  try {
    // Thêm populate=barber_id vào query để lấy thông tin đầy đủ của barber
    const response = await axios.get(`${API_URL}/bookings/${id}?populate=barber_id`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch appointment' };
  }
};

// Update appointment status
const updateAppointmentStatus = async (id, status) => {
  try {
    const response = await axios.put(
      `${API_URL}/bookings/${id}/status`,
      { status },
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update appointment status' };
  }
};

// Get dashboard statistics for appointments
const getAppointmentStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/bookings/stats`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch appointment statistics' };
  }
};

const staffAppointmentService = {
  getAllAppointments,
  getTodayAppointments,
  getWeekAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  getAppointmentStats
};

export default staffAppointmentService;