const Booking = require('../models/Booking');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const User = require('../models/User');
const Token = require('../models/Token');
const mongoose = require('mongoose');
const crypto = require('crypto');
const dateUtils = require('../utils/dateUtils');
const { sendBookingConfirmationEmail } = require('../utils/emailUtils');
const { populateLegacyServices } = require('../helpers/legacyServiceMapper');
const { calculateOccupiedSlots, buildOccupiedSlotsSet, buildTimeSlotStatus } = require('./timeSlotService');

// ─── CREATE ─────────────────────────────────────────────────────────────────

const createBooking = async (dto) => {
  const { services, barber_id, date, time, name, email, phone, notes, user_id, requireEmailConfirmation } = dto;

  // Kiểm tra barber tồn tại
  const barber = await Barber.findById(barber_id);
  if (!barber) throw Object.assign(new Error('Không tìm thấy Barber'), { statusCode: 404 });

  // Lấy và kiểm tra services
  const serviceRecords = await Service.find({ _id: { $in: services } });
  if (serviceRecords.length !== services.length) {
    throw Object.assign(new Error('Một hoặc nhiều service không tồn tại'), { statusCode: 404 });
  }

  const vnDate = dateUtils.toVNDateTime(date);
  const totalDuration = serviceRecords.reduce((sum, s) => sum + (s.duration || 30), 0);
  const occupiedTimeSlots = calculateOccupiedSlots(time, totalDuration);

  const booking = new Booking({
    services,
    barber_id,
    date: vnDate,
    time,
    duration: totalDuration,
    occupiedTimeSlots,
    name,
    email,
    phone,
    notes,
    status: requireEmailConfirmation ? 'pending' : 'confirmed',
    user_id: user_id || null,
  });

  const createdBooking = await booking.save();

  const populatedBooking = await Booking.findById(createdBooking._id)
    .populate('barber_id', 'name specialization')
    .populate('services', 'name price duration description');

  if (requireEmailConfirmation) {
    await _handleEmailConfirmation(createdBooking, populatedBooking, barber, services, email);
    return { requiresConfirmation: true, bookingId: createdBooking._id };
  }

  return populatedBooking;
};

// ─── Private: email confirmation helper ─────────────────────────────────────

const _handleEmailConfirmation = async (createdBooking, populatedBooking, barber, serviceIds, email) => {
  const tokenString = crypto.randomBytes(32).toString('hex');
  await new Token({ bookingId: createdBooking._id, token: tokenString }).save();

  const barberName = barber ? barber.name : 'Any Available Barber';

  let serviceNames = [];
  if (populatedBooking.services && Array.isArray(populatedBooking.services)) {
    serviceNames = populatedBooking.services.map((s) => s.name || s.toString());
  } else {
    const fallback = await Service.find({ _id: { $in: serviceIds } });
    serviceNames = fallback.map((s) => s.name);
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  await sendBookingConfirmationEmail({
    to: email,
    booking: {
      ...createdBooking.toObject(),
      services: serviceNames,
      barber_name: barberName,
      _id: createdBooking._id,
    },
    token: tokenString,
    baseUrl,
  });
};

// ─── GET BOOKINGS (admin/staff) ──────────────────────────────────────────────

const getBookings = async (filter, pagination) => {
  const { page, limit, skip } = pagination;

  const totalCount = await Booking.countDocuments(filter);
  const bookings = await Booking.find(filter)
    .populate('barber_id', 'name specialization')
    .sort({ date: -1, time: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const formattedBookings = await Promise.all(
    bookings.map(async (booking) => {
      const formatted = await populateLegacyServices(booking);
      formatted.userName = booking.name || 'N/A';
      formatted.formattedDate = dateUtils.formatDate(booking.date);
      formatted.formattedTime = booking.time;

      if (booking.user_id && mongoose.Types.ObjectId.isValid(booking.user_id)) {
        try {
          const user = await User.findById(booking.user_id).select('name email').lean();
          if (user) {
            formatted.userName = user.name || booking.name || 'N/A';
            formatted.userEmail = user.email;
          }
        } catch (_) {}
      }

      return formatted;
    })
  );

  return {
    count: formattedBookings.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    bookings: formattedBookings,
  };
};

// ─── GET USER BOOKINGS ───────────────────────────────────────────────────────

const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user_id: userId })
    .populate('barber_id', 'name specialization')
    .sort({ date: -1, createdAt: -1 })
    .lean();

  return Promise.all(bookings.map((b) => populateLegacyServices(b)));
};

