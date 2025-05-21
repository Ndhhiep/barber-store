import axios from 'axios';

/**
 * Service quản lý các API liên quan đến lịch hẹn
 */
import api from './api';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/bookings';

// Get authentication token
const getToken = () => localStorage.getItem('token');

/**
 * Lấy danh sách lịch hẹn của người dùng hiện tại
 * @returns {Promise<Object>} - Danh sách lịch hẹn
 */
export const getMyBookings = async () => {
  try {
    return await api.get('/bookings/my-bookings');
  } catch (error) {
    console.error('Get my bookings error:', error);
    throw error;
  }
};

/**
 * Tạo lịch hẹn mới
 * @param {Object} bookingData - Dữ liệu lịch hẹn
 * @returns {Promise<Object>} - Lịch hẹn đã tạo
 */
export const createBooking = async (bookingData) => {
  const headers = {};
  const token = getToken();
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await axios.post(API_URL, bookingData, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Hủy lịch hẹn
 * @param {string} id - ID của lịch hẹn
 * @returns {Promise<Object>} - Kết quả hủy lịch hẹn
 */
export const cancelBooking = async (id) => {
  const token = getToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  try {
    const response = await axios.put(`${API_URL}/${id}/cancel`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết lịch hẹn theo ID
 * @param {string} id - ID của lịch hẹn
 * @returns {Promise<Object>} - Chi tiết lịch hẹn
 */
export const getBookingById = async (id) => {
  try {
    return await api.get(`/bookings/${id}`);
  } catch (error) {
    console.error(`Get booking ${id} error:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách các khung giờ có sẵn cho ngày được chọn
 * @param {string} date - Ngày muốn đặt lịch (định dạng YYYY-MM-DD)
 * @param {string} barberId - ID của barber (tùy chọn)
 * @returns {Promise<Object>} - Danh sách khung giờ có sẵn
 */
export const getAvailableTimeSlots = async (date, barberId = null) => {
  try {
    let endpoint = `/bookings/available-slots?date=${date}`;
    if (barberId) {
      endpoint += `&barberId=${barberId}`;
    }
    return await api.get(endpoint);
  } catch (error) {
    console.error('Get available time slots error:', error);
    throw error;
  }
};

const bookingService = {
  getMyBookings,
  createBooking,
  cancelBooking,
  getBookingById,
  getAvailableTimeSlots
};

export default bookingService;