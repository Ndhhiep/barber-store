const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Booking = require('../models/Booking');
const Service = require('../models/Service');

const migrateBookingServices = async () => {
  try {
    console.log('🔄 Starting migration: Converting service names to ObjectIds in bookings...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Get all services to create a mapping
    const services = await Service.find({});
    const serviceMap = {};
    services.forEach(service => {
      serviceMap[service.name] = service._id;
    });
    
    console.log('📋 Available services:', Object.keys(serviceMap));    // Find all bookings that have string services (not ObjectIds)
    const bookingsToMigrate = await Booking.find({
      $or: [
        { services: { $type: "string" } },
        { services: { $elemMatch: { $type: "string" } } },
        { service: { $exists: true, $type: "string" } } // Also handle old 'service' field
      ]
    }).lean(); // Use lean() for better performance

    console.log(`🔍 Found ${bookingsToMigrate.length} bookings that need migration`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const booking of bookingsToMigrate) {
      try {
        console.log(`\n📝 Processing booking ${booking._id}:`);
        console.log(`   Current services:`, booking.services);
        console.log(`   Current service:`, booking.service);

        let newServices = [];

        // Handle the old 'service' field (single service)
        if (booking.service && typeof booking.service === 'string') {
          const serviceId = serviceMap[booking.service];
          if (serviceId) {
            newServices.push(serviceId);
            console.log(`   ✅ Mapped '${booking.service}' to ObjectId: ${serviceId}`);
          } else {
            console.log(`   ❌ Could not find service: '${booking.service}'`);
          }
        }

        // Handle the 'services' array
        if (booking.services && Array.isArray(booking.services)) {
          for (const serviceName of booking.services) {
            if (typeof serviceName === 'string') {
              const serviceId = serviceMap[serviceName];
              if (serviceId) {
                newServices.push(serviceId);
                console.log(`   ✅ Mapped '${serviceName}' to ObjectId: ${serviceId}`);
              } else {
                console.log(`   ❌ Could not find service: '${serviceName}'`);
              }
            } else {
              // Already an ObjectId, keep it
              newServices.push(serviceName);
              console.log(`   ✅ Kept existing ObjectId: ${serviceName}`);
            }
          }
        }

        // Ensure we have at least one service
        if (newServices.length === 0) {
          console.log(`   ⚠️  No valid services found, skipping booking ${booking._id}`);
          errorCount++;
          continue;
        }

        // Update the booking
        const updateData = {
          services: newServices
        };

        // Remove the old 'service' field if it exists
        if (booking.service) {
          updateData.$unset = { service: 1 };
        }

        await Booking.updateOne(
          { _id: booking._id },
          updateData
        );

        console.log(`   ✅ Updated booking ${booking._id} with services:`, newServices);
        migratedCount++;

      } catch (error) {
        console.error(`   ❌ Error processing booking ${booking._id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully migrated: ${migratedCount} bookings`);
    console.log(`❌ Failed to migrate: ${errorCount} bookings`);

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    const remainingStringServices = await Booking.find({
      $or: [
        { services: { $type: "string" } },
        { services: { $elemMatch: { $type: "string" } } },
        { service: { $exists: true } }
      ]
    });

    if (remainingStringServices.length === 0) {
      console.log('✅ All bookings have been successfully migrated!');
    } else {
      console.log(`⚠️  ${remainingStringServices.length} bookings still have string services:`, remainingStringServices.map(b => b._id));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateBookingServices()
    .then(() => {
      console.log('Migration script finished');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateBookingServices;
