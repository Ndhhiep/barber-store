const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng nhập tên của bạn'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ email'],
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Địa chỉ email không hợp lệ']
  },
  phone: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung tin nhắn'],
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'archived'],
    default: 'new'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', ContactSchema);
