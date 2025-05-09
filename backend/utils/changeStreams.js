const mongoose = require('mongoose');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const { broadcastChange } = require('./socketIO');

/**
 * Watch for changes in the Orders collection
 * @returns {Promise<void>}
 */
const watchOrders = async () => {
  try {
    console.log('Starting Order change stream...');
    
    // Get a reference to the Orders collection through the Mongoose model
    const ordersCollection = Order.collection;
    
    // Create a change stream on the orders collection
    const changeStream = ordersCollection.watch(
      // Pipeline to filter operations (optional)
      [
        // Include all operation types
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
          }
        }
      ],
      // Options
      { fullDocument: 'updateLookup' } // Include the full updated document
    );
    
    // Set up event handlers for the change stream
    changeStream.on('change', (change) => {
      console.log('---------------------------------------------');
      console.log(`Order Change Event: ${change.operationType} at ${new Date().toISOString()}`);
      
      // Prepare data to broadcast
      let eventData;
      
      switch (change.operationType) {
        case 'insert':
          console.log('New order created:');
          console.log(`Order ID: ${change.fullDocument._id}`);
          console.log(`Customer: ${change.fullDocument.customerInfo?.name}`);
          console.log(`Amount: ${change.fullDocument.totalAmount}`);
          console.log(`Status: ${change.fullDocument.status}`);
          
          // Broadcast the new order to all connected clients
          eventData = {
            id: change.fullDocument._id,
            type: 'create',
            document: change.fullDocument
          };
          broadcastChange('order:created', eventData);
          break;
          
        case 'update':
          console.log('Order updated:');
          console.log(`Order ID: ${change.documentKey._id}`);
          
          // Log what fields were updated
          if (change.updateDescription && change.updateDescription.updatedFields) {
            console.log('Updated fields:');
            Object.keys(change.updateDescription.updatedFields).forEach(field => {
              console.log(`- ${field}: ${JSON.stringify(change.updateDescription.updatedFields[field])}`);
            });
          }
          
          // Log full updated document if available
          if (change.fullDocument) {
            console.log('Current order state:');
            console.log(`Status: ${change.fullDocument.status}`);
            console.log(`Total Amount: ${change.fullDocument.totalAmount}`);
          }
          
          // Broadcast the updated order
          eventData = {
            id: change.documentKey._id,
            type: 'update',
            updatedFields: change.updateDescription?.updatedFields || {},
            document: change.fullDocument
          };
          broadcastChange('order:updated', eventData);
          break;
          
        case 'delete':
          console.log('Order deleted:');
          console.log(`Order ID: ${change.documentKey._id}`);
          
          // Broadcast the deleted order
          eventData = {
            id: change.documentKey._id,
            type: 'delete'
          };
          broadcastChange('order:deleted', eventData);
          break;
          
        case 'replace':
          console.log('Order replaced:');
          console.log(`Order ID: ${change.fullDocument._id}`);
          console.log(`New state: ${JSON.stringify(change.fullDocument)}`);
          
          // Broadcast the replaced order
          eventData = {
            id: change.fullDocument._id,
            type: 'replace',
            document: change.fullDocument
          };
          broadcastChange('order:replaced', eventData);
          break;
      }

      // Broadcast generic 'newOrder' event for any kind of change
      // This conforms to the requested requirement to emit a single event type for all changes
      const genericEventData = {
        operationType: change.operationType,
        documentId: change.documentKey._id,
        timestamp: new Date().toISOString(),
        fullDocument: change.fullDocument || null,
        // Include updatedFields if it's an update operation
        ...(change.updateDescription && { 
          updateDescription: {
            updatedFields: change.updateDescription.updatedFields,
            removedFields: change.updateDescription.removedFields
          } 
        })
      };
      
      // Emit a generic 'newOrder' event for all types of changes to orders
      broadcastChange('newOrder', genericEventData);
      
      console.log('---------------------------------------------');
    });
    
    // Error handling
    changeStream.on('error', (error) => {
      console.error('Error in Order change stream:', error);
      
      // Close the current change stream
      changeStream.close();
      
      // Attempt to reconnect after a delay
      console.log('Attempting to reconnect Order change stream in 5 seconds...');
      setTimeout(() => {
        watchOrders().catch(err => console.error('Failed to restart Order change stream:', err));
      }, 5000);
    });
    
    // Handle when the change stream is closed
    changeStream.on('close', () => {
      console.log('Order change stream closed');
    });
    
    console.log('Order change stream established successfully');
    
    return changeStream;
  } catch (error) {
    console.error('Failed to establish Order change stream:', error);
    
    // Attempt to retry after delay
    console.log('Retrying Order change stream in 5 seconds...');
    setTimeout(() => {
      watchOrders().catch(err => console.error('Failed to restart Order change stream:', err));
    }, 5000);
  }
};

