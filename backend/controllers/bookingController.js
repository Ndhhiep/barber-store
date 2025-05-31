const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const User = require('../models/User'); 
const Token = require('../models/Token');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const dateUtils = require('../utils/dateUtils'); 
const { sendBookingConfirmationEmail } = require('../utils/emailUtils');
const crypto = require('crypto');

// @desc    Tạo mới booking
// @route   POST /api/bookings
// @access  Công khai
const createBooking = asyncHandler(async (req, res) => {
  const {
    services, // Now expects array of service ObjectIds
    barber_id,
    date,
    time,
    name,
    email,
    phone,
    notes,
    user_id, // Thêm user_id để lưu nếu người dùng đã đăng nhập
    requireEmailConfirmation = false // Cờ để xác định xem có cần xác nhận email hay không
  } = req.body;

  // Xác thực services
  if (!services || !Array.isArray(services) || services.length === 0) {
    res.status(400);
    throw new Error('Services là bắt buộc và phải là mảng không rỗng');
  }

  // Kiểm tra tất cả service IDs có hợp lệ không
  for (const serviceId of services) {
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      res.status(400);
      throw new Error(`Định dạng Service ID không hợp lệ: ${serviceId}`);
    }
  }

  // Xác thực barber_id
  if (!barber_id) {
    res.status(400);
    throw new Error('Barber ID là bắt buộc');
  }

  // Kiểm tra barber_id có hợp lệ không
  if (!mongoose.Types.ObjectId.isValid(barber_id)) {
    res.status(400);
    throw new Error('Định dạng Barber ID không hợp lệ');
  }

  // Kiểm tra barber có tồn tại không
  const barber = await Barber.findById(barber_id);
  if (!barber) {
    res.status(404);
    throw new Error('Không tìm thấy Barber');
  }

  // Kiểm tra tất cả services có tồn tại không và tính toán tổng duration
  const serviceRecords = await Service.find({ _id: { $in: services } });
  if (serviceRecords.length !== services.length) {
    res.status(404);
    throw new Error('Một hoặc nhiều service không tồn tại');
  }

  // Chuyển đổi date sang đúng múi giờ Việt Nam
  const vnDate = dateUtils.toVNDateTime(date);
  // Tính toán duration từ services
  const totalDuration = serviceRecords.reduce((total, service) => {
    return total + (service.duration || 30);
  }, 0);

  // Tính toán occupied time slots
  const occupiedTimeSlots = [];
  const [startHour, startMinute] = time.split(':').map(Number);
  let currentTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = currentTotalMinutes + totalDuration;

  // Tạo danh sách tất cả time slots bị chiếm dụng (30-minute intervals)
  while (currentTotalMinutes < endTotalMinutes) {
    const hours = Math.floor(currentTotalMinutes / 60);
    const minutes = currentTotalMinutes % 60;
    const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    occupiedTimeSlots.push(timeSlot);
    currentTotalMinutes += 30; // Move to next 30-minute slot
  }

  const booking = new Booking({
    services, // Array of service ObjectIds
    barber_id,
    date: vnDate, // Sử dụng ngày đã được chuyển đổi sang múi giờ Việt Nam
    time,
    duration: totalDuration,
    occupiedTimeSlots: occupiedTimeSlots,
    name,
    email,
    phone,
    notes,
    status: requireEmailConfirmation ? 'pending' : 'confirmed', // Đặt trạng thái dựa trên yêu cầu xác nhận email
    user_id: user_id || (req.user ? req.user._id : null) // Sử dụng user_id cung cấp hoặc lấy từ người dùng đã xác thực nếu có
  });
  const createdBooking = await booking.save();
    // Populate thông tin barber và services để trả về cho client
  const populatedBooking = await Booking.findById(createdBooking._id)
    .populate('barber_id', 'name specialization')
    .populate('services', 'name price duration description');
  
  // Debug: Log populated booking services để kiểm tra
  console.log('DEBUG - Populated booking services:', populatedBooking.services);
  console.log('DEBUG - Services count:', populatedBooking.services ? populatedBooking.services.length : 0);
  
  // Xử lý xác nhận email nếu cần
  if (requireEmailConfirmation) {
    try {
      // Tạo token ngẫu nhiên
      const tokenString = crypto.randomBytes(32).toString('hex');
      
      // Tạo bản ghi token
      const token = new Token({
        bookingId: createdBooking._id,
        token: tokenString,
      });
      
      await token.save();
      
      // Lấy tên barber để gửi email
      const barberName = barber ? barber.name : 'Any Available Barber';
      
      // Lấy tên services từ populatedBooking để gửi email - với error handling
      let serviceNames = [];
      if (populatedBooking.services && Array.isArray(populatedBooking.services)) {
        serviceNames = populatedBooking.services.map(service => {
          console.log('DEBUG - Processing service:', service);
          return service.name || service.toString();
        });
      } else {
        console.warn('WARNING - Services not properly populated, using original service IDs');
        // Fallback: try to get service names from the database
        try {
          const serviceRecords = await Service.find({ _id: { $in: services } });
          serviceNames = serviceRecords.map(service => service.name);
          console.log('DEBUG - Fallback service names:', serviceNames);
        } catch (fallbackError) {
          console.error('ERROR - Fallback service lookup failed:', fallbackError);
          serviceNames = services.map(id => id.toString()); // Last resort
        }
      }
      
      console.log('DEBUG - Final service names for email:', serviceNames);
      
      // Xác định URL cơ sở cho liên kết xác nhận
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Gửi email xác nhận booking
      await sendBookingConfirmationEmail({
        to: email,
        booking: {
          ...booking.toObject(),
          services: serviceNames, // Use service names instead of ObjectIds
          barber_name: barberName,
          _id: createdBooking._id
        },
        token: tokenString,
        baseUrl
      });
      
      res.status(201).json({
        message: 'Booking đã được tạo. Vui lòng kiểm tra email để xác nhận.',
        bookingId: createdBooking._id,
        requiresConfirmation: true
      });
    } catch (error) {
      console.error('Lỗi khi gửi email xác nhận:', error);
      
      // Nếu email thất bại, vẫn trả về thành công nhưng ghi chú vấn đề email
      res.status(201).json({
        message: 'Booking đã được tạo nhưng không thể gửi email xác nhận. Vui lòng liên hệ hỗ trợ.',
        bookingId: createdBooking._id,
        requiresConfirmation: true,
        emailError: true
      });
    }
  } else {
    // Trả về phản hồi thông thường nếu không yêu cầu xác nhận email
    res.status(201).json(populatedBooking);
  }
});

