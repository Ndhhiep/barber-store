/**
 * Test script for booking functionality
 * Tests the actual booking process to debug email service names
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models and services
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const Barber = require('../models/Barber');

async function testBooking() {
  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/barber-store');
    console.log('✅ Database connected successfully');

    // Get available services
    console.log('\n📋 Fetching available services...');
    const services = await Service.find({}).limit(3);
    console.log('Available services:', services.map(s => ({ id: s._id, name: s.name })));

    // Get available barber
    console.log('\n👨‍💼 Fetching available barber...');
    const barber = await Barber.findOne({});
    console.log('Available barber:', barber ? { id: barber._id, name: barber.name } : 'No barber found');

    if (!services.length || !barber) {
      console.error('❌ Need at least 1 service and 1 barber to test booking');
      return;
    }

    // Test booking data
    const bookingData = {
      services: [services[0]._id, services[1]._id], // Use actual service ObjectIds
      barber_id: barber._id,
      date: new Date('2025-06-02'),
      time: '10:00',
      name: 'Test User',
      email: 'hiep.ndh1112k@gmail.com',
      phone: '0933591901',
      notes: 'Test booking for email debugging',
      requireEmailConfirmation: true
    };

    console.log('\n🧪 Testing booking creation with email confirmation...');
    console.log('Service IDs being sent:', bookingData.services);

    // Simulate the booking controller logic manually
    console.log('\n📝 Creating booking...');
    
    // Create booking
    const booking = new Booking({
      services: bookingData.services,
      barber_id: bookingData.barber_id,
      date: bookingData.date,
      time: bookingData.time,
      duration: 60, // Default duration
      occupiedTimeSlots: ['10:00', '10:30'],
      name: bookingData.name,
      email: bookingData.email,
      phone: bookingData.phone,
      notes: bookingData.notes,
      status: 'pending'
    });

    const createdBooking = await booking.save();
    console.log('✅ Booking created with ID:', createdBooking._id);

    // Populate booking
    console.log('\n🔄 Populating booking with services...');
    const populatedBooking = await Booking.findById(createdBooking._id)
      .populate('barber_id', 'name specialization')
      .populate('services', 'name price duration description');

    console.log('Populated booking services:', populatedBooking.services);
    console.log('Service names:', populatedBooking.services.map(s => s.name));

    // Clean up - delete the test booking
    await Booking.findByIdAndDelete(createdBooking._id);
    console.log('\n🧹 Test booking cleaned up');

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error in booking test:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
console.log('🧪 Starting booking test...');
console.log('=' .repeat(50));
testBooking();
