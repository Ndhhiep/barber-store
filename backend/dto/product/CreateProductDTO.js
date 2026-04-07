class CreateProductDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.description = data.description || '';
    this.price = data.price;
    this.category = data.category || '';
    this.stock = data.stock !== undefined ? data.stock : 0;
    this.imageUrl = null; // gán sau khi upload lên cloudinary
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Name is required');
    if (this.price === undefined || this.price === null) errors.push('Price is required');
    if (this.price !== undefined && this.price < 0) errors.push('Price must be non-negative');
    return errors;
  }
}

module.exports = CreateProductDTO;
