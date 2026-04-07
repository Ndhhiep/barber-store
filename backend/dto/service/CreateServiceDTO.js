class CreateServiceDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.price = data.price;
    this.description = data.description;
    this.duration = data.duration;
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Name is required');
    if (this.price === undefined || this.price === null) errors.push('Price is required');
    if (!this.description) errors.push('Description is required');
    if (!this.duration) errors.push('Duration is required');
    if (this.duration && (this.duration < 15 || this.duration > 240)) {
      errors.push('Duration must be between 15 and 240 minutes');
    }
    return errors;
  }
}

module.exports = CreateServiceDTO;
