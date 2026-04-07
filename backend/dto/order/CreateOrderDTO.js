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

    if (!this.customerInfo) errors.push('Thông tin khách hàng là bắt buộc');
    if (!this.items || !Array.isArray(this.items) || this.items.length === 0) {
      errors.push('Danh sách sản phẩm không được rỗng');
    }
    if (!this.totalAmount || this.totalAmount <= 0) errors.push('Tổng tiền không hợp lệ');
    if (!this.shippingAddress) errors.push('Địa chỉ giao hàng là bắt buộc');
    if (!this.paymentMethod) errors.push('Phương thức thanh toán là bắt buộc');

    if (this.userId && !mongoose.Types.ObjectId.isValid(this.userId)) {
      errors.push('Định dạng User ID không hợp lệ');
    }

    return errors;
  }
}

module.exports = CreateOrderDTO;
