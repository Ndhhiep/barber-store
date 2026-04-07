class RegisterDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.phone = data.phone || null;
    this.role = data.role || 'user';
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Name is required');
    if (!this.email) errors.push('Email is required');
    if (!this.password) errors.push('Password is required');
    if (this.password && this.password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    return errors;
  }
}

module.exports = RegisterDTO;