// ─── GET BOOKING BY ID ───────────────────────────────────────────────────────

const getBookingById = async (id) => {
  const booking = await Booking.findById(id)
    .populate('barber_id', 'name specialization')
    .lean();

  if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { statusCode: 404 });

  return populateLegacyServices(booking);
};

// ─── CANCEL BOOKING ──────────────────────────────────────────────────────────

const cancelBooking = async (id, userId, userRole) => {
  const booking = await Booking.findById(id);
  if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { statusCode: 404 });

  const isAdminOrManager = ['admin', 'manager'].includes(userRole);
  const isOwner = booking.user_id && booking.user_id.toString() === userId.toString();

  if (!isAdminOrManager && !isOwner) {
    throw Object.assign(new Error('Không có quyền hủy booking này'), { statusCode: 403 });
  }

  if (booking.status === 'completed') {
    throw Object.assign(new Error('Không thể hủy booking đã hoàn thành'), { statusCode: 400 });
  }

  booking.status = 'cancelled';
  booking.occupiedTimeSlots = [];
  return booking.save();
};

// ─── UPDATE BOOKING STATUS ───────────────────────────────────────────────────

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];

const updateBookingStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw Object.assign(new Error('Trạng thái không hợp lệ'), { statusCode: 400 });
  }

  const booking = await Booking.findById(id);
  if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { statusCode: 404 });

  booking.status = status;
  return booking.save();
};

// ─── UPDATE BOOKING ──────────────────────────────────────────────────────────

const updateBooking = async (id, dto) => {
  const { customerName, customerPhone, customerEmail, services, barberId, date, time, notes } = dto;

  let booking = await Booking.findById(id);
  if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { statusCode: 404 });

  // Validate & fetch barber
  if (barberId) {
    const barber = await Barber.findById(barberId);
    if (!barber) throw Object.assign(new Error('Không tìm thấy Barber'), { statusCode: 404 });
  }

  // Validate & fetch services
  let serviceRecords = null;
  if (services !== undefined) {
    serviceRecords = await Service.find({ _id: { $in: services } });
    if (serviceRecords.length !== services.length) {
      throw Object.assign(new Error('Một hoặc nhiều service không tồn tại'), { statusCode: 404 });
    }
  }

  // Apply updates
  if (customerName !== undefined) booking.name = customerName;
  if (customerPhone !== undefined) booking.phone = customerPhone;
  if (customerEmail !== undefined) booking.email = customerEmail;
  if (services !== undefined) booking.services = services;
  if (barberId !== undefined) booking.barber_id = barberId;
  if (time !== undefined) booking.time = time;
  if (notes !== undefined) booking.notes = notes;
  if (date !== undefined) booking.date = dateUtils.toVNDateTime(date);

  // Recalculate occupied slots if time/services changed
  if (time !== undefined || services !== undefined) {
    let totalDuration = 30;
    if (serviceRecords && serviceRecords.length > 0) {
      totalDuration = serviceRecords.reduce((sum, s) => sum + (s.duration || 30), 0);
    } else if (booking.services && booking.services.length > 0) {
      const existing = await Service.find({ _id: { $in: booking.services } });
      totalDuration = existing.reduce((sum, s) => sum + (s.duration || 30), 0);
    }
    booking.occupiedTimeSlots = calculateOccupiedSlots(booking.time, totalDuration);
    booking.duration = totalDuration;
  }

  try {
    const saved = await booking.save();
    return Booking.findById(saved._id)
      .populate('barber_id', 'name specialization')
      .populate('services', 'name price duration description');
  } catch (err) {
    if (err.name === 'VersionError') {
      // Retry với fresh document
      const fresh = await Booking.findById(id);
      if (!fresh) throw Object.assign(new Error('Booking no longer exists'), { statusCode: 404 });

      if (customerName !== undefined) fresh.name = customerName;
      if (customerPhone !== undefined) fresh.phone = customerPhone;
      if (customerEmail !== undefined) fresh.email = customerEmail;
      if (services !== undefined) fresh.services = services;
      if (barberId !== undefined) fresh.barber_id = barberId;
      if (time !== undefined) fresh.time = time;
      if (notes !== undefined) fresh.notes = notes;
      if (date !== undefined) fresh.date = dateUtils.toVNDateTime(date);

      const saved = await fresh.save();
      return Booking.findById(saved._id).populate('barber_id', 'name specialization');
    }
    throw err;
  }
};

