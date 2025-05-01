/**
 * Service quản lý các API liên quan đến lịch hẹn
 */
import api from './api';

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
  try {
    return await api.post('/bookings', bookingData);
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
    return await api.put(`/bookings/${id}/cancel`, {});
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

export default {
  getMyBookings,
  createBooking,
  cancelBooking,
  getBookingById,
  getAvailableTimeSlots
};