const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  service: {
    type: String,
    required: true
  },
  barber_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true // Thay đổi từ false thành true vì giờ bắt buộc phải có
  },
  date: {
    type: Date,
    required: true,
    // Getter để đảm bảo ngày được hiển thị đúng theo múi giờ Việt Nam
    get: function(date) {
      return date;
    }
  },
  time: {
    type: String,
    required: true
  },
  // Thêm trường fullDateTime để tính toán thời gian chính xác
  fullDateTime: {
    type: Date,
    required: false
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Can be null if booking is made without logging in
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { getters: true }, // Kích hoạt getters khi chuyển đổi sang JSON
  toObject: { getters: true } // Kích hoạt getters khi chuyển đổi sang object
});

// Middleware trước khi lưu để tạo fullDateTime từ date và time
bookingSchema.pre('save', function(next) {
  if (this.date && this.time) {
    const [hours, minutes] = this.time.split(':').map(Number);
    const dateTime = new Date(this.date);
    dateTime.setHours(hours, minutes, 0, 0);
    this.fullDateTime = dateTime;
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookinglist');

module.exports = Booking;