const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const asyncHandler = require('express-async-handler');

/**
 * Lấy số liệu dashboard cho nhân viên
 * @route GET /api/dashboard/stats
 * @access Riêng tư/Staff
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Đếm tổng số mục trong mỗi collection
    const totalUsers = await User.countDocuments({ role: 'user' }); // Chỉ đếm user, không đếm staff
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalBookings = await Booking.countDocuments();

    // Lấy các cuộc hẹn trong hôm nay
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

    // Định dạng dữ liệu bookings để hiển thị
    const formattedTodayBookings = todayBookings.map(booking => ({
      _id: booking._id,
      userName: booking.name || 'N/A',
      serviceName: booking.service,
      time: booking.time,
      status: booking.status
    }));

    // Lấy các đơn hàng gần đây
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 }) // Đơn hàng mới nhất trước
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
      message: 'Không thể lấy số liệu dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Lấy dữ liệu biểu đồ cho đơn hàng và cuộc hẹn
 * @route GET /api/dashboard/chart-data
 * @access Riêng tư/Staff
 */
const getChartData = asyncHandler(async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6); // Lấy dữ liệu cho 7 ngày gần nhất
    
    // Reset giờ để lấy trọn ngày
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    // Tổng hợp đơn hàng theo ngày trong 7 ngày qua
    const ordersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Tổng hợp cuộc hẹn theo ngày trong 7 ngày qua
    const appointmentsData = await Booking.aggregate([
      {
        $match: {
          date: { $gte: sevenDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Tạo mảng dữ liệu cho 7 ngày qua
    const chartData = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(sevenDaysAgo);
      currentDate.setDate(sevenDaysAgo.getDate() + i);
      
      const dateStr = currentDate.toISOString().split('T')[0]; // Định dạng YYYY-MM-DD
      
      const orderData = ordersData.find(item => item._id === dateStr);
      const appointmentData = appointmentsData.find(item => item._id === dateStr);
      
      chartData.push({
        date: dateStr,
        orders: orderData ? orderData.count : 0,
        appointments: appointmentData ? appointmentData.count : 0
      });
    }

    res.status(200).json({
      status: 'success',
      data: chartData
    });
  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy dữ liệu biểu đồ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * Lấy doanh thu hàng tháng từ cuộc hẹn hoàn thành và đơn hàng đã giao
 * @route GET /api/dashboard/monthly-revenue
 * @access Riêng tư/Staff
 */
const getMonthlyRevenue = asyncHandler(async (req, res) => {
  try {
    // Tính ngày đầu tiên của tháng hiện tại
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      // Doanh thu từ cuộc hẹn hoàn thành
    // Cần lấy giá dịch vụ từ collection Service bằng cách lookup
    const appointmentsRevenue = await Booking.aggregate([
      {
        $match: {
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          status: 'completed'
        }
      },
      {
        // Lookup để lấy thông tin từ collection Service
        $lookup: {
          from: 'services',
          let: { serviceName: "$service" },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ["$name", "$$serviceName"] }
              }
            }
          ],
          as: "serviceDetails"
        }
      },
      {
        $addFields: {
          // Lấy giá từ dịch vụ đã lookup, hoặc 0 nếu không tìm thấy
          servicePrice: { $ifNull: [{ $arrayElemAt: ["$serviceDetails.price", 0] }, 0] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$servicePrice" }
        }
      }
    ]);
    
    // Doanh thu từ đơn hàng đã giao
    const ordersRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth },
          status: 'delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ["$totalAmount", 0] } }
        }
      }
    ]);    const appointmentTotal = appointmentsRevenue.length > 0 ? appointmentsRevenue[0].total : 0;
    const orderTotal = ordersRevenue.length > 0 ? ordersRevenue[0].total : 0;
    const totalRevenue = appointmentTotal + orderTotal;
    
    console.log('Monthly Revenue Breakdown:');
    console.log('- Appointments Revenue:', appointmentTotal);
    console.log('- Orders Revenue:', orderTotal);
    console.log('- Total Revenue:', totalRevenue);

    res.status(200).json({
      status: 'success',
      data: {
        appointmentRevenue: appointmentTotal,
        orderRevenue: orderTotal,
        totalRevenue: totalRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy doanh thu hàng tháng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  getDashboardStats,
  getChartData,
  getMonthlyRevenue
};