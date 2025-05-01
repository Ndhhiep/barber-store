const mongoose = require('mongoose');

const bookingSchema = mongoose.Schema({
  service: {
    type: String,
    required: true
  },
  barber: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
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
  timestamps: true
});

const Booking = mongoose.model('Booking', bookingSchema, 'bookinglist');

module.exports = Booking;