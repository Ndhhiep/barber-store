const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Public
const createOrder = async (req, res) => {
  // Start a new session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      customerInfo, 
      items, 
      totalAmount, 
      shippingAddress, 
      paymentMethod, 
      notes,
      userId // Thêm userId từ request body (nếu có)
    } = req.body;

    // Validate request body
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0 || !totalAmount || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Invalid request. Missing required fields.' 
      });
    }

    // Validate each item in the order
    for (const item of items) {
      // Check if the product exists and has sufficient quantity
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          error: `Product not found: ${item.productId}` 
        });
      }

      if (product.quantity < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({ 
          error: `Insufficient stock for product: ${product.name}. Requested: ${item.quantity}, Available: ${product.quantity}` 
        });
      }
    }

    // Create new order with userId (nếu có)
    const orderData = {
      customerInfo,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes,
      status: 'pending'
    };

    // Thêm userId vào đơn hàng nếu có
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      orderData.userId = userId;
    }

    const newOrder = new Order(orderData);

    const savedOrder = await newOrder.save({ session });

    // Create order details for each item
    for (const item of items) {
      const orderDetail = new OrderDetail({
        orderId: savedOrder._id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase
      });

      await orderDetail.save({ session });

      // Update product inventory (decrement quantity)
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } },
        { 
          session: session, 
          new: true, 
          runValidators: true 
        }
      );
    }

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return success response
    return res.status(201).json({ 
      success: true, 
      orderId: savedOrder._id,
      message: 'Order created successfully'
    });

  } catch (error) {
    // Abort transaction in case of error
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating order:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your order.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get orders for logged-in user
// @route   GET /api/orders/user/my-orders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    // User is available from the protect middleware
    if (!req.user || !req.user._id) {
      return res.status(400).json({
        success: false,
        message: 'User information not available'
      });
    }

    const userId = req.user._id;

    console.log(`Fetching orders for user ID: ${userId}`);
    
    // Tìm kiếm đơn hàng theo userId trước tiên
    let orders = await Order.find({ userId })
      .sort({ createdAt: -1 }) // Đơn hàng mới nhất trước
      .lean();
    
    // Nếu không tìm thấy đơn hàng theo ID, thử tìm theo email (cho khả năng tương thích ngược)
    if (orders.length === 0 && req.user.email) {
      orders = await Order.find({ 'customerInfo.email': req.user.email })
        .sort({ createdAt: -1 })
        .lean();
    }
    
    console.log(`Found ${orders.length} orders for user`);

    // Get order details for each order
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const orderDetails = await OrderDetail.find({ orderId: order._id })
        .populate('productId', 'name price imageUrl') // Get product details
        .lean();
      
      return {
        ...order,
        items: orderDetails
      };
    }));

    return res.status(200).json({
      success: true,
      count: ordersWithDetails.length,
      data: ordersWithDetails
    });

  } catch (error) {
    console.error('Error fetching my orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get orders by user ID
// @route   GET /api/orders/user/:userId
// @access  Public
const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Kiểm tra xem userId có phải là một MongoDB ObjectId hợp lệ không
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Tìm tất cả đơn hàng cho userId này
    // Ưu tiên tìm theo userId nếu có, nếu không tìm thấy thì không trả về kết quả nào
    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 }) // Đơn hàng mới nhất trước
      .lean();

    // Lấy chi tiết đơn hàng cho mỗi đơn hàng
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const orderDetails = await OrderDetail.find({ orderId: order._id })
        .populate('productId', 'name price imageUrl') // Lấy chi tiết sản phẩm
        .lean();
      
      return {
        ...order,
        items: orderDetails
      };
    }));

    return res.status(200).json({
      success: true,
      count: ordersWithDetails.length,
      data: ordersWithDetails
    });

  } catch (error) {
    console.error('Error fetching order history by user ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching order history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Public
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find the order by ID
    const order = await Order.findById(id).lean();
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order details
    const orderDetails = await OrderDetail.find({ orderId: order._id })
      .populate('productId', 'name price imageUrl')
      .lean();
    
    const orderWithDetails = {
      ...order,
      items: orderDetails
    };

    return res.status(200).json({
      success: true,
      data: orderWithDetails
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all orders with pagination
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    // Extract pagination parameters from the query string
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get total count of orders for pagination info
    const totalOrders = await Order.countDocuments();

    // Fetch orders with pagination
    const orders = await Order.find()
      .sort({ createdAt: -1 }) // Most recent orders first
      .skip(skip)
      .limit(limit)
      .lean();

    // Get order details for each order
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const orderDetails = await OrderDetail.find({ orderId: order._id })
        .populate('productId', 'name price imageUrl')
        .lean();
      
      return {
        ...order,
        items: orderDetails
      };
    }));

    return res.status(200).json({
      success: true,
      count: ordersWithDetails.length,
      total: totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
      data: ordersWithDetails
    });

  } catch (error) {
    console.error('Error fetching all orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get order statistics for dashboard
 * @route GET /api/orders/stats
 * @access Private/Admin/Staff
 */
const getOrderStats = async (req, res) => {
  try {
    // Calculate total revenue
    const revenue = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    // Count orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Format the results
    const statusCounts = {
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0
    };

    ordersByStatus.forEach(item => {
      if (item._id && statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    // Get current month orders
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyOrders = await Order.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        totalOrders: await Order.countDocuments(),
        pendingOrders: statusCounts.pending,
        processingOrders: statusCounts.processing,
        shippedOrders: statusCounts.shipped,
        deliveredOrders: statusCounts.delivered,
        cancelledOrders: statusCounts.cancelled,
        monthlyOrders
      }
    });
  } catch (error) {
    console.error('Error fetching order statistics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve order statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get recent orders for dashboard
 * @route GET /api/orders/recent
 * @access Private/Admin/Staff
 */
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    
    // Get most recent orders
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Get order details for each order
    const ordersWithDetails = await Promise.all(orders.map(async (order) => {
      const orderDetails = await OrderDetail.find({ orderId: order._id })
        .populate('productId', 'name price imageUrl')
        .lean();
      
      return {
        ...order,
        items: orderDetails
      };
    }));

    res.status(200).json({
      status: 'success',
      count: ordersWithDetails.length,
      data: ordersWithDetails
    });
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve recent orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createOrder,
  getOrdersByUserId,
  getOrderById,
  getMyOrders,
  getAllOrders,
  getOrderStats,
  getRecentOrders
};