const mongoose = require('mongoose');

class CreateOrderDTO {
  constructor(data = {}) {
    this.customerInfo = data.customerInfo;
    this.items = data.items;
    this.totalAmount = data.totalAmount;
    this.shippingAddress = data.shippingAddress;
    this.paymentMethod = data.paymentMethod;
    this.notes = data.notes || '';
    this.userId = data.userId || null;
  }

  validate() {
    const errors = [];

    if (!this.customerInfo) errors.push('Customer info is required');
    if (!this.items || !Array.isArray(this.items) || this.items.length === 0) {
      errors.push('Items list is required and must be non-empty');
    }
    if (!this.totalAmount || this.totalAmount <= 0) errors.push('Total amount is invalid');
    if (!this.shippingAddress) errors.push('Shipping address is required');
    if (!this.paymentMethod) errors.push('Payment method is required');

    if (this.userId && !mongoose.Types.ObjectId.isValid(this.userId)) {
      errors.push('Invalid User ID format');
    }

    return errors;
  }
}

module.exports = CreateOrderDTO;