// ─── CONFIRM BOOKING ─────────────────────────────────────────────────────────

const confirmBooking = async (token) => {
  if (!token) throw Object.assign(new Error('Token là bắt buộc'), { statusCode: 400 });

  const tokenDoc = await Token.findOne({ token });
  if (!tokenDoc) throw Object.assign(new Error('Token xác nhận không hợp lệ hoặc đã hết hạn'), { statusCode: 404 });

  if (new Date() > new Date(tokenDoc.expiresAt)) {
    await Token.deleteOne({ _id: tokenDoc._id });
    throw Object.assign(new Error('Token xác nhận đã hết hạn'), { statusCode: 400 });
  }

  const booking = await Booking.findById(tokenDoc.bookingId);
  if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { statusCode: 404 });

  booking.status = 'confirmed';
  await booking.save();
  await Token.deleteOne({ _id: tokenDoc._id });

  let barberName = null;
  if (booking.barber_id) {
    const barber = await Barber.findById(booking.barber_id);
    if (barber) barberName = barber.name;
  }

  return { booking: booking.toObject(), barberName };
};

// ─── GET STATS ───────────────────────────────────────────────────────────────

const getBookingStats = async () => {
  const totalBookings = await Booking.countDocuments();

  const bookingsByStatus = await Booking.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  bookingsByStatus.forEach((item) => {
    if (item._id && Object.prototype.hasOwnProperty.call(statusCounts, item._id)) {
      statusCounts[item._id] = item.count;
    }
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [monthlyBookings, todayBookings, upcomingBookings, popularBarbers] = await Promise.all([
    Booking.countDocuments({ date: { $gte: startOfMonth } }),
    Booking.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
    Booking.countDocuments({ date: { $gte: today, $lt: nextWeek }, status: { $nin: ['cancelled', 'completed'] } }),
    Booking.aggregate([
      { $match: { status: { $nin: ['cancelled'] } } },
      { $group: { _id: '$barber_id', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'barbers', localField: '_id', foreignField: '_id', as: 'barber' } },
      { $project: { _id: 1, count: 1, name: { $arrayElemAt: ['$barber.name', 0] }, specialization: { $arrayElemAt: ['$barber.specialization', 0] } } },
    ]),
  ]);

  return {
    totalBookings,
    ...statusCounts,
    pendingBookings: statusCounts.pending,
    confirmedBookings: statusCounts.confirmed,
    completedBookings: statusCounts.completed,
    cancelledBookings: statusCounts.cancelled,
    monthlyBookings,
    todayBookings,
    upcomingBookings,
    popularBarbers,
  };
};

// ─── BUILD FILTER FROM QUERY ─────────────────────────────────────────────────

const buildBookingFilter = (query) => {
  const filter = {};

  if (query.userId) filter.user_id = query.userId;

  if (query.date) {
    filter.date = {
      $gte: dateUtils.getVNStartOfDay(new Date(query.date)),
      $lte: dateUtils.getVNEndOfDay(new Date(query.date)),
    };
  } else if (query.startDate && query.endDate) {
    filter.date = {
      $gte: dateUtils.getVNStartOfDay(new Date(query.startDate)),
      $lte: dateUtils.getVNEndOfDay(new Date(query.endDate)),
    };
  }

  return filter;
};

const buildPagination = (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  return { page, limit, skip: (page - 1) * limit };
};

// ─── AVAILABLE TIME SLOTS ────────────────────────────────────────────────────

const getAvailableTimeSlots = async (date, barberId, excludeBookingId = null) => {
  const barber = await Barber.findById(barberId);
  if (!barber) throw Object.assign(new Error('Không tìm thấy Barber'), { statusCode: 404 });
  if (!barber.is_active) throw Object.assign(new Error('Barber này hiện không hoạt động'), { statusCode: 400 });

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  if (barber.workingDays && !barber.workingDays[dayOfWeek]) {
    return { timeSlots: [], message: `Barber không làm việc vào ${dayOfWeek}` };
  }

  const start = barber.workingHours?.start || '09:00';
  const end = barber.workingHours?.end || '19:00';
  const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });

  const query = {
    barber_id: barberId,
    date: { $gte: dateUtils.getVNStartOfDay(new Date(date)), $lte: dateUtils.getVNEndOfDay(new Date(date)) },
    status: { $in: ['pending', 'confirmed'] },
  };
  if (excludeBookingId) query._id = { $ne: excludeBookingId };

  const bookings = await Booking.find(query);
  const bookedTimes = bookings.map((b) => b.time);

  const timeSlots = allTimeSlots.map((slot) => ({
    start_time: slot,
    is_available: !bookedTimes.includes(slot),
  }));

  const today = dateUtils.getVNTodayString();
  if (date === today) {
    const vnCurrentTime = dateUtils.getVNCurrentTime();
    const current = vnCurrentTime.totalMinutes;
    return {
      timeSlots: timeSlots.filter((slot) => {
        const [h, m] = slot.start_time.split(':').map(Number);
        return h * 60 + m > current + 30;
      }),
    };
  }

  return { timeSlots };
};

