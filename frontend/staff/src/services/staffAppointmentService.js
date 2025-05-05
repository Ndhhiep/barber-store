import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all appointments with optional filtering
const getAllAppointments = async (filter = '') => {
  try {
    const response = await axios.get(`${API_URL}/bookings${filter}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch appointments' };
  }
};

// Get appointments for today
const getTodayAppointments = async () => {
  const today = new Date().toISOString().split('T')[0];
  return getAllAppointments(`?date=${today}`);
};

// Get appointments for this week
const getWeekAppointments = async () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const endOfWeek = new Date(today);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  const start = startOfWeek.toISOString().split('T')[0];
  const end = endOfWeek.toISOString().split('T')[0];
  
  return getAllAppointments(`?startDate=${start}&endDate=${end}`);
};

// Get appointment by ID
const getAppointmentById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/bookings/${id}`, {
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
    const response = await axios.patch(
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