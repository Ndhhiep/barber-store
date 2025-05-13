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
      // Set expiration to 24 hours from now
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

// Set indexes
tokenSchema.index({ token: 1 }, { unique: true });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;
