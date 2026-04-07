class CreateContactDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone || '';
    this.message = data.message;
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Tên là bắt buộc');
    if (!this.email) errors.push('Email là bắt buộc');
    if (!this.message) errors.push('Nội dung tin nhắn là bắt buộc');
    return errors;
  }
}

module.exports = CreateContactDTO;