/**
 * Watch for changes in the Bookings collection
 * @returns {Promise<void>}
 */
const watchBookings = async () => {
  try {
    console.log('Starting Booking change stream...');
    
    // Get a reference to the Bookings collection through the Mongoose model
    const bookingsCollection = Booking.collection;
    
    // Create a change stream on the bookings collection
    const changeStream = bookingsCollection.watch(
      // Pipeline to filter operations (optional)
      [
        // Include all operation types
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
          }
        }
      ],
      // Options
      { fullDocument: 'updateLookup' } // Include the full updated document
    );
    
    // Set up event handlers for the change stream
    changeStream.on('change', (change) => {
      console.log('---------------------------------------------');
      console.log(`Booking Change Event: ${change.operationType} at ${new Date().toISOString()}`);
      
      // Prepare data to broadcast
      let eventData;
      
      switch (change.operationType) {
        case 'insert':
          console.log('New booking created:');
          console.log(`Booking ID: ${change.fullDocument._id}`);
          console.log(`User Name: ${change.fullDocument.userName || 'N/A'}`);
          console.log(`Service: ${change.fullDocument.serviceName || 'N/A'}`);
          console.log(`Date: ${change.fullDocument.date}`);
          console.log(`Time: ${change.fullDocument.time}`);
          console.log(`Status: ${change.fullDocument.status}`);
          
          // Broadcast the new booking
          eventData = {
            id: change.fullDocument._id,
            type: 'create',
            document: change.fullDocument
          };
          broadcastChange('booking:created', eventData);
          break;
          
        case 'update':
          console.log('Booking updated:');
          console.log(`Booking ID: ${change.documentKey._id}`);
          
          // Log what fields were updated
          if (change.updateDescription && change.updateDescription.updatedFields) {
            console.log('Updated fields:');
            Object.keys(change.updateDescription.updatedFields).forEach(field => {
              console.log(`- ${field}: ${JSON.stringify(change.updateDescription.updatedFields[field])}`);
            });
          }
          
          // Log full updated document if available
          if (change.fullDocument) {
            console.log('Current booking state:');
            console.log(`Status: ${change.fullDocument.status}`);
            console.log(`Date: ${change.fullDocument.date}`);
            console.log(`Time: ${change.fullDocument.time}`);
          }
          
          // Broadcast the updated booking
          eventData = {
            id: change.documentKey._id,
            type: 'update',
            updatedFields: change.updateDescription?.updatedFields || {},
            document: change.fullDocument
          };
          broadcastChange('booking:updated', eventData);
          break;
          
        case 'delete':
          console.log('Booking deleted:');
          console.log(`Booking ID: ${change.documentKey._id}`);
          
          // Broadcast the deleted booking
          eventData = {
            id: change.documentKey._id,
            type: 'delete'
          };
          broadcastChange('booking:deleted', eventData);
          break;
          
        case 'replace':
          console.log('Booking replaced:');
          console.log(`Booking ID: ${change.fullDocument._id}`);
          console.log(`New state: ${JSON.stringify(change.fullDocument)}`);
          
          // Broadcast the replaced booking
          eventData = {
            id: change.fullDocument._id,
            type: 'replace',
            document: change.fullDocument
          };
          broadcastChange('booking:replaced', eventData);
          break;
      }

      // Broadcast generic 'newBooking' event for any kind of change
      // This conforms to the requested requirement to emit a single event type for all changes
      const genericEventData = {
        operationType: change.operationType,
        documentId: change.documentKey._id,
        timestamp: new Date().toISOString(),
        fullDocument: change.fullDocument || null,
        // Include updatedFields if it's an update operation
        ...(change.updateDescription && { 
          updateDescription: {
            updatedFields: change.updateDescription.updatedFields,
            removedFields: change.updateDescription.removedFields
          } 
        })
      };
      
      // Emit a generic 'newBooking' event for all types of changes to bookings
      broadcastChange('newBooking', genericEventData);
      
      console.log('---------------------------------------------');
    });
    
    // Error handling
    changeStream.on('error', (error) => {
      console.error('Error in Booking change stream:', error);
      
      // Close the current change stream
      changeStream.close();
      
      // Attempt to reconnect after a delay
      console.log('Attempting to reconnect Booking change stream in 5 seconds...');
      setTimeout(() => {
        watchBookings().catch(err => console.error('Failed to restart Booking change stream:', err));
      }, 5000);
    });
    
    // Handle when the change stream is closed
    changeStream.on('close', () => {
      console.log('Booking change stream closed');
    });
    
    console.log('Booking change stream established successfully');
    
    return changeStream;
  } catch (error) {
    console.error('Failed to establish Booking change stream:', error);
    
    // Attempt to retry after delay
    console.log('Retrying Booking change stream in 5 seconds...');
    setTimeout(() => {
      watchBookings().catch(err => console.error('Failed to restart Booking change stream:', err));
    }, 5000);
  }
};

