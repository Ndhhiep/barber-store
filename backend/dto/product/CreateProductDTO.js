class CreateProductDTO {
  constructor(data = {}) {
    this.name = data.name;
    this.description = data.description || '';
    this.price = data.price;
    this.category = data.category || '';
    this.stock = data.stock !== undefined ? data.stock : 0;
    this.imageUrl = null; // set after Cloudinary upload
  }

  validate() {
    const errors = [];
    if (!this.name) errors.push('Tên sản phẩm là bắt buộc');
    if (this.price === undefined || this.price === null) errors.push('Giá sản phẩm là bắt buộc');
    if (this.price !== undefined && this.price < 0) errors.push('Giá sản phẩm không được âm');
    return errors;
  }
}

module.exports = CreateProductDTO;