// @desc    Lấy tất cả bookings
// @route   GET /api/bookings
// @access  Riêng tư/Admin
const getBookings = asyncHandler(async (req, res) => {
  try {
    // Xử lý lọc theo ngày nếu có
    const filter = {};
    
    // Lọc theo ID người dùng nếu có
    if (req.query.userId) {
      filter.user_id = req.query.userId;
    }
    
    // Fetch all services for reference for potential mapping
    let serviceMap = {};
    try {
      const allServices = await Service.find({}).lean();
      allServices.forEach(service => {
        serviceMap[service.name] = service._id;
      });
    } catch (error) {
      console.log("Error fetching services for mapping:", error);
      // Continue even if there's an error with service mapping
    }
    
    if (req.query.date) {
      // Lọc theo ngày cụ thể
      const date = req.query.date;
      
      // Sử dụng dateUtils để lấy đầu và cuối ngày (VN)
      const startDate = dateUtils.getVNStartOfDay(new Date(date));
      const endDate = dateUtils.getVNEndOfDay(new Date(date));
      
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
      
      console.log(`Lọc bookings cho ngày: ${date}`);
      console.log(`Ngày bắt đầu: ${startDate.toISOString()}`);
      console.log(`Ngày kết thúc: ${endDate.toISOString()}`);
    } else if (req.query.startDate && req.query.endDate) {
      // Lọc theo khoảng ngày
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      
      // Sử dụng dateUtils để lấy đầu và cuối ngày (VN)
      const start = dateUtils.getVNStartOfDay(new Date(startDate));
      const end = dateUtils.getVNEndOfDay(new Date(endDate));
      
      filter.date = {
        $gte: start,
        $lte: end
      };
      
      console.log(`Lọc bookings từ ${startDate} đến ${endDate}`);
      console.log(`Ngày bắt đầu: ${start.toISOString()}`);
      console.log(`Ngày kết thúc: ${end.toISOString()}`);
    }
    
    // Ghi log filter để debug
    console.log('Filter:', JSON.stringify(filter));
    
    // Tham số phân trang
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    console.log(`Phân trang: page=${page}, limit=${limit}, skip=${skip}`);
      // Lấy tổng số bản ghi cho phân trang
    const totalCount = await Booking.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Query bookings without populating services first to avoid cast errors
    const bookings = await Booking.find(filter)
      .populate('barber_id', 'name specialization')
      .sort({ date: -1, time: -1 }) // Sắp xếp theo ngày và giờ (mới nhất trước)
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Tìm thấy ${bookings.length} bookings trong tổng số ${totalCount}`);    // Định dạng bookings để bao gồm tên barber và khách
    const formattedBookings = await Promise.all(bookings.map(async (booking) => {
      const formattedBooking = { ...booking };
      
      // Xử lý thông tin dịch vụ - handle both legacy string data and ObjectId references
      if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
        // Check if services are ObjectIds or strings
        const hasObjectIds = booking.services.some(service => 
          mongoose.Types.ObjectId.isValid(service) && typeof service !== 'string'
        );
        
        if (hasObjectIds) {
          // Services are ObjectIds, populate them manually
          try {
            const serviceIds = booking.services.filter(service => 
              mongoose.Types.ObjectId.isValid(service)
            );
            const populatedServices = await Service.find({ _id: { $in: serviceIds } }).lean();
            formattedBooking.services = populatedServices;
            formattedBooking.serviceName = populatedServices.map(service => service.name).join(', ');
          } catch (error) {
            console.log('Error populating services:', error);
            // Fallback to showing service IDs
            formattedBooking.serviceName = booking.services.join(', ');
            formattedBooking.services = booking.services.map(serviceId => ({
              _id: serviceId,
              name: serviceId.toString(),
              price: 0,
              duration: 30,
              description: 'Service ID'
            }));
          }
        } else {
          // Services are legacy strings
          formattedBooking.serviceName = booking.services.join(', ');
          formattedBooking.services = booking.services.map(serviceName => ({
            _id: null,
            name: serviceName,
            price: 0,
            duration: 30,
            description: 'Legacy service'
          }));
        }
      } else if (booking.service && typeof booking.service === 'string') {
        // Handle legacy data with service field (string)
        formattedBooking.serviceName = booking.service;
        formattedBooking.services = [{
          _id: null,
          name: booking.service,
          price: 0,
          duration: 30,
          description: 'Legacy service'
        }];
      } else {
        // Fallback for bookings without services
        formattedBooking.serviceName = 'No services specified';
        formattedBooking.services = [];
      }
      
      // Thêm tên khách hàng từ booking.name
      formattedBooking.userName = booking.name || 'N/A';
      
      // Định dạng ngày và giờ để hiển thị
      formattedBooking.formattedDate = dateUtils.formatDate(booking.date);
      formattedBooking.formattedTime = booking.time;
      
      // Nếu có user_id và hợp lệ, tìm thông tin user
      if (booking.user_id && mongoose.Types.ObjectId.isValid(booking.user_id)) {
        try {
          const user = await User.findById(booking.user_id).select('name email').lean();
          if (user) {
            formattedBooking.userName = user.name || booking.name || 'N/A';
            formattedBooking.userEmail = user.email;
          }
        } catch (error) {
          console.log(`Lỗi khi lấy thông tin người dùng cho ID ${booking.user_id}:`, error.message);
        }
      }
      
      return formattedBooking;
    }));
    
    // Trả về với property bookings như frontend mong đợi
    res.json({
      status: 'success',
      count: formattedBookings.length,
      totalCount: totalCount,
      totalPages: totalPages,
      currentPage: page,
      bookings: formattedBookings
    });
  } catch (error) {
    console.error('Lỗi khi lấy bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Lấy bookings của người dùng đang đăng nhập
// @route   GET /api/bookings/my-bookings
// @access  Riêng tư
const getUserBookings = asyncHandler(async (req, res) => {
  try {
    // Fetch all services for reference if needed for legacy data
    let serviceMap = {};
    try {
      const allServices = await Service.find({}).lean();
      allServices.forEach(service => {
        serviceMap[service.name] = service._id;
      });
    } catch (error) {
      console.log("Error fetching services for mapping in getUserBookings:", error);
    }
      const bookings = await Booking.find({ user_id: req.user._id })
      .populate('barber_id', 'name specialization')
      .sort({ date: -1, createdAt: -1 }) // Sắp xếp theo ngày (mới nhất trước)
      .lean();
      // Process bookings to handle legacy data
    const processedBookings = await Promise.all(bookings.map(async (booking) => {
      const processedBooking = { ...booking };
      
      // Handle services field - convert string services to objects if necessary
      if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
        // Check if services are ObjectIds or strings
        const hasObjectIds = booking.services.some(service => 
          mongoose.Types.ObjectId.isValid(service) && typeof service !== 'string'
        );
        
        if (hasObjectIds) {
          // Services are ObjectIds, populate them manually
          try {
            const serviceIds = booking.services.filter(service => 
              mongoose.Types.ObjectId.isValid(service)
            );
            const populatedServices = await Service.find({ _id: { $in: serviceIds } }).lean();
            processedBooking.services = populatedServices;
            processedBooking.serviceNames = populatedServices.map(service => service.name);
          } catch (error) {
            console.log('Error populating services in getUserBookings:', error);
            // Fallback to showing service IDs
            processedBooking.serviceNames = booking.services.map(service => service.toString());
          }
        } else {
          // Services are legacy strings
          processedBooking.serviceNames = booking.services;
          processedBooking.services = booking.services.map(serviceName => ({
            _id: null,
            name: serviceName,
            price: 0,
            duration: 30,
            description: 'Legacy service'
          }));
        }
      } else if (booking.service && typeof booking.service === 'string') {
        // Legacy booking with string service, convert to services array
        processedBooking.services = [{
          name: booking.service,
          price: 0,
          duration: 30,
          description: 'Legacy service'
        }];
        processedBooking.serviceNames = [booking.service];
      } else {
        // No services found
        processedBooking.services = [];
        processedBooking.serviceNames = [];
      }
      
      return processedBooking;
    }));
    
    res.json(processedBookings);
  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy danh sách bookings của bạn',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Lấy booking theo ID
// @route   GET /api/bookings/:id
// @access  Riêng tư
const getBookingById = asyncHandler(async (req, res) => {  try {
    const booking = await Booking.findById(req.params.id)
      .populate('barber_id', 'name specialization')
      .lean();

    // Kiểm tra nếu booking không tồn tại
    if (!booking) {
      res.status(404);
      throw new Error('Không tìm thấy booking');
    }
      // Kiểm tra quyền truy cập trước khi xử lý dữ liệu
    // Staff và admin có thể xem tất cả bookings
    const isStaffOrAdmin = ['admin', 'manager', 'barber', 'staff'].includes(req.user.role);
    
    // Booking owner có thể xem booking của mình
    const isOwner = booking.user_id && booking.user_id.toString() === req.user._id.toString();
    
    // Nếu không phải staff/admin và không phải owner, từ chối truy cập
    if (!isStaffOrAdmin && !isOwner) {
      console.log(`Access denied - User: ${req.user._id}, Role: ${req.user.role}, Booking user_id: ${booking.user_id}`);
      res.status(403);
      throw new Error('Không có quyền xem booking này');
    }

    // Handle services field - handle both legacy string data and ObjectId references
    if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
      // Check if services are ObjectIds or strings
      const hasObjectIds = booking.services.some(service => 
        mongoose.Types.ObjectId.isValid(service) && typeof service !== 'string'
      );
      
      if (hasObjectIds) {
        // Services are ObjectIds, populate them manually
        try {
          const serviceIds = booking.services.filter(service => 
            mongoose.Types.ObjectId.isValid(service)
          );
          const populatedServices = await Service.find({ _id: { $in: serviceIds } }).lean();
          booking.services = populatedServices;
          booking.serviceNames = populatedServices.map(service => service.name);
        } catch (error) {
          console.log('Error populating services in getBookingById:', error);
          // Fallback to showing service IDs
          booking.serviceNames = booking.services.map(service => service.toString());
        }
      } else {
        // Services are legacy strings
        booking.serviceNames = booking.services;
        booking.services = booking.services.map(serviceName => ({
          _id: null,
          name: serviceName,
          price: 0,
          duration: 30,
          description: 'Legacy service'
        }));
      }
    } else if (booking.service && typeof booking.service === 'string') {
      // Handle legacy data with service field (string)
      booking.serviceNames = [booking.service];
      booking.services = [{
        name: booking.service,
        price: 0,
        duration: 30,
        description: 'Legacy service'
      }];
    }

    res.json(booking);
  } catch (error) {
    console.error('Error getting booking by id:', error);
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Không thể lấy thông tin booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Hủy booking
// @route   PUT /api/bookings/:id/cancel
// @access  Riêng tư
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  // Kiểm tra nếu booking không tồn tại
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }

  // Kiểm tra nếu booking không thuộc người dùng hoặc không phải admin
  if (booking.user_id && booking.user_id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403);
    throw new Error('Không có quyền hủy booking này');
  }

  // Kiểm tra nếu booking đã hoàn thành
  if (booking.status === 'completed') {
    res.status(400);
    throw new Error('Không thể hủy booking đã hoàn thành');
  }
  // Cập nhật trạng thái booking thành cancelled
  booking.status = 'cancelled';
  booking.occupiedTimeSlots = []; // Clear occupied time slots
  const updatedBooking = await booking.save();

  res.json(updatedBooking);
});

// @desc    Cập nhật trạng thái booking (dành cho admins)
// @route   PUT /api/bookings/:id/status
// @access  Riêng tư/Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  // Xác thực giá trị status
  if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
    res.status(400);
    throw new Error('Trạng thái không hợp lệ');
  }

  const booking = await Booking.findById(req.params.id);

  // Kiểm tra nếu booking không tồn tại
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }

  // Cập nhật trạng thái booking
  booking.status = status;
  const updatedBooking = await booking.save();
  res.json(updatedBooking);
});

// @desc    Cập nhật thông tin booking đầy đủ (dành cho staff)
// @route   PUT /api/bookings/:id
// @access  Riêng tư/Staff
const updateBooking = asyncHandler(async (req, res) => {
  const { 
    customerName, 
    customerPhone, 
    customerEmail, 
    services, 
    barberId, 
    date, 
    time, 
    notes 
  } = req.body;

  const booking = await Booking.findById(req.params.id);

  // Kiểm tra nếu booking không tồn tại
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }
  // Xác thực barberId nếu có
  if (barberId) {
    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      res.status(400);
      throw new Error('Định dạng Barber ID không hợp lệ');
    }

    const barber = await Barber.findById(barberId);
    if (!barber) {
      res.status(404);
      throw new Error('Không tìm thấy Barber');
    }
  }

  // Xác thực services nếu có
  if (services !== undefined) {
    if (!Array.isArray(services) || services.length === 0) {
      res.status(400);
      throw new Error('Services phải là mảng không rỗng');
    }

    // Kiểm tra tất cả service IDs có hợp lệ không
    for (const serviceId of services) {
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        res.status(400);
        throw new Error(`Định dạng Service ID không hợp lệ: ${serviceId}`);
      }
    }

    // Kiểm tra tất cả services có tồn tại không
    const serviceRecords = await Service.find({ _id: { $in: services } });
    if (serviceRecords.length !== services.length) {
      res.status(404);
      throw new Error('Một hoặc nhiều service không tồn tại');
    }
  }
  // Cập nhật các trường được cung cấp
  if (customerName !== undefined) booking.name = customerName;
  if (customerPhone !== undefined) booking.phone = customerPhone;
  if (customerEmail !== undefined) booking.email = customerEmail;
  if (services !== undefined) booking.services = services;
  if (barberId !== undefined) booking.barber_id = barberId;
  if (date !== undefined) {
    // Chuyển đổi date sang đúng múi giờ Việt Nam
    const vnDate = dateUtils.toVNDateTime(date);
    booking.date = vnDate;
  }
  if (time !== undefined) booking.time = time;
  if (notes !== undefined) booking.notes = notes;
    // Recalculate occupiedTimeSlots if time or services changed
  if (time !== undefined || services !== undefined) {
    // Get total duration based on services
    let totalDuration = 30; // Default duration
      if (services && Array.isArray(services) && services.length > 0) {
      try {
        // Services are already validated as ObjectIds above
        const serviceRecords = await Service.find({ _id: { $in: services } });
        console.log(`Found ${serviceRecords.length} service records for duration calculation`);
        
        if (serviceRecords && serviceRecords.length > 0) {
          totalDuration = serviceRecords.reduce((total, service) => {
            return total + (service.duration || 30); // Default to 30 minutes if duration not specified
          }, 0);
        }
      } catch (error) {
        console.warn('Error calculating service duration during update:', error);
      }
    }
    
    // Recalculate occupied time slots
    const occupiedTimeSlots = [];
    const [startHour, startMinute] = booking.time.split(':').map(Number);
    let currentTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = currentTotalMinutes + totalDuration;
    
    // Create list of all occupied time slots (30-minute intervals)
    while (currentTotalMinutes < endTotalMinutes) {
      const hours = Math.floor(currentTotalMinutes / 60);
      const minutes = currentTotalMinutes % 60;
      const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      occupiedTimeSlots.push(timeSlot);
      currentTotalMinutes += 30; // Move to next 30-minute slot
    }
    
    booking.occupiedTimeSlots = occupiedTimeSlots;
    booking.duration = totalDuration;
  }
  try {
    const updatedBooking = await booking.save();
      // Populate thông tin barber và services để trả về cho client
    const populatedBooking = await Booking.findById(updatedBooking._id)
      .populate('barber_id', 'name specialization')
      .populate('services', 'name price duration description');

    res.json({
      success: true,
      message: 'Booking đã được cập nhật thành công',
      booking: populatedBooking
    });
  } catch (error) {
    console.error('Error saving booking:', error);
    
    // Handle VersionError specifically
    if (error.name === 'VersionError') {
      // Fetch the latest version of the document
      const freshBooking = await Booking.findById(req.params.id);
      
      if (!freshBooking) {
        res.status(404);
        throw new Error('Booking no longer exists');
      }
      
      // Apply updates to the fresh booking
      if (customerName !== undefined) freshBooking.name = customerName;
      if (customerPhone !== undefined) freshBooking.phone = customerPhone;
      if (customerEmail !== undefined) freshBooking.email = customerEmail;
      if (services !== undefined) freshBooking.services = services;
      if (barberId !== undefined) freshBooking.barber_id = barberId;
      if (time !== undefined) freshBooking.time = time;
      if (notes !== undefined) freshBooking.notes = notes;
      
      if (date !== undefined) {
        // Convert date to VN timezone
        const vnDate = dateUtils.toVNDateTime(date);
        freshBooking.date = vnDate;
      }
      
      // Save the fresh booking with updates
      const updatedBooking = await freshBooking.save();
      
      // Populate barber info for response
      const populatedBooking = await Booking.findById(updatedBooking._id)
        .populate('barber_id', 'name specialization');

      res.json({
        success: true,
        message: 'Booking đã được cập nhật thành công (retry)',
        booking: populatedBooking
      });
    } else {
      res.status(500);
      throw new Error(`Error updating booking: ${error.message}`);
    }
  }
});

/**
 * Lấy các khung giờ còn trống cho barber vào ngày cụ thể
 * @route GET /api/bookings/time-slots
 * @access Công khai
 */
const getAvailableTimeSlots = async (req, res) => {
  try {
    const { date, barberId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp ngày để kiểm tra khung giờ'
      });
    }
    
    if (!barberId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp ID barber để kiểm tra khung giờ'
      });
    }

    // Kiểm tra định dạng ngày (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD'
      });
    }

    // Tìm barber theo ID
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy Barber'
      });
    }
    
    // Kiểm tra nếu barber không hoạt động
    if (!barber.is_active) {
      return res.status(400).json({
        status: 'fail',
        message: 'Barber này hiện không hoạt động'
      });
    }

    // Lấy ngày trong tuần từ date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Kiểm tra nếu barber không làm việc ngày đó
    if (barber.workingDays && !barber.workingDays[dayOfWeek]) {
      return res.status(200).json({
        status: 'success',
        message: `Barber không làm việc vào ${dayOfWeek}`,
        data: {
          timeSlots: []
        }
      });
    }

    // Sinh tất cả khung giờ dựa trên giờ làm việc
    // Nếu workingHours không được định nghĩa, sử dụng giờ mặc định
    const start = barber.workingHours?.start || '09:00';
    const end = barber.workingHours?.end || '19:00';
      // Sử dụng dateUtils.generateTimeSlots thay vì hàm local
    const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });
    
    // Tìm tất cả booking cho barber ngày đó
    const query = {
      barber_id: barberId,
      date: {
        $gte: dateUtils.getVNStartOfDay(new Date(date)),
        $lte: dateUtils.getVNEndOfDay(new Date(date))
      },
      status: { $in: ['pending', 'confirmed'] }
    };

    // Nếu có excludeBookingId, loại trừ booking đó khỏi danh sách
    const excludeBookingId = req.query.excludeBookingId;
    if (excludeBookingId) {
      query._id = { $ne: excludeBookingId };
    }

    const bookings = await Booking.find(query);

    // Đánh dấu khung giờ là có sẵn hay không
    const bookedTimes = bookings.map(booking => booking.time);
    const timeSlots = allTimeSlots.map(slot => ({
      start_time: slot,
      is_available: !bookedTimes.includes(slot)
    }));

    // Nếu ngày là hôm nay, lọc bỏ khung giờ đã qua hoặc trong 30 phút tới
    const today = new Date().toISOString().split('T')[0];
    if (date === today) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Lọc bỏ khung giờ đã qua hoặc trong 30 phút tới
      return res.status(200).json({
        status: 'success',
        data: {
          timeSlots: timeSlots.filter(slot => {
            const [slotHour, slotMinute] = slot.start_time.split(':').map(Number);
            const slotTotalMinutes = slotHour * 60 + slotMinute;
            const currentTotalMinutes = currentHour * 60 + currentMinute;
            
            // Giữ lại các khung giờ ít nhất 30 phút trong tương lai
            return slotTotalMinutes > currentTotalMinutes + 30;
          })
        }
      });
    }

    // Trả về dữ liệu timeSlots
    res.status(200).json({
      status: 'success',
      data: {
        timeSlots
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy khung giờ còn trống:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy khung giờ còn trống',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Kiểm tra xem một khung giờ cụ thể có còn trống không
// @route   GET /api/bookings/check-availability
// @access  Công khai
const checkTimeSlotAvailability = async (req, res) => {
  try {
    const { date, timeSlot, barberId } = req.query;
    
    if (!date || !timeSlot || !barberId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp date, timeSlot và barberId'
      });
    }

    // Tìm barber theo ID
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy Barber'
      });
    }

    // Kiểm tra tình trạng khả dụng của barber cho khung giờ
    const isAvailable = await barber.isAvailable(date, timeSlot);

    res.status(200).json({
      status: 'success',
      data: {
        isAvailable
      }
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra tình trạng khả dụng của khung giờ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể kiểm tra tình trạng khả dụng của khung giờ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy trạng thái của tất cả khung giờ cho barber vào ngày cụ thể
 * @route GET /api/bookings/time-slots-status
 * @access Công khai
 */
const getTimeSlotStatus = async (req, res) => {
  try {
    const { date, barberId, services, excludeBookingId } = req.query;
    
    if (!date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp ngày để kiểm tra khung giờ'
      });
    }
    
    if (!barberId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Vui lòng cung cấp ID barber để kiểm tra khung giờ'
      });
    }

    // Kiểm tra định dạng ngày (YYYY-MM-DD)
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD'
      });
    }

    // Tìm barber theo ID
    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({
        status: 'fail',
        message: 'Không tìm thấy Barber'
      });
    }
    
    // Kiểm tra nếu barber không hoạt động
    if (!barber.is_active) {
      return res.status(400).json({
        status: 'fail',
        message: 'Barber này hiện không hoạt động'
      });
    }

    // Lấy ngày trong tuần từ date
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // Kiểm tra nếu barber không làm việc ngày đó
    if (barber.workingDays && !barber.workingDays[dayOfWeek]) {
      return res.status(200).json({
        status: 'success',
        message: `Barber không làm việc vào ${dayOfWeek}`,
        data: {
          timeSlots: []
        }
      });
    }    // Sinh tất cả khung giờ dựa trên giờ làm việc
    // Nếu workingHours không được định nghĩa, sử dụng giờ mặc định
    const start = barber.workingHours?.start || '09:00';
    const end = barber.workingHours?.end || '19:00';
    const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });    // Parse services để tính total duration
    let totalDuration = 30; // Default duration
    if (services) {
      try {
        const serviceIds = JSON.parse(services);        if (Array.isArray(serviceIds) && serviceIds.length > 0) {
          // Filter out invalid ObjectIds (null, undefined, or invalid formats)
          const validServiceIds = serviceIds.filter(id => {
            if (!id) return false;
            // Check if it's a valid ObjectId format (24 hex characters)
            if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
              return true;
            }
            // Handle legacy service objects
            if (typeof id === 'object' && id._id && /^[0-9a-fA-F]{24}$/.test(id._id)) {
              return true;
            }
            return false;
          }).map(id => {
            // Extract ObjectId from service objects if needed
            return typeof id === 'object' ? id._id : id;
          });
          
          if (validServiceIds.length > 0) {
            // Lấy thông tin services từ database
            const selectedServices = await Service.find({ _id: { $in: validServiceIds } });
            totalDuration = selectedServices.reduce((total, service) => {
              return total + (service.duration || 30);
            }, 0);
          }
        }
      } catch (parseError) {
        console.warn('Error parsing services:', parseError);
        // Sử dụng default duration nếu parse lỗi
      }
    }// Normalize date to YYYY-MM-DD format to avoid timezone issues
    const [year, month, day] = date.split('-');
    const normalizedDate = `${year}-${month}-${day}`;
    console.log(`Normalized date: ${normalizedDate}`);

    // Convert to a proper date object using our utility function for consistent handling
    const dateObj = dateUtils.toVNDateTime(normalizedDate);
    
    // Ensure proper date handling for cross-month comparisons
    const startOfDayQuery = dateUtils.getVNStartOfDay(dateObj);
    const endOfDayQuery = dateUtils.getVNEndOfDay(dateObj);
    
    console.log(`Finding bookings for date: ${normalizedDate}`);
    console.log(`Date object created: ${dateObj.toISOString()}`);
    console.log(`Start date for query: ${startOfDayQuery.toISOString()}`);
    console.log(`End date for query: ${endOfDayQuery.toISOString()}`);    console.log(`Month being queried: ${dateObj.getMonth() + 1}`); // Add 1 since getMonth() is 0-indexed
    
    // Build query to find existing bookings
    const bookingQuery = {
      barber_id: barberId,
      date: {
        $gte: startOfDayQuery,
        $lte: endOfDayQuery
      },
      status: { $in: ['pending', 'confirmed'] }
    };
    
    // Exclude the current booking being edited if provided
    if (excludeBookingId) {
      bookingQuery._id = { $ne: excludeBookingId };
      console.log(`Excluding booking ID from time slot calculation: ${excludeBookingId}`);
    }
    
    const bookings = await Booking.find(bookingQuery);
    
    console.log(`Found ${bookings.length} bookings for barber ${barberId} on ${normalizedDate}`);
    if (bookings.length > 0) {
      bookings.forEach((booking, index) => {
        console.log(`Booking ${index + 1}:`);
        console.log(`- Time: ${booking.time}`);
        console.log(`- Date: ${booking.date}`);
        console.log(`- Services: ${booking.services}`);
        console.log(`- Occupied time slots: ${booking.occupiedTimeSlots}`);
      });
    }
    
    // Tạo set của tất cả occupied time slots từ existing bookings
    const occupiedSlots = new Set();
    console.log(`Processing ${bookings.length} bookings to find occupied slots...`);
    
    bookings.forEach((booking, bookingIndex) => {
      console.log(`Processing booking ${bookingIndex + 1}: ${booking.time} on ${booking.date}`);
      
      if (booking.occupiedTimeSlots && Array.isArray(booking.occupiedTimeSlots)) {
        // Sử dụng occupiedTimeSlots nếu có
        console.log(`Booking ${bookingIndex + 1} has pre-calculated occupied slots:`, booking.occupiedTimeSlots);
        booking.occupiedTimeSlots.forEach(slot => occupiedSlots.add(slot));
      } else {
        // Fallback: tính toán từ time và duration
        const duration = booking.duration || 30;
        const [startHour, startMinute] = booking.time.split(':').map(Number);
        let currentTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = currentTotalMinutes + duration;
        
        console.log(`Calculating occupied slots for booking ${bookingIndex + 1}: ${booking.time} (${duration} mins)`);

        while (currentTotalMinutes < endTotalMinutes) {
          const hours = Math.floor(currentTotalMinutes / 60);
          const minutes = currentTotalMinutes % 60;
          const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          occupiedSlots.add(timeSlot);
          currentTotalMinutes += 30; // Move to next 30-minute slot
        }
      }
    });
    
    console.log(`Total occupied slots found: ${occupiedSlots.size}`);
    console.log(`Occupied slots:`, Array.from(occupiedSlots));
    
    // Xác định nếu khung giờ đã qua cho hôm nay
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;    // Helper function để kiểm tra xem có đủ slots liên tiếp không
    const hasConsecutiveSlots = (startSlotIndex, requiredDuration) => {
      const slotsNeeded = Math.ceil(requiredDuration / 30);
      const startSlot = allTimeSlots[startSlotIndex];
      
      console.log(`Checking consecutive slots for ${startSlot}: need ${slotsNeeded} slots for ${requiredDuration} minutes`);
      
      if (startSlotIndex + slotsNeeded > allTimeSlots.length) {
        console.log(`Not enough slots available: need ${slotsNeeded}, have ${allTimeSlots.length - startSlotIndex}`);
        return false;
      }

      // Kiểm tra tất cả slots cần thiết
      for (let i = 0; i < slotsNeeded; i++) {
        const slotIndex = startSlotIndex + i;
        const slotTime = allTimeSlots[slotIndex];
        
        // Kiểm tra nếu slot này đã qua
        if (date === today) {
          const [slotHour, slotMinute] = slotTime.split(':').map(Number);
          const slotTotalMinutes = slotHour * 60 + slotMinute;
          if (slotTotalMinutes < currentTotalMinutes + 30) {
            console.log(`Slot ${slotTime} is in the past`);
            return false;
          }
        }

        // Kiểm tra nếu slot này đã bị chiếm dụng
        if (occupiedSlots.has(slotTime)) {
          console.log(`Slot ${slotTime} is occupied`);
          return false;
        }
      }
      
      console.log(`${startSlot}: All ${slotsNeeded} consecutive slots are available`);
      return true;
    };

    // Tạo đối tượng khung giờ với thông tin availability và quá khứ
    const timeSlots = allTimeSlots.map((slot, index) => {
      // Kiểm tra nếu khung giờ đã qua nếu là hôm nay
      let isPast = false;
      
      // Compare dates properly instead of string comparison
      const dateObj = new Date(date);
      const todayObj = new Date(today);
      const isToday = dateObj.getFullYear() === todayObj.getFullYear() &&
                     dateObj.getMonth() === todayObj.getMonth() &&
                     dateObj.getDate() === todayObj.getDate();
                     
      if (isToday) {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        
        // Khung giờ được coi là "quá khứ" nếu ít hơn 30 phút từ bây giờ
        isPast = slotTotalMinutes < currentTotalMinutes + 30;
      }
      
      // Check if the slot is occupied by an existing appointment
      const isOccupied = occupiedSlots.has(slot);      // Kiểm tra availability dựa trên total duration
      let isAvailable = !isPast && !isOccupied;
      if (isAvailable) {
        // Kiểm tra xem có đủ consecutive slots cho duration không
        isAvailable = hasConsecutiveSlots(index, totalDuration);
      }
      
      console.log(`Slot ${slot}: isPast=${isPast}, isOccupied=${isOccupied}, isAvailable=${isAvailable}, totalDuration=${totalDuration}`);
      
      return {
        start_time: slot,
        isPast: isPast,
        isAvailable: isAvailable,
        isOccupied: isOccupied,
        requiredDuration: totalDuration,
        occupiedTimeSlots: Array.from(occupiedSlots) // Send entire list of occupied slots to frontend
      };
    });

    // Trả về dữ liệu timeSlots
    res.status(200).json({
      status: 'success',
      data: {
        timeSlots
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy trạng thái khung giờ:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy trạng thái khung giờ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy thống kê booking cho dashboard
 * @route GET /api/bookings/stats
 * @access Riêng tư/Admin/Staff
 */
const getBookingStats = async (req, res) => {
  try {
    // Tính toán thống kê booking tổng thể
    const totalBookings = await Booking.countDocuments();
    
    // Đếm bookings theo trạng thái
    const bookingsByStatus = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    // Định dạng kết quả
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0
    };

    bookingsByStatus.forEach(item => {
      if (item._id && statusCounts.hasOwnProperty(item._id)) {
        statusCounts[item._id] = item.count;
      }
    });

    // Lấy bookings của tháng hiện tại
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlyBookings = await Booking.countDocuments({
      date: { $gte: startOfMonth }
    });

    // Lấy bookings của hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayBookings = await Booking.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Lấy bookings sắp tới (7 ngày tới)
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingBookings = await Booking.countDocuments({
      date: {
        $gte: today,
        $lt: nextWeek
      },
      status: { $nin: ['cancelled', 'completed'] }
    });

    // Lấy barbers phổ biến
    const popularBarbers = await Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: "$barber_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "barbers",
          localField: "_id",
          foreignField: "_id",
          as: "barber"
        }
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: { $arrayElemAt: ["$barber.name", 0] },
          specialization: { $arrayElemAt: ["$barber.specialization", 0] }
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        totalBookings,
        pendingBookings: statusCounts.pending,
        confirmedBookings: statusCounts.confirmed,
        completedBookings: statusCounts.completed,
        cancelledBookings: statusCounts.cancelled,
        monthlyBookings,
        todayBookings,
        upcomingBookings,
        popularBarbers
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy thống kê booking:', error);
    res.status(500).json({
      status: 'error',
      message: 'Không thể lấy thống kê booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Xác nhận booking với token
// @route   POST /api/bookings/confirm
// @access  Công khai
const confirmBooking = asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    res.status(400);
    throw new Error('Token là bắt buộc');
  }
  
  // Tìm tài liệu token
  const tokenDoc = await Token.findOne({ token });
  
  if (!tokenDoc) {
    res.status(404);
    throw new Error('Token xác nhận không hợp lệ hoặc đã hết hạn');
  }
  
  // Kiểm tra nếu token hết hạn
  if (new Date() > new Date(tokenDoc.expiresAt)) {
    await Token.deleteOne({ _id: tokenDoc._id });
    res.status(400);
    throw new Error('Token xác nhận đã hết hạn');
  }
  
  // Tìm và cập nhật booking
  const booking = await Booking.findById(tokenDoc.bookingId);
  
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }
  
  // Cập nhật trạng thái booking thành confirmed
  booking.status = 'confirmed';
  await booking.save();
  
  // Xóa token đã sử dụng
  await Token.deleteOne({ _id: tokenDoc._id });
  
  // Lấy tên barber nếu có
  let barberName = null;
  if (booking.barber_id) {
    const barber = await Barber.findById(booking.barber_id);
    if (barber) {
      barberName = barber.name;
    }
  }
  
  // Trả về chi tiết booking đã xác nhận
  res.json({
    success: true,
    message: 'Booking đã được xác nhận thành công',
    booking: {
      ...booking.toObject(),
      barber_name: barberName
    }
  });
});

module.exports = {
  createBooking,
  getBookings,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBooking,
  updateBookingStatus,
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
  getTimeSlotStatus,
  getBookingStats,
  confirmBooking
};