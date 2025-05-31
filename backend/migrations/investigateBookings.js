const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('../models/Booking');

const investigateBookings = async () => {
  try {
    console.log('🔍 Investigating booking structure...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get a few sample bookings to see their structure
    const sampleBookings = await Booking.find({}).limit(5).lean();
    
    console.log('\n📋 Sample bookings structure:');
    sampleBookings.forEach((booking, index) => {
      console.log(`\n--- Booking ${index + 1} (ID: ${booking._id}) ---`);
      console.log('Fields present:', Object.keys(booking));
      console.log('services:', booking.services);
      console.log('service:', booking.service);
      console.log('serviceName:', booking.serviceName);
      console.log('serviceNames:', booking.serviceNames);
      
      // Log all fields that might contain service data
      Object.keys(booking).forEach(key => {
        if (key.toLowerCase().includes('service')) {
          console.log(`${key}:`, booking[key]);
        }
      });
    });

    // Check for bookings with non-empty services that are strings
    const bookingsWithStringServices = await Booking.find({
      $or: [
        { services: { $type: "string" } },
        { services: { $elemMatch: { $type: "string" } } }
      ]
    }).limit(3).lean();

    console.log('\n📋 Bookings with string services:');
    bookingsWithStringServices.forEach((booking, index) => {
      console.log(`\n--- String Service Booking ${index + 1} (ID: ${booking._id}) ---`);
      console.log('services:', booking.services);
      console.log('All fields:', booking);
    });

    // Check if there are any bookings with service field instead of services
    const bookingsWithServiceField = await Booking.find({
      service: { $exists: true }
    }).limit(3).lean();

    console.log('\n📋 Bookings with "service" field:');
    bookingsWithServiceField.forEach((booking, index) => {
      console.log(`\n--- Service Field Booking ${index + 1} (ID: ${booking._id}) ---`);
      console.log('service:', booking.service);
      console.log('services:', booking.services);
    });

    // Get total counts
    const totalBookings = await Booking.countDocuments();
    const bookingsWithEmptyServices = await Booking.countDocuments({
      $or: [
        { services: { $exists: false } },
        { services: null },
        { services: [] },
        { services: undefined }
      ]
    });

    console.log('\n📊 Statistics:');
    console.log(`Total bookings: ${totalBookings}`);
    console.log(`Bookings with empty/missing services: ${bookingsWithEmptyServices}`);

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the investigation if this file is executed directly
if (require.main === module) {
  investigateBookings()
    .then(() => {
      console.log('Investigation script finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Investigation script failed:', error);
      process.exit(1);
    });
}

module.exports = investigateBookings;
