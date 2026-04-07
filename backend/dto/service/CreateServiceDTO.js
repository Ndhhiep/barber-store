class CreateServiceDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.price = data.price;
    this.description = data.description;
    this.duration = data.duration;
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Tên dịch vụ là bắt buộc');
    if (this.price === undefined || this.price === null) errors.push('Giá dịch vụ là bắt buộc');
    if (!this.description) errors.push('Mô tả dịch vụ là bắt buộc');
    if (!this.duration) errors.push('Thời gian dịch vụ là bắt buộc');
    if (this.duration && (this.duration < 15 || this.duration > 240)) {
      errors.push('Thời gian dịch vụ phải từ 15 đến 240 phút');
    }
    return errors;
  }
}

module.exports = CreateServiceDTO;
