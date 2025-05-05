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
  getBookingStats
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../controllers/authController');

// Public routes
router.post('/', createBooking);
router.get('/time-slots', getAvailableTimeSlots);
router.get('/time-slots-status', getTimeSlotStatus);
router.get('/check-availability', checkTimeSlotAvailability);

// Protected routes - require authentication
router.get('/my-bookings', protect, getUserBookings);

// Staff/Admin routes
router.get('/', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getBookings);
router.get('/stats', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getBookingStats);
router.put('/:id/status', protect, restrictTo('admin', 'manager', 'barber', 'staff'), updateBookingStatus);

// Routes with path parameters should come after specific routes
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;