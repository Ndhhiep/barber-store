const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Công khai
const createOrder = async (req, res) => {
  // Khởi tạo session mới cho transaction
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

    // Xác thực yêu cầu đầu vào
    if (!customerInfo || !items || !Array.isArray(items) || items.length === 0 || !totalAmount || !shippingAddress || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Invalid request. Missing required fields.' 
      });
    }

    // Xác thực mỗi mục trong đơn hàng
    for (const item of items) {
      // Kiểm tra sản phẩm có tồn tại và số lượng đủ
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

    // Tạo dữ liệu đơn hàng mới (bao gồm userId nếu có)
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

    // Tạo chi tiết đơn hàng cho mỗi mục
    for (const item of items) {
      const orderDetail = new OrderDetail({
        orderId: savedOrder._id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase
      });

      await orderDetail.save({ session });

      // Cập nhật tồn kho sản phẩm (giảm số lượng)
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

    // Xác nhận transaction
    await session.commitTransaction();
    session.endSession();

    // Trả về phản hồi thành công
    return res.status(201).json({ 
      success: true, 
      orderId: savedOrder._id,
      message: 'Order created successfully'
    });

  } catch (error) {
    // Hủy transaction nếu có lỗi
    await session.abortTransaction();
    session.endSession();

    console.error('Error creating order:', error);
    return res.status(500).json({ 
      error: 'An error occurred while processing your order.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy đơn hàng cho user đã đăng nhập
// @route   GET /api/orders/user/my-orders
// @access  Riêng tư
const getMyOrders = async (req, res) => {
  try {
    // Thông tin user có sẵn từ middleware protect
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
    
    // Nếu không tìm thấy đơn hàng theo userId, thử tìm theo email (tương thích ngược)
    if (orders.length === 0 && req.user.email) {
      orders = await Order.find({ 'customerInfo.email': req.user.email })
        .sort({ createdAt: -1 })
        .lean();
    }
    
    console.log(`Found ${orders.length} orders for user`);

    // Lấy chi tiết đơn hàng cho mỗi đơn hàng
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

// @desc    Lấy đơn hàng theo user ID
// @route   GET /api/orders/user/:userId
// @access  Công khai
const getOrdersByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Kiểm tra định dạng userId (ObjectId hợp lệ)
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

// @desc    Lấy đơn hàng theo ID
// @route   GET /api/orders/:id
// @access  Công khai
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

// @desc    Lấy tất cả đơn hàng với phân trang
// @route   GET /api/orders
// @access  Riêng tư/Quản trị viên
const getAllOrders = async (req, res) => {
  try {
    // Extract pagination parameters from the query string
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Build filter for status if provided
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Get total count of orders for pagination info
    const totalOrders = await Order.countDocuments(filter);

    // Fetch orders with pagination
    const orders = await Order.find(filter)
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
 * Lấy thống kê đơn hàng cho dashboard
 * @route GET /api/orders/stats
 * @access Riêng tư/Quản trị viên/Nhân viên
 */
const getOrderStats = async (req, res) => {
  try {
    // Tính tổng doanh thu
    const revenue = await Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    
    const totalRevenue = revenue.length > 0 ? revenue[0].total : 0;

    // Đếm đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Định dạng kết quả
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

    // Lấy đơn hàng trong tháng hiện tại
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
 * Lấy đơn hàng gần đây cho dashboard
 * @route GET /api/orders/recent
 * @access Riêng tư/Quản trị viên/Nhân viên
 */
const getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 5;
    
    // Lấy đơn hàng gần đây nhất
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Lấy chi tiết đơn hàng cho mỗi đơn hàng
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

// @desc    Cập nhật trạng thái đơn hàng
// @route   PATCH /api/orders/:id/status
// @access  Riêng tư/Quản trị viên/Nhân viên
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Xác thực trạng thái
    if (!status || !['processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    // Cập nhật trạng thái đơn hàng
    order.status = status;
    await order.save();
    
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
    
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating order status',
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
  getRecentOrders,
  updateOrderStatus
};