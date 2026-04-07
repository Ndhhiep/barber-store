const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Product = require('../models/Product');

// ─── Private: lấy chi tiết đơn hàng kèm sản phẩm ───────────────────────────

const _withDetails = async (order) => {
  const orderDetails = await OrderDetail.find({ orderId: order._id })
    .populate('productId', 'name price imageUrl')
    .lean();
  return { ...order, items: orderDetails };
};

// ─── CREATE ORDER (transaction) ──────────────────────────────────────────────

const createOrder = async (dto) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Kiểm tra tồn kho từng sản phẩm
    for (const item of dto.items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        throw Object.assign(new Error(`Không tìm thấy sản phẩm: ${item.productId}`), { statusCode: 404 });
      }
      if (product.quantity < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        throw Object.assign(
          new Error(`Không đủ hàng: ${product.name}. Yêu cầu: ${item.quantity}, Còn lại: ${product.quantity}`),
          { statusCode: 409 }
        );
      }
    }

    const orderData = {
      customerInfo: dto.customerInfo,
      totalAmount: dto.totalAmount,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod,
      notes: dto.notes,
      status: 'pending',
    };

    if (dto.userId && mongoose.Types.ObjectId.isValid(dto.userId)) {
      orderData.userId = dto.userId;
    }

    const newOrder = new Order(orderData);
    const savedOrder = await newOrder.save({ session });

    for (const item of dto.items) {
      await new OrderDetail({
        orderId: savedOrder._id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
      }).save({ session });

      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } },
        { session, new: true, runValidators: true }
      );
    }

    await session.commitTransaction();
    session.endSession();

    return { orderId: savedOrder._id };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ─── GET MY ORDERS ───────────────────────────────────────────────────────────

const getMyOrders = async (userId, userEmail) => {
  let orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

  // Fallback: tìm theo email nếu không có theo userId
  if (orders.length === 0 && userEmail) {
    orders = await Order.find({ 'customerInfo.email': userEmail }).sort({ createdAt: -1 }).lean();
  }

  return Promise.all(orders.map(_withDetails));
};

// ─── GET ORDERS BY USER ID ───────────────────────────────────────────────────

const getOrdersByUserId = async (userId) => {
  const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
  return Promise.all(orders.map(_withDetails));
};

// ─── GET ORDER BY ID ─────────────────────────────────────────────────────────

const getOrderById = async (id) => {
  const order = await Order.findById(id).lean();
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
  return _withDetails(order);
};

// ─── GET ALL ORDERS (paginated) ──────────────────────────────────────────────

const getAllOrders = async (filter, pagination) => {
  const { page, limit, skip } = pagination;
  const totalOrders = await Order.countDocuments(filter);
  const orders = await Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const data = await Promise.all(orders.map(_withDetails));

  return {
    count: data.length,
    total: totalOrders,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page,
    data,
  };
};

// ─── GET ORDER STATS ─────────────────────────────────────────────────────────

const getOrderStats = async () => {
  const [revenue, ordersByStatus, totalOrders, monthlyOrders] = await Promise.all([
    Order.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
  ]);

  const statusCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  ordersByStatus.forEach((item) => {
    if (item._id && Object.prototype.hasOwnProperty.call(statusCounts, item._id)) {
      statusCounts[item._id] = item.count;
    }
  });

  return {
    totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
    totalOrders,
    ...Object.fromEntries(Object.entries(statusCounts).map(([k, v]) => [`${k}Orders`, v])),
    monthlyOrders,
  };
};

// ─── GET RECENT ORDERS ───────────────────────────────────────────────────────

const getRecentOrders = async (limit = 5) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(limit).lean();
  return Promise.all(orders.map(_withDetails));
};

// ─── UPDATE ORDER STATUS ─────────────────────────────────────────────────────

const updateOrderStatus = async (id, status) => {
  const order = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });
  order.status = status;
  return order.save();
};

// ─── CANCEL ORDER ────────────────────────────────────────────────────────────

const cancelOrder = async (id, userId) => {
  const order = await Order.findById(id);
  if (!order) throw Object.assign(new Error('Không tìm thấy đơn hàng'), { statusCode: 404 });

  if (order.userId && order.userId.toString() !== userId.toString()) {
    throw Object.assign(new Error('Bạn không có quyền hủy đơn hàng này'), { statusCode: 403 });
  }
  if (order.status === 'cancelled') throw Object.assign(new Error('Đơn hàng đã bị hủy'), { statusCode: 400 });
  if (order.status === 'delivered') throw Object.assign(new Error('Không thể hủy đơn đã giao'), { statusCode: 400 });
  if (order.status === 'shipped') {
    throw Object.assign(new Error('Không thể hủy đơn đang giao. Vui lòng liên hệ hỗ trợ.'), { statusCode: 400 });
  }

  order.status = 'cancelled';
  return order.save();
};

// ─── BUILD FILTER / PAGINATION ───────────────────────────────────────────────

const buildOrderFilter = (query) => {
  const filter = {};
  if (query.status) filter.status = query.status;
  return filter;
};

const buildPagination = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrdersByUserId,
  getOrderById,
  getAllOrders,
  getOrderStats,
  getRecentOrders,
  updateOrderStatus,
  cancelOrder,
  buildOrderFilter,
  buildPagination,
};
