const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: function() {
      // Đặt thời gian hết hạn là 24 giờ kể từ bây giờ
      const now = new Date();
      now.setHours(now.getHours() + 24);
      return now;
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Thiết lập chỉ mục
tokenSchema.index({ token: 1 }, { unique: true });
// Chỉ mục TTL để tự động xoá bản ghi
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); 

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
