import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả lịch hẹn với tùy chọn lọc và phân trang
const getAllAppointments = async (page = 1, limit = 10, filter = '') => {
  try {
    let queryString = `?page=${page}&limit=${limit}`;
    
    // Nếu filter không rỗng, thêm vào query string
    if (filter) {
      // Loại bỏ ký tự '?' ở đầu của filter nếu có, vì chúng ta đã thêm '?' trước đó
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

// Lấy các lịch hẹn hôm nay với phân trang
const getTodayAppointments = async (page = 1, limit = 10) => {
  const today = new Date().toISOString().split('T')[0];
  return getAllAppointments(page, limit, `date=${today}`);
};

// Lấy các lịch hẹn trong tuần này với phân trang
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

// Lấy thông tin lịch hẹn theo ID (có hỗ trợ populate barber)
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

// Cập nhật trạng thái lịch hẹn
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

// Lấy thống kê cho dashboard liên quan đến lịch hẹn
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