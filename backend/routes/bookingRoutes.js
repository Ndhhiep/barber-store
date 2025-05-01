const express = require('express');
const router = express.Router();
const { 
  createBooking, 
  getBookings, 
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../controllers/authController');

// Public route to create a new booking
router.post('/', createBooking);

// Protected routes - require authentication
router.get('/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

// Admin only routes
router.get('/', protect, restrictTo('admin', 'manager', 'barber'), getBookings);
router.put('/:id/status', protect, restrictTo('admin', 'manager', 'barber'), updateBookingStatus);

module.exports = router;