// ─── TIME SLOT STATUS ────────────────────────────────────────────────────────

const getTimeSlotStatus = async (date, barberId, serviceIds = null, excludeBookingId = null) => {
  const barber = await Barber.findById(barberId);
  if (!barber) throw Object.assign(new Error('Không tìm thấy Barber'), { statusCode: 404 });
  if (!barber.is_active) throw Object.assign(new Error('Barber này hiện không hoạt động'), { statusCode: 400 });

  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  if (barber.workingDays && !barber.workingDays[dayOfWeek]) {
    return { timeSlots: [], message: `Barber không làm việc vào ${dayOfWeek}` };
  }

  const start = barber.workingHours?.start || '09:00';
  const end = barber.workingHours?.end || '19:00';

  const [year, month, day] = date.split('-');
  const normalizedDate = `${year}-${month}-${day}`;
  const dateObj = dateUtils.toVNDateTime(normalizedDate);

  const allTimeSlots = dateUtils.generateTimeSlots(new Date(date), 30, { open: start, close: end });

  // Tính total duration từ services
  let totalDuration = 30;
  if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
    const validIds = serviceIds.filter((id) => id && /^[0-9a-fA-F]{24}$/.test(typeof id === 'object' ? id._id : id));
    const extractedIds = validIds.map((id) => (typeof id === 'object' ? id._id : id));
    if (extractedIds.length > 0) {
      const selected = await Service.find({ _id: { $in: extractedIds } });
      totalDuration = selected.reduce((sum, s) => sum + (s.duration || 30), 0);
    }
  }

  const bookingQuery = {
    barber_id: barberId,
    date: { $gte: dateUtils.getVNStartOfDay(dateObj), $lte: dateUtils.getVNEndOfDay(dateObj) },
    status: { $in: ['pending', 'confirmed'] },
  };
  if (excludeBookingId) bookingQuery._id = { $ne: excludeBookingId };

  const bookings = await Booking.find(bookingQuery);
  const occupiedSlots = buildOccupiedSlotsSet(bookings);
  const timeSlots = buildTimeSlotStatus(allTimeSlots, occupiedSlots, totalDuration, date);

  return { timeSlots };
};

module.exports = {
  createBooking,
  getBookings,
  getUserBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  updateBooking,
  confirmBooking,
  getBookingStats,
  buildBookingFilter,
  buildPagination,
  getAvailableTimeSlots,
  getTimeSlotStatus,
};
