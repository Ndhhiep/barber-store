class TimeSlotQueryDTO {
  constructor(query = {}) {
    this.date = query.date;
    this.barberId = query.barberId;
    this.services = query.services || null;
    this.excludeBookingId = query.excludeBookingId || null;
  }

  validate() {
    const errors = [];
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (!this.date) {
      errors.push('Vui lòng cung cấp ngày để kiểm tra khung giờ');
    } else if (!datePattern.test(this.date)) {
      errors.push('Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD');
    }

    if (!this.barberId) {
      errors.push('Vui lòng cung cấp ID barber để kiểm tra khung giờ');
    }

    return errors;
  }
}

module.exports = TimeSlotQueryDTO;
