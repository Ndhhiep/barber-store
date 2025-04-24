const express = require('express');
const { createOrder } = require('../controllers/orderController');

const router = express.Router();

// POST /api/orders - Create a new order
router.post('/', createOrder);

module.exports = router;