const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Booking = require('../models/Booking');

const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalUsers, totalOrders, totalProducts, totalBookings, todayBookings, recentOrders] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Order.countDocuments(),
    Product.countDocuments(),
    Booking.countDocuments(),
    Booking.find({ date: { $gte: today, $lt: tomorrow } }).populate('barber_id', 'name').lean(),
    Order.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const formattedTodayBookings = todayBookings.map((booking) => ({
    _id: booking._id,
    userName: booking.name || 'N/A',
    service: booking.service || 'N/A',
    services: Array.isArray(booking.services) ? booking.services : [],
    serviceName:
      Array.isArray(booking.services) && booking.services.length > 0
        ? booking.services.join(', ')
        : booking.service || 'N/A',
    time: booking.time,
    status: booking.status,
  }));

  return {
    counts: { users: totalUsers, orders: totalOrders, products: totalProducts, bookings: totalBookings },
    todayBookings: formattedTodayBookings,
    recentOrders,
  };
};

const getChartData = async () => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [ordersData, appointmentsData] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: { date: { $gte: sevenDaysAgo, $lte: now } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const chartData = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(sevenDaysAgo.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    chartData.push({
      date: dateStr,
      orders: (ordersData.find((x) => x._id === dateStr) || {}).count || 0,
      appointments: (appointmentsData.find((x) => x._id === dateStr) || {}).count || 0,
    });
  }

  return chartData;
};

const getMonthlyRevenue = async () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [appointmentsRevenue, ordersRevenue] = await Promise.all([
    Booking.aggregate([
      { $match: { date: { $gte: firstDay, $lte: lastDay }, status: 'completed' } },
      {
        $lookup: {
          from: 'services',
          let: { serviceName: '$service' },
          pipeline: [{ $match: { $expr: { $eq: ['$name', '$$serviceName'] } } }],
          as: 'serviceDetails',
        },
      },
      { $addFields: { servicePrice: { $ifNull: [{ $arrayElemAt: ['$serviceDetails.price', 0] }, 0] } } },
      { $group: { _id: null, total: { $sum: '$servicePrice' } } },
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: firstDay, $lte: lastDay }, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
    ]),
  ]);

  const appointmentTotal = appointmentsRevenue.length > 0 ? appointmentsRevenue[0].total : 0;
  const orderTotal = ordersRevenue.length > 0 ? ordersRevenue[0].total : 0;

  return {
    appointmentRevenue: appointmentTotal,
    orderRevenue: orderTotal,
    totalRevenue: appointmentTotal + orderTotal,
  };
};

module.exports = { getDashboardStats, getChartData, getMonthlyRevenue };
