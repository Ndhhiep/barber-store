/**
 * Service quản lý các API liên quan đến lịch hẹn
 */
import api from './api';

// No need for separate API_URL or getAuthHeader since api.js handles that

/**
 * Lấy danh sách lịch hẹn của người dùng hiện tại
 * @returns {Promise<Object>} - Danh sách lịch hẹn
 */
export const getMyBookings = async () => {
  try {
    const response = await api.get(`/bookings/my-bookings`);
    // The API returns bookings directly as an array, not in a nested structure
    return { data: Array.isArray(response.data) ? response.data : [] };
  } catch (error) {
    console.error('Get my bookings error:', error);
    return { data: [] }; // Return empty array instead of throwing
  }
};

/**
 * Tạo lịch hẹn mới
 * @param {Object} bookingData - Dữ liệu lịch hẹn
 * @returns {Promise<Object>} - Lịch hẹn đã tạo
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post(`/bookings`, bookingData);
    return response.data;
  } catch (error) {
    console.error('Create booking error:', error);
    throw error;
  }
};

/**
 * Hủy lịch hẹn
 * @param {string} id - ID của lịch hẹn
 * @returns {Promise<Object>} - Kết quả hủy lịch hẹn
 */
export const cancelBooking = async (id) => {
  try {
    const response = await api.put(`/bookings/${id}/cancel`, {});
    return response.data;
  } catch (error) {
    console.error(`Cancel booking ${id} error:`, error);
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
    const response = await api.get(`/bookings/${id}`);
    return response;
  } catch (error) {
    console.error(`Get booking ${id} error:`, error);
    return null;
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
    let params = { date };
    if (barberId) {
      params.barberId = barberId;
    }
    const response = await api.get('/bookings/available-slots', { params });
    return response;
  } catch (error) {
    console.error('Get available time slots error:', error);
    return { data: [] }; // Return empty array on error
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