const express = require('express');
const router = express.Router();
const { getDashboardStats, getChartData, getMonthlyRevenue } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../controllers/authController');

// Đảm bảo rằng tất cả các routes đều yêu cầu xác thực và phải là staff
router.use(protect);
router.use(restrictTo('admin', 'manager', 'barber', 'staff'));

// GET /api/dashboard/stats - Lấy tất cả thống kê cho dashboard
router.get('/stats', getDashboardStats);

// GET /api/dashboard/chart-data - Lấy dữ liệu biểu đồ
router.get('/chart-data', getChartData);

// GET /api/dashboard/monthly-revenue - Lấy doanh thu hàng tháng
router.get('/monthly-revenue', getMonthlyRevenue);

module.exports = router;