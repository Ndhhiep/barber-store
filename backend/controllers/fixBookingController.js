// Middleware để xử lý các booking có trường 'service' cũ và chuyển sang 'services' mới
const Service = require('../models/Service');
const mongoose = require('mongoose');

/**
 * Middleware để xử lý vấn đề trong các truy vấn booking khi sử dụng populate
 * do sự thay đổi từ 'service' (string) sang 'services' (array of ObjectIds)
 */
const handleBookingServicePopulate = async (req, res, next) => {
  try {
    // Lưu trữ middleware gốc để có thể gọi lại
    const originalSend = res.send;

    // Ghi đè phương thức send để sửa đổi kết quả
    res.send = function(body) {
      try {
        // Chỉ xử lý nếu body là JSON và có thể parse
        if (typeof body === 'string' && body.startsWith('{')) {
          const data = JSON.parse(body);

          // Kiểm tra nếu là phản hồi booking
          if (data && data.bookings && Array.isArray(data.bookings)) {
            // Xử lý từng booking
            data.bookings = data.bookings.map(booking => {
              // Nếu có trường service (cũ) nhưng không có services (mới)
              if (booking.service && (!booking.services || booking.services.length === 0)) {
                booking.serviceName = booking.service;
                booking.services = [{
                  _id: null,
                  name: booking.service,
                  price: 0,
                  duration: 30,
                  description: 'Legacy service'
                }];
              }
              return booking;
            });
            
            // Trả về dữ liệu đã được sửa
            return originalSend.call(this, JSON.stringify(data));
          }
          
          // Nếu là phản hồi booking đơn lẻ
          if (data && data._id && data.service && (!data.services || data.services.length === 0)) {
            data.services = [{
              _id: null,
              name: data.service,
              price: 0,
              duration: 30,
              description: 'Legacy service'
            }];
            
            return originalSend.call(this, JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error('Error in handleBookingServicePopulate middleware:', error);
      }
      
      // Trường hợp mặc định: trả về dữ liệu gốc không thay đổi
      return originalSend.call(this, body);
    };
    
    next();
  } catch (error) {
    console.error('Error in handleBookingServicePopulate middleware:', error);
    next();
  }
};

/**
 * Middleware để sửa các truy vấn booking trước khi chúng được xử lý
 */
const fixBookingQueries = async (req, res, next) => {
  try {
    // Bỏ qua nếu không phải là GET request đến /api/bookings hoặc /api/bookings/:id
    const isBookingQuery = req.path.match(/^\/api\/bookings(\/.*)?$/);
    if (req.method !== 'GET' || !isBookingQuery) {
      return next();
    }

    // Bản sao của mongoose Model.find gốc để có thể gọi lại nếu cần
    const originalBookingFind = mongoose.Model.find;
    
    // Ghi đè phương thức find để sửa các truy vấn
    mongoose.Model.find = function(...args) {
      const [conditions, ...rest] = args;
      
      // Nếu là truy vấn với điều kiện services từ controller
      if (conditions && conditions.services && conditions.services.$elemMatch && conditions.services.$elemMatch.$type === "string") {
        // Thêm điều kiện thay thế cho truy vấn
        const newConditions = {
          $or: [
            { ...conditions }, // Giữ lại điều kiện gốc
            { service: { $exists: true, $type: "string" } } // Thêm điều kiện cho trường cũ
          ]
        };
        
        return originalBookingFind.call(this, newConditions, ...rest);
      }
      
      return originalBookingFind.apply(this, args);
    };
    
    next();
  } catch (error) {
    console.error('Error in fixBookingQueries middleware:', error);
    next();
  }
};

module.exports = { handleBookingServicePopulate, fixBookingQueries };
