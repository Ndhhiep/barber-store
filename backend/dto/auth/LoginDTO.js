class LoginDTO {
  constructor(data = {}) {
    this.email = data.email;
    this.password = data.password;
  }

  validate() {
    const errors = [];
    if (!this.email) errors.push('Email is required');
    if (!this.password) errors.push('Password is required');
    return errors;
  }
}

module.exports = LoginDTO;