/**
 * Initialize all change streams
 * This should be called after MongoDB connection is established
 */
const initializeChangeStreams = async () => {
  try {
    // Make sure we have a valid MongoDB connection that supports change streams
    // Change streams require a replica set or a sharded cluster
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.serverInfo();
    
    console.log(`MongoDB version: ${serverInfo.version}`);
    
    // Try to determine if change streams are supported
    if (serverInfo.version) {
      const majorVersion = parseInt(serverInfo.version.split('.')[0], 10);
      
      // Change streams are available in MongoDB 3.6+
      if (majorVersion < 3 || (majorVersion === 3 && parseInt(serverInfo.version.split('.')[1], 10) < 6)) {
        console.warn('WARNING: Your MongoDB version may not support change streams. Minimum required version is 3.6');
        console.warn('Change streams will not be initialized');
        return;
      }
      
      // For MongoDB Atlas or other hosted solutions, we can proceed since they use replica sets
      // For local MongoDB, we need to check if it's a replica set
      
      try {
        // Try to get replica set status (will fail if not a replica set)
        await adminDb.command({ replSetGetStatus: 1 });
        console.log('MongoDB replica set detected - Change Streams supported');
      } catch (error) {
        if (error.code === 13) {
          // Error code 13 means authentication failed but it might still be a replica set
          console.log('Could not verify replica set status due to authentication, assuming Change Streams are supported');
        } else {
          console.warn('WARNING: Your MongoDB instance may not be running as a replica set.');
          console.warn('Change Streams require a replica set or a sharded cluster.');
          console.warn('For development, you can enable replica set with: mongod --replSet rs0 --dbpath <your_data_directory>');
          console.warn('Then initialize the replica set with: rs.initiate()');
          console.warn('Change streams will not be initialized');
          return;
        }
      }
    }
    
    // Initialize change streams
    await Promise.all([
      watchOrders(),
      watchBookings()
    ]);
    
    console.log('All change streams initialized successfully');
  } catch (error) {
    console.error('Failed to initialize change streams:', error);
  }
};

module.exports = {
  initializeChangeStreams,
  watchOrders,
  watchBookings
};