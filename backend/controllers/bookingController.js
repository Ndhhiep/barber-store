const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = asyncHandler(async (req, res) => {
  const {
    service,
    barber_id,
    date,
    time,
    name,
    email,
    phone,
    notes,
    user_id // Added user_id to be saved if the user is logged in
  } = req.body;

  // Xác thực barber_id
  if (!barber_id) {
    res.status(400);
    throw new Error('Barber ID is required');
  }

  // Kiểm tra barber_id có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(barber_id)) {
    res.status(400);
    throw new Error('Invalid Barber ID format');
  }

  // Kiểm tra barber có tồn tại không
  const barber = await Barber.findById(barber_id);
  if (!barber) {
    res.status(404);
    throw new Error('Barber not found');
  }

  const booking = new Booking({
    service,
    barber_id,
    date,
    time,
    name,
    email,
    phone,
    notes,
    user_id: user_id || (req.user ? req.user._id : null) // Use provided user_id, or get from authenticated user if available
  });

  const createdBooking = await booking.save();
  
  // Populate thông tin barber để trả về cho client
  const populatedBooking = await Booking.findById(createdBooking._id)
    .populate('barber_id', 'name specialization');
  
  res.status(201).json(populatedBooking);
});

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private/Admin
const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({})
    .populate('barber_id', 'name specialization')
    .sort({ date: 1, time: 1 });
  res.json(bookings);
});

// @desc    Get logged-in user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user_id: req.user._id })
    .populate('barber_id', 'name specialization')
    .sort({ date: -1, createdAt: -1 }); // Sort by date (newest first)
  
  res.json(bookings);
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('barber_id', 'name specialization');

  // Check if booking exists
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if the booking belongs to the logged-in user or user is admin
  if (booking.user_id && booking.user_id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json(booking);
});

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  // Check if booking exists
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if the booking belongs to the logged-in user or user is admin
  if (booking.user_id && booking.user_id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  // Check if booking can be cancelled (not completed)
  if (booking.status === 'completed') {
    res.status(400);
    throw new Error('Cannot cancel a completed booking');
  }

  // Update booking status to cancelled
  booking.status = 'cancelled';
  const updatedBooking = await booking.save();

  res.json(updatedBooking);
});

// @desc    Update booking status (for admins)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  // Validate status
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status');
  }

  const booking = await Booking.findById(req.params.id);

  // Check if booking exists
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Update booking status
  booking.status = status;
  const updatedBooking = await booking.save();

  res.json(updatedBooking);
});

module.exports = {
  createBooking,
  getBookings,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus
};