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
      userId, 
      customerInfo, 
      items, 
      totalAmount, 
      shippingAddress, 
      paymentMethod, 
      notes 
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

    // Create new order
    const newOrder = new Order({
      userId,
      customerInfo,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes,
      status: 'pending'
    });

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

module.exports = {
  createOrder,
};