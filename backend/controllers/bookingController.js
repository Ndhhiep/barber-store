const asyncHandler = require('express-async-handler');
const bookingService = require('../services/bookingService');
const CreateBookingDTO = require('../dto/booking/CreateBookingDTO');
const UpdateBookingDTO = require('../dto/booking/UpdateBookingDTO');
const TimeSlotQueryDTO = require('../dto/booking/TimeSlotQueryDTO');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sendValidationError = (res, errors) =>
  res.status(400).json({ status: 'fail', message: errors[0], errors });

const handleServiceError = (res, error) => {
  const status = error.statusCode || 500;
  res.status(status).json({
    status: status >= 500 ? 'error' : 'fail',
    message: error.message || 'Đã xảy ra lỗi',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
};

// ─── @desc    Tạo mới booking ─────────────────────────────────────────────────
// @route   POST /api/bookings
// @access  Công khai
const createBooking = asyncHandler(async (req, res) => {
  const dto = new CreateBookingDTO({
    ...req.body,
    user_id: req.body.user_id || (req.user ? req.user._id : null),
  });

  const errors = dto.validate();
  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    const result = await bookingService.createBooking(dto);

    if (result && result.requiresConfirmation) {
      return res.status(201).json({
        message: 'Booking đã được tạo. Vui lòng kiểm tra email để xác nhận.',
        bookingId: result.bookingId,
        requiresConfirmation: true,
      });
    }

    res.status(201).json(result);
  } catch (error) {
    // Email failure — vẫn trả 201 nhưng thông báo lỗi email
    if (error.isEmailError) {
      return res.status(201).json({
        message: 'Booking đã được tạo nhưng không thể gửi email xác nhận.',
        bookingId: error.bookingId,
        requiresConfirmation: true,
        emailError: true,
      });
    }
    handleServiceError(res, error);
  }
});

// ─── @desc    Lấy tất cả bookings ────────────────────────────────────────────
// @route   GET /api/bookings
// @access  Riêng tư/Admin
const getBookings = asyncHandler(async (req, res) => {
  try {
    const filter = bookingService.buildBookingFilter(req.query);
    const pagination = bookingService.buildPagination(req.query);

    const result = await bookingService.getBookings(filter, pagination);

    res.json({ status: 'success', ...result });
  } catch (error) {
    handleServiceError(res, error);
  }
});

// ─── @desc    Lấy bookings của người dùng đang đăng nhập ─────────────────────
// @route   GET /api/bookings/my-bookings
// @access  Riêng tư
const getUserBookings = asyncHandler(async (req, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user._id);
    res.json(bookings);
  } catch (error) {
    handleServiceError(res, error);
  }
});

// ─── @desc    Lấy booking theo ID ────────────────────────────────────────────
// @route   GET /api/bookings/:id
// @access  Riêng tư
const getBookingById = asyncHandler(async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    const isStaffOrAdmin = ['admin', 'manager', 'barber', 'staff'].includes(req.user.role);
    const isOwner = booking.user_id && booking.user_id.toString() === req.user._id.toString();

    if (!isStaffOrAdmin && !isOwner) {
      return res.status(403).json({ status: 'fail', message: 'Không có quyền xem booking này' });
    }

    res.json(booking);
  } catch (error) {
    handleServiceError(res, error);
  }
});

// ─── @desc    Hủy booking ─────────────────────────────────────────────────────
// @route   PUT /api/bookings/:id/cancel
// @access  Riêng tư
const cancelBooking = asyncHandler(async (req, res) => {
  try {
    const updated = await bookingService.cancelBooking(req.params.id, req.user._id, req.user.role);
    res.json(updated);
  } catch (error) {
    handleServiceError(res, error);
  }
});

// ─── @desc    Cập nhật trạng thái booking ────────────────────────────────────
// @route   PUT /api/bookings/:id/status
// @access  Riêng tư/Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  try {
    const updated = await bookingService.updateBookingStatus(req.params.id, req.body.status);
    res.json(updated);
  } catch (error) {
    handleServiceError(res, error);
  }
});

// ─── @desc    Cập nhật thông tin booking ─────────────────────────────────────
// @route   PUT /api/bookings/:id
// @access  Riêng tư/Staff
const updateBooking = asyncHandler(async (req, res) => {
  const dto = new UpdateBookingDTO(req.body);
  const errors = dto.validate();
  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    const updated = await bookingService.updateBooking(req.params.id, dto);
    res.json({ success: true, message: 'Booking đã được cập nhật thành công', booking: updated });
  } catch (error) {
    handleServiceError(res, error);
  }
});

// ─── @desc    Lấy các khung giờ còn trống ────────────────────────────────────
// @route   GET /api/bookings/time-slots
// @access  Công khai
const getAvailableTimeSlots = async (req, res) => {
  const dto = new TimeSlotQueryDTO({ date: req.query.date, barberId: req.query.barberId });
  const errors = dto.validate();
  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    const result = await bookingService.getAvailableTimeSlots(
      dto.date,
      dto.barberId,
      req.query.excludeBookingId
    );
    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    handleServiceError(res, error);
  }
};

// ─── @desc    Kiểm tra khung giờ có trống không ───────────────────────────────
// @route   GET /api/bookings/check-availability
// @access  Công khai
const checkTimeSlotAvailability = async (req, res) => {
  const { date, timeSlot, barberId } = req.query;

  if (!date || !timeSlot || !barberId) {
    return res.status(400).json({ status: 'fail', message: 'Vui lòng cung cấp date, timeSlot và barberId' });
  }

  try {
    const Barber = require('../models/Barber');
    const barber = await Barber.findById(barberId);
    if (!barber) return res.status(404).json({ status: 'fail', message: 'Không tìm thấy Barber' });

    const isAvailable = await barber.isAvailable(date, timeSlot);
    res.status(200).json({ status: 'success', data: { isAvailable } });
  } catch (error) {
    handleServiceError(res, error);
  }
};

// ─── @desc    Lấy trạng thái tất cả khung giờ ────────────────────────────────
// @route   GET /api/bookings/time-slots-status
// @access  Công khai
const getTimeSlotStatus = async (req, res) => {
  const dto = new TimeSlotQueryDTO(req.query);
  const errors = dto.validate();
  if (errors.length > 0) return sendValidationError(res, errors);

  try {
    let serviceIds = null;
    if (req.query.services) {
      try {
        serviceIds = JSON.parse(req.query.services);
      } catch (_) {}
    }

    const result = await bookingService.getTimeSlotStatus(
      dto.date,
      dto.barberId,
      serviceIds,
      dto.excludeBookingId
    );

    res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    handleServiceError(res, error);
  }
};

// ─── @desc    Lấy thống kê booking ───────────────────────────────────────────
// @route   GET /api/bookings/stats
// @access  Riêng tư/Admin/Staff
const getBookingStats = async (req, res) => {
  try {
    const stats = await bookingService.getBookingStats();
    res.status(200).json({ status: 'success', data: stats });
  } catch (error) {
    handleServiceError(res, error);
  }
};

// ─── @desc    Xác nhận booking với token ─────────────────────────────────────
// @route   POST /api/bookings/confirm
// @access  Công khai
const confirmBooking = asyncHandler(async (req, res) => {
  try {
    const { booking, barberName } = await bookingService.confirmBooking(req.body.token);
    res.json({
      success: true,
      message: 'Booking đã được xác nhận thành công',
      booking: { ...booking, barber_name: barberName },
    });
  } catch (error) {
    handleServiceError(res, error);
  }
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
  confirmBooking,
};