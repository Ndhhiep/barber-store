const mongoose = require('mongoose');
const Booking = require('./Booking');

const barberSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: false
  },
  specialization: {
    type: String,
    required: false
  },
  imgURL: {
    type: String,
    required: false
  },
  is_active: {
    type: Boolean,
    default: true
  },
  // Cấu hình ngày làm việc
  workingDays: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: true },
    sunday: { type: Boolean, default: false }
  },
  // Cấu hình giờ làm việc
  workingHours: {
    start: { type: String, default: '09:00' },
    end: { type: String, default: '19:00' }
  }
}, {
  timestamps: true
});

// Phương thức kiểm tra barber có sẵn cho khung giờ cụ thể
barberSchema.methods.isAvailable = async function(date, timeSlot) {
  try {
    // Kiểm tra barber có làm việc trong ngày này
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (!this.workingDays[dayOfWeek]) {
      return false;
    }
    
    // Kiểm tra khung giờ có nằm trong giờ làm việc
    const [hour, minute] = timeSlot.split(':').map(Number);
    const [startHour, startMinute] = this.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = this.workingHours.end.split(':').map(Number);
    
    const slotTime = hour * 60 + minute;
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    
    if (slotTime < startTime || slotTime >= endTime) {
      return false;
    }
    
    // Kiểm tra xem đã có đặt chỗ cho khung giờ này chưa
    const existingBooking = await Booking.findOne({
      barber_id: this._id,
      date: {
        $gte: new Date(`${date}T00:00:00.000Z`),
        $lt: new Date(`${date}T23:59:59.999Z`)
      },
      time: timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    });
    
    return !existingBooking;
  } catch (error) {
    console.error('Error checking barber availability:', error);
    return false;
  }
};

const Barber = mongoose.model('Barber', barberSchema);

module.exports = Barber;