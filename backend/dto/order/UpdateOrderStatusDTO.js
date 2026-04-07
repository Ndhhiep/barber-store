const VALID_ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

class UpdateOrderStatusDTO {
  constructor(data = {}) {
    this.status = data.status;
  }

  validate() {
    const errors = [];
    if (!this.status || !VALID_ORDER_STATUSES.includes(this.status)) {
      errors.push(`Invalid status. Valid values: ${VALID_ORDER_STATUSES.join(', ')}`);
    }
    return errors;
  }
}

module.exports = UpdateOrderStatusDTO;
