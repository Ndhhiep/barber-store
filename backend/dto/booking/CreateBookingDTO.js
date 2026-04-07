const mongoose = require('mongoose');

class CreateBookingDTO {
  constructor(data = {}) {
    this.services = data.services;
    this.barber_id = data.barber_id;
    this.date = data.date;
    this.time = data.time;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.notes = data.notes || '';
    this.user_id = data.user_id || null;
    this.requireEmailConfirmation = data.requireEmailConfirmation || false;
  }

  validate() {
    const errors = [];

    if (!this.services || !Array.isArray(this.services) || this.services.length === 0) {
      errors.push('Services là bắt buộc và phải là mảng không rỗng');
    } else {
      for (const id of this.services) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push(`Định dạng Service ID không hợp lệ: ${id}`);
        }
      }
    }

    if (!this.barber_id) {
      errors.push('Barber ID là bắt buộc');
    } else if (!mongoose.Types.ObjectId.isValid(this.barber_id)) {
      errors.push('Định dạng Barber ID không hợp lệ');
    }

    if (!this.date) errors.push('Ngày là bắt buộc');
    if (!this.time) errors.push('Giờ là bắt buộc');
    if (!this.name) errors.push('Tên là bắt buộc');
    if (!this.email) errors.push('Email là bắt buộc');
    if (!this.phone) errors.push('Số điện thoại là bắt buộc');

    return errors;
  }
}

module.exports = CreateBookingDTO;
