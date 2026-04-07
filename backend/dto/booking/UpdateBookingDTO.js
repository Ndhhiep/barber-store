const mongoose = require('mongoose');

class UpdateBookingDTO {
  constructor(data = {}) {
    this.customerName = data.customerName;
    this.customerPhone = data.customerPhone;
    this.customerEmail = data.customerEmail;
    this.services = data.services;
    this.barberId = data.barberId;
    this.date = data.date;
    this.time = data.time;
    this.notes = data.notes;
  }

  validate() {
    const errors = [];

    if (this.barberId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(this.barberId)) {
        errors.push('Invalid Barber ID format');
      }
    }

    if (this.services !== undefined) {
      if (!Array.isArray(this.services) || this.services.length === 0) {
        errors.push('Services must be a non-empty array');
      } else {
        for (const id of this.services) {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            errors.push(`Invalid Service ID format: ${id}`);
          }
        }
      }
    }

    return errors;
  }
}

module.exports = UpdateBookingDTO;
