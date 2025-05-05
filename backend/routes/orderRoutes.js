const express = require('express');
const { createOrder, getOrdersByUserId, getOrderById, getMyOrders, getAllOrders, getOrderStats, getRecentOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../controllers/authController');

const router = express.Router();

// Public routes
// POST /api/orders - Create a new order
router.post('/', createOrder);

// Protected routes - require authentication
// GET /api/orders - Get all orders (admin/staff only)
router.get('/', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getAllOrders);

// GET /api/orders/stats - Get order statistics for dashboard
router.get('/stats', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getOrderStats);

// GET /api/orders/recent - Get recent orders
router.get('/recent', protect, restrictTo('admin', 'manager', 'barber', 'staff'), getRecentOrders);

// GET /api/orders/user/my-orders - Get orders for the logged-in user
router.get('/user/my-orders', protect, getMyOrders);

// GET /api/orders/user/:userId - Get order history by user ID
router.get('/user/:userId', getOrdersByUserId);

// GET /api/orders/:id - Get order by ID
router.get('/:id', getOrderById);

module.exports = router;