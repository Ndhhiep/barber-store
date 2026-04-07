class CreateBarberDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.phone = data.phone;
    this.email = data.email;
    this.description = data.description || '';
    this.specialization = data.specialization || '';
    this.image_url = data.image_url || null;
    this.is_active = data.is_active !== undefined ? data.is_active : true;
    this.workingDays = data.workingDays || null;
    this.workingHours = data.workingHours || null;
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Name is required');
    if (!this.phone) errors.push('Phone is required');
    if (!this.email) errors.push('Email is required');
    return errors;
  }
}

module.exports = CreateBarberDTO;
