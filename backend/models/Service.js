const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true
    },
    price: {
      type: Number,
      required: [true, 'Service price is required'],
      min: [0, 'Price cannot be negative']
    },    description: {
      type: String,
      required: [true, 'Service description is required'],
      trim: true
    },    duration: {
      type: Number,
      required: [true, 'Service duration is required'],
      min: [15, 'Duration cannot be less than 15 minutes'],
      max: [240, 'Duration cannot be more than 240 minutes']
      // Removed default value to ensure duration is always explicitly provided
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;