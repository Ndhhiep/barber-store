const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
  getTimeSlotStatus,
  getBookingStats,
  confirmBooking
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../controllers/authController');

// Các route công khai
router.post('/', createBooking);
router.post('/confirm', confirmBooking);
router.get('/time-slots', getAvailableTimeSlots);
router.get('/time-slots-status', getTimeSlotStatus);
router.get('/check-availability', checkTimeSlotAvailability);

// Các route được bảo vệ - yêu cầu xác thực
router.get('/my-bookings', protect, getUserBookings);

// Các route dành cho staff/admin (yêu cầu quyền)
router.get('/', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getBookings);
router.get('/stats', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getBookingStats);
router.put('/:id/status', protect, restrictTo('admin', 'manager', 'barber', 'staff'), updateBookingStatus);

// Các route với tham số đường dẫn nên đặt sau các route cụ thể
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;