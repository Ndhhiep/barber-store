const express = require('express');
const { createOrder, getOrdersByUserId, getOrderById, getMyOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
// POST /api/orders - Create a new order
router.post('/', createOrder);

// Protected routes - require authentication
// GET /api/orders/user/my-orders - Get orders for the logged-in user (moved to a more specific path)
router.get('/user/my-orders', protect, getMyOrders);

// GET /api/orders/user/:userId - Get order history by user ID
router.get('/user/:userId', getOrdersByUserId);

// GET /api/orders/:id - Get order by ID
router.get('/:id', getOrderById);

module.exports = router;