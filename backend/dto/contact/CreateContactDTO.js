class CreateContactDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone || '';
    this.message = data.message;
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Name is required');
    if (!this.email) errors.push('Email is required');
    if (!this.message) errors.push('Message is required');
    return errors;
  }
}

module.exports = CreateContactDTO;
