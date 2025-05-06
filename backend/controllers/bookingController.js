const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const User = require('../models/User'); // Thêm import model User
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dateUtils = require('../utils/dateUtils'); // Import tiện ích xử lý thời gian

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

  // Chuyển đổi date sang đúng múi giờ Việt Nam
  const vnDate = dateUtils.toVNDateTime(date);

  const booking = new Booking({
    service,
    barber_id,
    date: vnDate, // Sử dụng ngày đã được chuyển đổi sang múi giờ Việt Nam
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
  try {
    // Handle date filtering if provided
    const filter = {};
    
    if (req.query.date) {
      // Filter by specific date
      const date = req.query.date;
      
      // Sử dụng dateUtils để lấy đầu ngày và cuối ngày
      const startDate = dateUtils.getVNStartOfDay(new Date(date));
      const endDate = dateUtils.getVNEndOfDay(new Date(date));
      
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
      
      console.log(`Filtering bookings for date: ${date}`);
      console.log(`Start date: ${startDate.toISOString()}`);
      console.log(`End date: ${endDate.toISOString()}`);
    } else if (req.query.startDate && req.query.endDate) {
      // Filter by date range
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      
      // Sử dụng dateUtils để lấy đầu ngày và cuối ngày
      const start = dateUtils.getVNStartOfDay(new Date(startDate));
      const end = dateUtils.getVNEndOfDay(new Date(endDate));
      
      filter.date = {
        $gte: start,
        $lte: end
      };
      
      console.log(`Filtering bookings from ${startDate} to ${endDate}`);
      console.log(`Start date: ${start.toISOString()}`);
      console.log(`End date: ${end.toISOString()}`);
    }
    
    // Add logging to help debug the filter and query
    console.log('Filter:', JSON.stringify(filter));
    
    // Thay đổi cách truy vấn để tránh lỗi populate
    const bookings = await Booking.find(filter)
      .populate('barber_id', 'name specialization')
      .lean();
    
    console.log(`Found ${bookings.length} bookings`);
    
    // Format bookings to include barber and user names
    const formattedBookings = await Promise.all(bookings.map(async (booking) => {
      const formattedBooking = { ...booking };
      
      // Add service name for easier display
      formattedBooking.serviceName = booking.service;
      
      // Add customer name from booking.name
      formattedBooking.userName = booking.name || 'N/A';
      
      // Format date và time để hiển thị
      formattedBooking.formattedDate = dateUtils.formatDate(booking.date);
      formattedBooking.formattedTime = booking.time;
      
      // Nếu có user_id và nó là ObjectId hợp lệ, thử lấy thông tin user
      if (booking.user_id && mongoose.Types.ObjectId.isValid(booking.user_id)) {
        try {
          const user = await User.findById(booking.user_id).select('name email').lean();
          if (user) {
            formattedBooking.userName = user.name || booking.name || 'N/A';
            formattedBooking.userEmail = user.email;
          }
        } catch (error) {
          console.log(`Error fetching user info for ID ${booking.user_id}:`, error.message);
        }
      }
      
      return formattedBooking;
    }));
    
    // Return with bookings property as expected by frontend
    res.json({
      status: 'success',
      count: formattedBookings.length,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
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

/**
 * Get available time slots for a barber on a specific date
 * @route GET /api/bookings/time-slots
 * @access Public
 */
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date, barberId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a date for checking time slots'
      });
    }
    
    if (!barberId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a barber ID for checking time slots'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }

    // Find barber by ID
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Barber not found'
      });
    }
    
    // Changed from isActive to is_active to match the model property name
    if (!barber.is_active) {
      return res.status(400).json({
        status: 'fail',
        message: 'This barber is not currently active'
      });
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if barber works on this day
    if (barber.workingDays && !barber.workingDays[dayOfWeek]) {
      return res.status(200).json({
        status: 'success',
        message: `Barber does not work on ${dayOfWeek}`,
        data: {
          timeSlots: []
        }
      });
    }

    // Generate all possible time slots based on barber's working hours
    // If workingHours is not defined, use default hours
    const start = barber.workingHours?.start || '09:00';
    const end = barber.workingHours?.end || '19:00';
    
    // Sử dụng dateUtils.generateTimeSlots thay vì hàm local
    const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });

    // Find all bookings for this barber on the specified date
    const bookings = await Booking.find({
      barber_id: barberId,
      date: {
        $gte: dateUtils.getVNStartOfDay(new Date(date)),
        $lte: dateUtils.getVNEndOfDay(new Date(date))
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Mark time slots as available or not
    const bookedTimes = bookings.map(booking => booking.time);
    const timeSlots = allTimeSlots.map(slot => ({
      start_time: slot,
      is_available: !bookedTimes.includes(slot)
    }));

    // If the date is today, filter out past time slots
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Filter out time slots that have already passed or are within 30 minutes from now
      return res.status(200).json({
        status: 'success',
        data: {
          timeSlots: timeSlots.filter(slot => {
            const [slotHour, slotMinute] = slot.start_time.split(':').map(Number);
            const slotTotalMinutes = slotHour * 60 + slotMinute;
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            
            // Keep slots that are at least 30 minutes in the future
            return slotTotalMinutes > currentTotalMinutes + 30;
          })
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        timeSlots
      }
    });
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve available time slots',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Check if a specific time slot is available
// @route   GET /api/bookings/check-availability
// @access  Public
const checkTimeSlotAvailability = async (req, res) => {
  try {
    const { date, timeSlot, barberId } = req.query;
    
    if (!date || !timeSlot || !barberId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide date, timeSlot, and barberId'
      });
    }

    // Find barber by ID
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Barber not found'
      });
    }

    // Check if the barber is available for this time slot
    const isAvailable = await barber.isAvailable(date, timeSlot);

    res.status(200).json({
      status: 'success',
      data: {
        isAvailable
      }
    });
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check time slot availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get status for all time slots for a barber on a specific date
 * @route GET /api/bookings/time-slots-status
 * @access Public
 */
