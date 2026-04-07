const orderService = require('../services/orderService');
const CreateOrderDTO = require('../dto/order/CreateOrderDTO');
const UpdateOrderStatusDTO = require('../dto/order/UpdateOrderStatusDTO');

const _fail = (res, code, msg) => res.status(code).json({ success: false, message: msg });
const _error = (res, err) => {
  const code = err.statusCode || 500;
  res.status(code).json({ success: false, message: err.message, error: process.env.NODE_ENV === 'development' ? err.message : undefined });
};

// POST /api/orders
const createOrder = async (req, res) => {
  const dto = new CreateOrderDTO({ ...req.body, userId: req.body.userId });
  const errors = dto.validate();
  if (errors.length > 0) return _fail(res, 400, errors[0]);

  try {
    const { orderId } = await orderService.createOrder(dto);
    res.status(201).json({ success: true, orderId, message: 'Order created successfully' });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/orders/user/my-orders
const getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) return _fail(res, 400, 'User information not available');
    const data = await orderService.getMyOrders(req.user._id, req.user.email);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/orders/user/:userId
const getOrdersByUserId = async (req, res) => {
  try {
    const data = await orderService.getOrdersByUserId(req.params.userId);
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const data = await orderService.getOrderById(req.params.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/orders
const getAllOrders = async (req, res) => {
  try {
    const filter = orderService.buildOrderFilter(req.query);
    const pagination = orderService.buildPagination(req.query);
    const result = await orderService.getAllOrders(filter, pagination);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/orders/stats
const getOrderStats = async (req, res) => {
  try {
    const data = await orderService.getOrderStats();
    res.status(200).json({ status: 'success', data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve order statistics' });
  }
};

// GET /api/orders/recent
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    const data = await orderService.getRecentOrders(limit);
    res.status(200).json({ status: 'success', count: data.length, data });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to retrieve recent orders' });
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  const dto = new UpdateOrderStatusDTO(req.body);
  const errors = dto.validate();
  if (errors.length > 0) return _fail(res, 400, errors[0]);

  try {
    const order = await orderService.updateOrderStatus(req.params.id, dto.status);
    res.status(200).json({ success: true, message: `Order status updated to ${dto.status}`, data: order });
  } catch (error) {
    _error(res, error);
  }
};

// PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await orderService.cancelOrder(req.params.id, req.user._id);
    res.status(200).json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    _error(res, error);
  }
};

module.exports = {
  createOrder, getOrdersByUserId, getOrderById, getMyOrders,
  getAllOrders, getOrderStats, getRecentOrders, updateOrderStatus, cancelOrder,
};