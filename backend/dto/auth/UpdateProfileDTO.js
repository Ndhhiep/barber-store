class UpdateProfileDTO {
  constructor(data = {}) {
    this.name = data.name || null;
    this.phone = data.phone || null;
  }

  validate() {
    const errors = [];
    if (!this.name && !this.phone) {
      errors.push('Please provide at least one field to update (name or phone)');
    }
    return errors;
  }

  toUpdate() {
    const update = {};
    if (this.name) update.name = this.name;
    if (this.phone) update.phone = this.phone;
    return update;
  }
}

module.exports = UpdateProfileDTO;
