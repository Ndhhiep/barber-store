const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Không đặt là required vì các đơn hàng cũ có thể không có trường này
    },
    customerInfo: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    shippingAddress: {
      type: String,
      required: true,
      trim: true
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit', 'paypal', 'cod'], // Thanh toán khi nhận hàng
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      required: true,
      default: 'pending',
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;