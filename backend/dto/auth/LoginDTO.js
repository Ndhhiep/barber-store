class LoginDTO {
  constructor(data = {}) {
    this.email = data.email;
    this.password = data.password;
  }

  validate() {
    const errors = [];
    if (!this.email) errors.push('Email là bắt buộc');
    if (!this.password) errors.push('Mật khẩu là bắt buộc');
    return errors;
  }
}

module.exports = LoginDTO;
