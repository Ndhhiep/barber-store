const mongoose = require('mongoose');
const Service = require('../models/Service');
require('dotenv').config();

const updateServiceDuration = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all services without duration field or with null/undefined duration
    const servicesWithoutDuration = await Service.find({
      $or: [
        { duration: { $exists: false } },
        { duration: null },
        { duration: undefined }
      ]
    });

    console.log(`Found ${servicesWithoutDuration.length} services without duration`);

    if (servicesWithoutDuration.length > 0) {
      // Update all services without duration to have a default duration of 30 minutes
      const updateResult = await Service.updateMany(
        {
          $or: [
            { duration: { $exists: false } },
            { duration: null },
            { duration: undefined }
          ]
        },
        { $set: { duration: 30 } }
      );

      console.log(`Updated ${updateResult.modifiedCount} services with default duration of 30 minutes`);
    }

    // Display all services with their duration
    const allServices = await Service.find({}).select('name duration createdAt');
    console.log('\nAll services after update:');
    allServices.forEach(service => {
      console.log(`- ${service.name}: ${service.duration} minutes (created: ${service.createdAt})`);
    });

  } catch (error) {
    console.error('Error updating services:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run the script
updateServiceDuration();
