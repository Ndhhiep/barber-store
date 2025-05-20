const mongoose = require('mongoose');
const Order = require('../models/Order');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const User = require('../models/User');
const { broadcastChange } = require('./socketIO');

/**
 * Theo dõi thay đổi trong collection Orders
 * @returns {Promise<void>}
 */
const watchOrders = async () => {
  try {
    console.log('Starting Order change stream...');
    
    // Lấy tham chiếu tới collection Orders qua Mongoose model
    const ordersCollection = Order.collection;
    
    // Tạo change stream trên collection Orders
    const changeStream = ordersCollection.watch(
      // Pipeline để lọc các thao tác (tuỳ chọn)
      [
        // Bao gồm tất cả các loại thao tác
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
          }
        }
      ],
      // Tuỳ chọn
      { fullDocument: 'updateLookup' } // Bao gồm toàn bộ tài liệu đã được cập nhật
    );
    
    // Thiết lập event handlers cho change stream
    changeStream.on('change', (change) => {
      console.log('---------------------------------------------');
      console.log(`Order Change Event: ${change.operationType} at ${new Date().toISOString()}`);
      
      // Chuẩn bị dữ liệu để phát
      let eventData;
      
      switch (change.operationType) {
        case 'insert':
          console.log('New order created:');
          console.log(`Order ID: ${change.fullDocument._id}`);
          console.log(`Customer: ${change.fullDocument.customerInfo?.name}`);
          console.log(`Amount: ${change.fullDocument.totalAmount}`);
          console.log(`Status: ${change.fullDocument.status}`);
          
          // Phát đơn hàng mới tới tất cả client đã kết nối
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
          
          // Ghi log các trường đã được cập nhật
          if (change.updateDescription && change.updateDescription.updatedFields) {
            console.log('Updated fields:');
            Object.keys(change.updateDescription.updatedFields).forEach(field => {
              console.log(`- ${field}: ${JSON.stringify(change.updateDescription.updatedFields[field])}`);
            });
          }
          
          // Ghi log toàn bộ tài liệu sau khi cập nhật nếu có
          if (change.fullDocument) {
            console.log('Current order state:');
            console.log(`Status: ${change.fullDocument.status}`);
            console.log(`Total Amount: ${change.fullDocument.totalAmount}`);
          }
          
          // Phát đơn hàng đã được cập nhật
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
          
          // Phát đơn hàng đã bị xoá
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
          
          // Phát đơn hàng đã bị thay thế
          eventData = {
            id: change.fullDocument._id,
            type: 'replace',
            document: change.fullDocument
          };
          broadcastChange('order:replaced', eventData);
          break;
      }

      // Phát sự kiện chung 'newOrder' cho mọi thay đổi
      const genericEventData = {
        operationType: change.operationType,
        documentId: change.documentKey._id,
        timestamp: new Date().toISOString(),
        fullDocument: change.fullDocument || null,
        ...(change.updateDescription && { 
          updateDescription: {
            updatedFields: change.updateDescription.updatedFields,
            removedFields: change.updateDescription.removedFields
          } 
        })
      };
      
      // Thực hiện theo yêu cầu phát một loại sự kiện duy nhất cho tất cả thay đổi
      broadcastChange('newOrder', genericEventData);
      
      console.log('---------------------------------------------');
    });
    
    // Xử lý lỗi
    changeStream.on('error', (error) => {
      console.error('Error in Order change stream:', error);
      
      // Đóng change stream hiện tại
      changeStream.close();
      
      // Thử kết nối lại sau một khoảng thời gian
      console.log('Attempting to reconnect Order change stream in 5 seconds...');
      setTimeout(() => {
        watchOrders().catch(err => console.error('Failed to restart Order change stream:', err));
      }, 5000);
    });
    
    // Xử lý khi change stream bị đóng
    changeStream.on('close', () => {
      console.log('Order change stream closed');
    });
    
    console.log('Order change stream established successfully');
    
    return changeStream;
  } catch (error) {
    console.error('Failed to establish Order change stream:', error);
    
    // Thử lại sau một khoảng thời gian
    console.log('Retrying Order change stream in 5 seconds...');
    setTimeout(() => {
      watchOrders().catch(err => console.error('Failed to restart Order change stream:', err));
    }, 5000);
  }
};

