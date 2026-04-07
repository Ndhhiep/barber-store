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
      errors.push('Please provide date to check time slots');
    } else if (!datePattern.test(this.date)) {
      errors.push('Invalid date format. Please use YYYY-MM-DD');
    }

    if (!this.barberId) {
      errors.push('Please provide barber ID to check time slots');
    }

    return errors;
  }
}

module.exports = TimeSlotQueryDTO;
