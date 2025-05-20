const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
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
    service,
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

  // Chuyển đổi date sang đúng múi giờ Việt Nam
  const vnDate = dateUtils.toVNDateTime(date);

  const booking = new Booking({
    service,
    barber_id,
    date: vnDate, // Sử dụng ngày đã được chuyển đổi sang múi giờ Việt Nam
    time,
    name,
    email,
    phone,
    notes,
    status: requireEmailConfirmation ? 'pending' : 'confirmed', // Đặt trạng thái dựa trên yêu cầu xác nhận email
    user_id: user_id || (req.user ? req.user._id : null) // Sử dụng user_id cung cấp hoặc lấy từ người dùng đã xác thực nếu có
  });

  const createdBooking = await booking.save();
  
  // Populate thông tin barber để trả về cho client
  const populatedBooking = await Booking.findById(createdBooking._id)
    .populate('barber_id', 'name specialization');
  
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
      
      // Xác định URL cơ sở cho liên kết xác nhận
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Gửi email xác nhận booking
      await sendBookingConfirmationEmail({
        to: email,
        booking: {
          ...booking.toObject(),
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
    
    // Thay đổi cách truy vấn để tránh lỗi populate và thêm phân trang
    const bookings = await Booking.find(filter)
      .populate('barber_id', 'name specialization')
      .sort({ date: -1, time: -1 }) // Sắp xếp theo ngày và giờ (mới nhất trước)
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log(`Tìm thấy ${bookings.length} bookings trong tổng số ${totalCount}`);
    
    // Định dạng bookings để bao gồm tên barber và khách
    const formattedBookings = await Promise.all(bookings.map(async (booking) => {
      const formattedBooking = { ...booking };
      
      // Thêm tên dịch vụ cho hiển thị dễ dàng
      formattedBooking.serviceName = booking.service;
      
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
  const bookings = await Booking.find({ user_id: req.user._id })
    .populate('barber_id', 'name specialization')
    .sort({ date: -1, createdAt: -1 }); // Sắp xếp theo ngày (mới nhất trước)
  
  res.json(bookings);
});

// @desc    Lấy booking theo ID
// @route   GET /api/bookings/:id
// @access  Riêng tư
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('barber_id', 'name specialization');

  // Kiểm tra nếu booking không tồn tại
  if (!booking) {
    res.status(404);
    throw new Error('Không tìm thấy booking');
  }

  // Kiểm tra nếu booking không thuộc người dùng hoặc không phải admin
  if (booking.user_id && booking.user_id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && req.user.role !== 'manager') {
    res.status(403);
    throw new Error('Không có quyền xem booking này');
  }

  res.json(booking);
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
    const bookings = await Booking.find({
      barber_id: barberId,
      date: {
        $gte: dateUtils.getVNStartOfDay(new Date(date)),
        $lte: dateUtils.getVNEndOfDay(new Date(date))
      },
      status: { $in: ['pending', 'confirmed'] }
    });

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
    const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });

    // Tìm tất cả booking cho barber ngày đó
    const bookings = await Booking.find({
      barber_id: barberId,
      date: {
        $gte: dateUtils.getVNStartOfDay(new Date(date)),
        $lte: dateUtils.getVNEndOfDay(new Date(date))
      },
      status: { $in: ['pending', 'confirmed'] }
    });

    // Đánh dấu khung giờ là có sẵn hay không
    const bookedTimes = bookings.map(booking => booking.time);
    
    // Xác định nếu khung giờ đã qua cho hôm nay
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    // Tạo đối tượng khung giờ với thông tin availability và quá khứ
    const timeSlots = allTimeSlots.map(slot => {
      // Kiểm tra nếu khung giờ đã qua nếu là hôm nay
      let isPast = false;
      if (date === today) {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        
        // Khung giờ được coi là "quá khứ" nếu ít hơn 30 phút từ bây giờ
        isPast = slotTotalMinutes < currentTotalMinutes + 30;
      }

      return {
        start_time: slot,
        isPast: isPast,
        isAvailable: !bookedTimes.includes(slot)
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
  updateBookingStatus,
  getAvailableTimeSlots,
  checkTimeSlotAvailability,
  getTimeSlotStatus,
  getBookingStats,
  confirmBooking
};