const mongoose = require('mongoose');
const Service = require('../models/Service');

// Middleware để xử lý các booking có trường 'service' cũ
// và chuyển sang 'services' mới trong quá trình truy vấn
const handleLegacyBookingServices = async (req, res, next) => {
  const originalSend = res.json;
  
  res.json = function(body) {
    try {
      // Xử lý phản hồi kết quả từ API
      if (body && body.bookings && Array.isArray(body.bookings)) {
        // Xử lý danh sách bookings
        body.bookings = body.bookings.map(booking => {
          if (booking.service && (!booking.services || !booking.services.length)) {
            // Chuyển đổi service string sang services array
            booking.serviceNames = [booking.service];
            booking.serviceName = booking.service;
            
            // Thêm dữ liệu giả lập cho services để frontend hiển thị được
            booking.services = [{
              _id: mongoose.Types.ObjectId(),
              name: booking.service,
              price: 0,
              duration: 30,
              description: 'Legacy service'
            }];
          } else if (booking.services && Array.isArray(booking.services)) {
            // Đảm bảo services có tên để hiển thị
            booking.serviceNames = booking.services.map(s => s.name || s);
            booking.serviceName = booking.serviceNames.join(', ');
          }
          return booking;
        });
      } else if (body && body._id && body.service && (!body.services || !body.services.length)) {
        // Xử lý booking đơn lẻ
        body.serviceNames = [body.service];
        body.serviceName = body.service;
        body.services = [{
          _id: mongoose.Types.ObjectId(),
          name: body.service,
          price: 0,
          duration: 30,
          description: 'Legacy service'
        }];
      }
      
      // Gọi phương thức json ban đầu với dữ liệu đã được xử lý
      return originalSend.call(this, body);
    } catch (error) {
      console.error('Error in handleLegacyBookingServices:', error);
      return originalSend.call(this, body);
    }
  };
  
  next();
};

module.exports = {
  handleLegacyBookingServices
};
