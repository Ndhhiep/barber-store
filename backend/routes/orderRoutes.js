const express = require('express');
const { createOrder, getOrdersByUserId, getOrderById, getMyOrders, getAllOrders, getOrderStats, getRecentOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../controllers/authController');

const router = express.Router();

// Các route công khai
// POST /api/orders - Tạo đơn hàng mới
router.post('/', createOrder);

// Các route được bảo vệ - yêu cầu xác thực
// GET /api/orders - Lấy tất cả đơn hàng (chỉ admin, staff)
router.get('/', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getAllOrders);

// GET /api/orders/stats - Lấy thống kê đơn hàng cho dashboard
router.get('/stats', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getOrderStats);

// GET /api/orders/recent - Lấy đơn hàng gần đây
router.get('/recent', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getRecentOrders);

// PATCH /api/orders/:id/status - Cập nhật trạng thái đơn hàng (chỉ admin, staff)
router.patch('/:id/status', protect, restrictTo('admin', 'manager', 'barber', 'staff'), updateOrderStatus);

// GET /api/orders/user/my-orders - Lấy đơn hàng của người dùng đang đăng nhập
router.get('/user/my-orders', protect, getMyOrders);

// GET /api/orders/user/:userId - Lấy lịch sử đơn hàng theo ID người dùng
router.get('/user/:userId', getOrdersByUserId);

// GET /api/orders/:id - Lấy đơn hàng theo ID
router.get('/:id', getOrderById);

module.exports = router;