/**
 * Theo dõi thay đổi trong collection Bookings
 * @returns {Promise<void>}
 */
const watchBookings = async () => {
  try {
    console.log('Starting Booking change stream...');
    
    // Lấy tham chiếu tới collection Bookings qua Mongoose model
    const bookingsCollection = Booking.collection;
    
    // Tạo change stream trên collection Bookings
    const changeStream = bookingsCollection.watch(
      // Pipeline để lọc các thao tác (tuỳ chọn)
      [
        // Bao gồm tất cả các loại thao tác
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
          }
        }
      ],
      // Tuỳ chọn
      { fullDocument: 'updateLookup' } // Bao gồm toàn bộ tài liệu đã được cập nhật
    );
    
    // Thiết lập event handlers cho change stream
    changeStream.on('change', (change) => {
      console.log('---------------------------------------------');
      console.log(`Booking Change Event: ${change.operationType} at ${new Date().toISOString()}`);
      
      // Chuẩn bị dữ liệu để phát
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
          
          // Phát booking mới
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
          
          // Ghi log các trường đã được cập nhật
          if (change.updateDescription && change.updateDescription.updatedFields) {
            console.log('Updated fields:');
            Object.keys(change.updateDescription.updatedFields).forEach(field => {
              console.log(`- ${field}: ${JSON.stringify(change.updateDescription.updatedFields[field])}`);
            });
          }
          
          // Ghi log toàn bộ tài liệu sau khi cập nhật nếu có
          if (change.fullDocument) {
            console.log('Current booking state:');
            console.log(`Status: ${change.fullDocument.status}`);
            console.log(`Date: ${change.fullDocument.date}`);
            console.log(`Time: ${change.fullDocument.time}`);
          }
          
          // Phát booking đã được cập nhật
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
          
          // Phát booking đã bị xoá
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
          
          // Phát booking đã bị thay thế
          eventData = {
            id: change.fullDocument._id,
            type: 'replace',
            document: change.fullDocument
          };
          broadcastChange('booking:replaced', eventData);
          break;
      }

      // Phát sự kiện chung 'newBooking' cho mọi thay đổi
      const genericEventData = {
        operationType: change.operationType,
        documentId: change.documentKey._id,
        timestamp: new Date().toISOString(),
        fullDocument: change.fullDocument || null,
        ...(change.updateDescription && { 
          updateDescription: {
            updatedFields: change.updateDescription.updatedFields,
            removedFields: change.updateDescription.removedFields
          } 
        })
      };
      
      // Thực hiện theo yêu cầu phát một loại sự kiện duy nhất cho tất cả thay đổi
      broadcastChange('newBooking', genericEventData);
      
      console.log('---------------------------------------------');
    });
    
    // Xử lý lỗi
    changeStream.on('error', (error) => {
      console.error('Error in Booking change stream:', error);
      
      // Đóng change stream hiện tại
      changeStream.close();
      
      // Thử kết nối lại sau một khoảng thời gian
      console.log('Attempting to reconnect Booking change stream in 5 seconds...');
      setTimeout(() => {
        watchBookings().catch(err => console.error('Failed to restart Booking change stream:', err));
      }, 5000);
    });
    
    // Xử lý khi change stream bị đóng
    changeStream.on('close', () => {
      console.log('Booking change stream closed');
    });
    
    console.log('Booking change stream established successfully');
    
    return changeStream;
  } catch (error) {
    console.error('Failed to establish Booking change stream:', error);
    
    // Thử lại sau một khoảng thời gian
    console.log('Retrying Booking change stream in 5 seconds...');
    setTimeout(() => {
      watchBookings().catch(err => console.error('Failed to restart Booking change stream:', err));
    }, 5000);
  }
};

/**
 * Theo dõi thay đổi trong collection Contacts
 * @returns {Promise<void>}
 */
