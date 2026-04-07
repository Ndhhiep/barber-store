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
    if (!this.name) errors.push('Tên là bắt buộc');
    if (!this.email) errors.push('Email là bắt buộc');
    if (!this.password) errors.push('Mật khẩu là bắt buộc');
    if (this.password && this.password.length < 6) {
      errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }
    return errors;
  }
}

module.exports = RegisterDTO;