const getTimeSlotStatus = async (req, res) => {
  try {
    const { date, barberId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a date for checking time slots'
      });
    }
    
    if (!barberId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide a barber ID for checking time slots'
      });
    }

    // Validate date format (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format. Please use YYYY-MM-DD'
      });
    }

    // Find barber by ID
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Barber not found'
      });
    }
    
    // Changed from isActive to is_active to match the model property name
    if (!barber.is_active) {
      return res.status(400).json({
        status: 'fail',
        message: 'This barber is not currently active'
      });
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Check if barber works on this day
    if (barber.workingDays && !barber.workingDays[dayOfWeek]) {
      return res.status(200).json({
        status: 'success',
        message: `Barber does not work on ${dayOfWeek}`,
        data: {
          timeSlots: []
        }
      });
    }

    // Generate all possible time slots based on barber's working hours
    // If workingHours is not defined, use default hours
    const start = barber.workingHours?.start || '09:00';
    const end = barber.workingHours?.end || '19:00';
    const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });

    // Find all bookings for this barber on the specified date
    const bookings = await Booking.find({
      barber_id: barberId,
      date: {
        $gte: dateUtils.getVNStartOfDay(new Date(date)),
        $lte: dateUtils.getVNEndOfDay(new Date(date))
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Mark time slots as available or not
    const bookedTimes = bookings.map(booking => booking.time);
    
    // Determine if slot is in the past for today
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Create timeslot objects with availability and past status
    const timeSlots = allTimeSlots.map(slot => {
      // Check if slot is in the past if today
      let isPast = false;
      if (date === today) {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        
        // Slot is considered "past" if it's less than 30 minutes from now
        isPast = slotTotalMinutes < currentTotalMinutes + 30;
      }

      return {
        start_time: slot,
        isPast: isPast,
        isAvailable: !bookedTimes.includes(slot)
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        timeSlots
      }
    });
  } catch (error) {
    console.error('Error fetching time slot status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve time slot status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get booking statistics for dashboard
 * @route GET /api/bookings/stats
 * @access Private/Admin/Staff
 */
const getBookingStats = async (req, res) => {
  try {
    // Calculate overall booking statistics
    const totalBookings = await Booking.countDocuments();
    
    // Count bookings by status
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Format the results
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    bookingsByStatus.forEach(item => {
      if (item._id && statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    // Get current month's bookings
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyBookings = await Booking.countDocuments({
      date: { $gte: startOfMonth }
    });

    // Get today's bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Get upcoming bookings (next 7 days)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingBookings = await Booking.countDocuments({
      date: {
        $gte: today,
        $lt: nextWeek
      },
      status: { $nin: ['cancelled', 'completed'] }
    });

    // Get popular barbers
    const popularBarbers = await Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: "$barber_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "barbers",
          localField: "_id",
          foreignField: "_id",
          as: "barber"
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: { $arrayElemAt: ["$barber.name", 0] },
          specialization: { $arrayElemAt: ["$barber.specialization", 0] }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalBookings,
        pendingBookings: statusCounts.pending,
        confirmedBookings: statusCounts.confirmed,
        completedBookings: statusCounts.completed,
        cancelledBookings: statusCounts.cancelled,
        monthlyBookings,
        todayBookings,
        upcomingBookings,
        popularBarbers
      }
    });
  } catch (error) {
    console.error('Error fetching booking statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve booking statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
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
};