const watchContacts = async () => {
  try {
    console.log('Starting Contact change stream...');
    
    // Lấy tham chiếu tới collection Contacts qua Mongoose model
    const contactsCollection = Contact.collection;
    
    // Tạo change stream trên collection Contacts
    const changeStream = contactsCollection.watch(
      // Pipeline để lọc các thao tác (tuỳ chọn)
      [
        // Bao gồm tất cả các loại thao tác
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'delete', 'replace'] }
          }
        }
      ],
      // Tuỳ chọn
      { fullDocument: 'updateLookup' } // Bao gồm toàn bộ tài liệu đã được cập nhật
    );
    
    // Thiết lập event handlers cho change stream
    changeStream.on('change', (change) => {
      console.log('---------------------------------------------');
      console.log(`Contact Change Event: ${change.operationType} at ${new Date().toISOString()}`);
      
      // Chuẩn bị dữ liệu để phát
      let eventData;
      
      switch (change.operationType) {
        case 'insert':
          console.log('New contact created:');
          console.log(`Contact ID: ${change.fullDocument._id}`);
          console.log(`Name: ${change.fullDocument.name || 'N/A'}`);
          console.log(`Email: ${change.fullDocument.email || 'N/A'}`);
          console.log(`Status: ${change.fullDocument.status || 'new'}`);
          
          // Phát contact mới
          eventData = {
            id: change.fullDocument._id,
            type: 'create',
            contact: change.fullDocument
          };
          broadcastChange('contact:created', eventData);
          broadcastChange('newContact', eventData);
          break;
          
        case 'update':
          console.log('Contact updated:');
          console.log(`Contact ID: ${change.documentKey._id}`);
          
          // Ghi log các trường đã được cập nhật
          if (change.updateDescription && change.updateDescription.updatedFields) {
            console.log('Updated fields:');
            Object.keys(change.updateDescription.updatedFields).forEach(field => {
              console.log(`- ${field}: ${JSON.stringify(change.updateDescription.updatedFields[field])}`);
            });
          }
          
          // Phát contact đã được cập nhật
          eventData = {
            id: change.documentKey._id,
            type: 'update',
            updatedFields: change.updateDescription?.updatedFields || {},
            contact: change.fullDocument
          };
          broadcastChange('contact:updated', eventData);
          break;
          
        case 'delete':
          console.log('Contact deleted:');
          console.log(`Contact ID: ${change.documentKey._id}`);
          
          // Phát contact đã bị xoá
          eventData = {
            id: change.documentKey._id,
            type: 'delete'
          };
          broadcastChange('contact:deleted', eventData);
          break;
      }
      
      console.log('---------------------------------------------');
    });
    
    // Xử lý lỗi
    changeStream.on('error', (error) => {
      console.error('Error in Contact change stream:', error);
      
      // Đóng change stream hiện tại
      changeStream.close();
      
      // Thử kết nối lại sau một khoảng thời gian
      console.log('Attempting to reconnect Contact change stream in 5 seconds...');
      setTimeout(() => {
        watchContacts().catch(err => console.error('Failed to restart Contact change stream:', err));
      }, 5000);
    });
    
    // Xử lý khi change stream bị đóng
    changeStream.on('close', () => {
      console.log('Contact change stream closed');
    });
    
    console.log('Contact change stream established successfully');
    
    return changeStream;
  } catch (error) {
    console.error('Failed to establish Contact change stream:', error);
    
    // Thử lại sau một khoảng thời gian
    console.log('Retrying Contact change stream in 5 seconds...');
    setTimeout(() => {
      watchContacts().catch(err => console.error('Failed to restart Contact change stream:', err));
    }, 5000);
  }
};

/**
 * Theo dõi thay đổi trong collection Users
 * @returns {Promise<void>}
 */
