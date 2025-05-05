const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const asyncHandler = require('express-async-handler');

/**
 * Get dashboard statistics for staff
 * @route GET /api/dashboard/stats
 * @access Private/Staff
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Count total items in each collection
    const totalUsers = await User.countDocuments({ role: 'user' }); // Chỉ đếm user, không đếm staff
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Lấy các cuộc hẹn của hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.find({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    }).populate('barber_id', 'name').lean();

    // Format bookings cho việc hiển thị
    const formattedTodayBookings = todayBookings.map(booking => ({
      _id: booking._id,
      userName: booking.name || 'N/A',
      serviceName: booking.service,
      time: booking.time,
      status: booking.status
    }));

    // Lấy các đơn hàng gần đây
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      status: 'success',
      data: {
        counts: {
          users: totalUsers,
          orders: totalOrders,
          products: totalProducts,
          bookings: totalBookings
        },
        todayBookings: formattedTodayBookings,
        recentOrders: recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  getDashboardStats
};