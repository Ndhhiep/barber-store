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
      errors.push('Services is required and must be a non-empty array');
    } else {
      for (const id of this.services) {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push(`Invalid Service ID format: ${id}`);
        }
      }
    }

    if (!this.barber_id) {
      errors.push('Barber ID is required');
    } else if (!mongoose.Types.ObjectId.isValid(this.barber_id)) {
      errors.push('Invalid Barber ID format');
    }

    if (!this.date) errors.push('Date is required');
    if (!this.time) errors.push('Time is required');
    if (!this.name) errors.push('Name is required');
    if (!this.email) errors.push('Email is required');
    if (!this.phone) errors.push('Phone is required');

    return errors;
  }
}

module.exports = CreateBookingDTO;