const watchUsers = async () => {
  try {
    console.log('Starting User change stream...');
    
    // Lấy tham chiếu tới collection Users qua Mongoose model
    const usersCollection = User.collection;
    
    // Tạo change stream trên collection Users
    const changeStream = usersCollection.watch(
      // Pipeline để lọc các thao tác (tuỳ chọn)
      [
        // Chỉ bao gồm các thao tác insert cho khách hàng mới
        {
          $match: {
            operationType: 'insert',
            'fullDocument.role': { $ne: 'admin' } // Loại trừ admin users
          }
        }
      ],
      // Tuỳ chọn
      { fullDocument: 'updateLookup' } // Bao gồm toàn bộ tài liệu đã được cập nhật
    );
    
    // Thiết lập event handlers cho change stream
    changeStream.on('change', (change) => {
      console.log('---------------------------------------------');
      console.log(`User Change Event: ${change.operationType} at ${new Date().toISOString()}`);
      
      // Chúng ta chỉ quan tâm đến khách hàng mới (insert)
      if (change.operationType === 'insert') {
        console.log('New customer created:');
        console.log(`User ID: ${change.fullDocument._id}`);
        console.log(`Name: ${change.fullDocument.name || 'N/A'}`);
        console.log(`Email: ${change.fullDocument.email || 'N/A'}`);
        
        // Thêm cờ isNew để chỉ ra đây là khách hàng mới
        const user = {
          ...change.fullDocument,
          isNew: true
        };
        
        // Loại bỏ dữ liệu nhạy cảm
        if (user.password) delete user.password;
        if (user.resetPasswordToken) delete user.resetPasswordToken;
        if (user.resetPasswordExpires) delete user.resetPasswordExpires;
        
        // Phát user mới
        const eventData = {
          id: change.fullDocument._id,
          type: 'create',
          user: user
        };
        
        broadcastChange('user:created', eventData);
        broadcastChange('newCustomer', eventData);
      }
      
      console.log('---------------------------------------------');
    });
    
    // Xử lý lỗi
    changeStream.on('error', (error) => {
      console.error('Error in User change stream:', error);
      
      // Đóng change stream hiện tại
      changeStream.close();
      
      // Thử kết nối lại sau một khoảng thời gian
      console.log('Attempting to reconnect User change stream in 5 seconds...');
      setTimeout(() => {
        watchUsers().catch(err => console.error('Failed to restart User change stream:', err));
      }, 5000);
    });
    
    // Xử lý khi change stream bị đóng
    changeStream.on('close', () => {
      console.log('User change stream closed');
    });
    
    console.log('User change stream established successfully');
    
    return changeStream;
  } catch (error) {
    console.error('Failed to establish User change stream:', error);
    
    // Thử lại sau một khoảng thời gian
    console.log('Retrying User change stream in 5 seconds...');
    setTimeout(() => {
      watchUsers().catch(err => console.error('Failed to restart User change stream:', err));
    }, 5000);
  }
};

/**
 * Khởi tạo tất cả change streams
 * Hàm này nên được gọi sau khi kết nối MongoDB được thiết lập
 */
const initializeChangeStreams = async () => {
  try {
    // Đảm bảo rằng chúng ta có một kết nối MongoDB hợp lệ hỗ trợ change streams
    // Change streams yêu cầu một replica set hoặc một sharded cluster
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.serverInfo();
    
    console.log(`MongoDB version: ${serverInfo.version}`);
    
    // Thử xác định xem change streams có được hỗ trợ hay không
    if (serverInfo.version) {
      const majorVersion = parseInt(serverInfo.version.split('.')[0], 10);
      
      // Change streams có sẵn trong MongoDB 3.6+
      if (majorVersion < 3 || (majorVersion === 3 && parseInt(serverInfo.version.split('.')[1], 10) < 6)) {
        console.warn('WARNING: Your MongoDB version may not support change streams. Minimum required version is 3.6');
        console.warn('Change streams will not be initialized');
        return;
      }
      
      // Đối với MongoDB Atlas hoặc các giải pháp hosted khác, chúng ta có thể tiếp tục vì chúng sử dụng replica sets
      // Đối với MongoDB local, chúng ta cần kiểm tra xem nó có phải là replica set hay không
      
      try {
        // Thử lấy trạng thái replica set (sẽ thất bại nếu không phải là replica set)
        await adminDb.command({ replSetGetStatus: 1 });
        console.log('MongoDB replica set detected - Change Streams supported');
      } catch (error) {
        if (error.code === 13) {
          // Mã lỗi 13 có nghĩa là xác thực thất bại nhưng nó vẫn có thể là một replica set
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
    
    // Khởi tạo change streams
    await Promise.all([
      watchOrders(),
      watchBookings(),
      watchContacts(),
      watchUsers()
    ]);
    
    console.log('All change streams initialized successfully');
  } catch (error) {
    console.error('Failed to initialize change streams:', error);
  }
};

module.exports = {
  initializeChangeStreams,
  watchOrders,
  watchBookings,
  watchContacts,
  watchUsers
};