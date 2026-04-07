const dateUtils = require('../utils/dateUtils');

/**
 * Tính danh sách time slots bị chiếm dụng từ thời điểm bắt đầu và tổng duration.
 * Dùng < endTotalMinutes: slot cuối rảnh cho booking tiếp theo.
 *
 * @param {string} startTime - HH:mm
 * @param {number} totalDuration - phút
 * @returns {string[]} mảng các time slot dạng HH:mm
 */
const calculateOccupiedSlots = (startTime, totalDuration) => {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  let current = startHour * 60 + startMinute;
  const end = current + totalDuration;
  const slots = [];

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    current += 30;
  }

  return slots;
};

/**
 * Kiểm tra xem tại startSlotIndex có đủ consecutive slots trống không.
 *
 * @param {number} startSlotIndex
 * @param {number} requiredDuration - phút
 * @param {string[]} allTimeSlots - toàn bộ slots trong ngày
 * @param {Set<string>} occupiedSlots - các slots đã bị chiếm
 * @param {boolean} isToday
 * @param {number} currentTotalMinutes - phút hiện tại (VN)
 * @param {string} date - YYYY-MM-DD
 * @param {string} today - YYYY-MM-DD VN today
 * @returns {boolean}
 */
const hasConsecutiveSlots = (
  startSlotIndex,
  requiredDuration,
  allTimeSlots,
  occupiedSlots,
  isToday = false,
  currentTotalMinutes = 0,
  date = '',
  today = ''
) => {
  const slotsNeeded = Math.ceil(requiredDuration / 30);

  if (startSlotIndex + slotsNeeded > allTimeSlots.length) {
    return false;
  }

  for (let i = 0; i < slotsNeeded; i++) {
    const slotTime = allTimeSlots[startSlotIndex + i];

    if (isToday) {
      const [h, m] = slotTime.split(':').map(Number);
      if (h * 60 + m < currentTotalMinutes + 30) return false;
    }

    if (occupiedSlots.has(slotTime)) return false;
  }

  return true;
};

/**
 * Tổng hợp tất cả occupied slots từ danh sách bookings.
 *
 * @param {Object[]} bookings - booking documents
 * @returns {Set<string>}
 */
const buildOccupiedSlotsSet = (bookings) => {
  const occupiedSlots = new Set();

  bookings.forEach((booking) => {
    if (booking.occupiedTimeSlots && Array.isArray(booking.occupiedTimeSlots)) {
      booking.occupiedTimeSlots.forEach((slot) => occupiedSlots.add(slot));
    } else {
      // Fallback: tính từ time và duration
      const duration = booking.duration || 30;
      const slots = calculateOccupiedSlots(booking.time, duration);
      slots.forEach((s) => occupiedSlots.add(s));
    }
  });

  return occupiedSlots;
};

/**
 * Tạo đầy đủ thông tin status cho mỗi time slot trong ngày.
 *
 * @param {string[]} allTimeSlots
 * @param {Set<string>} occupiedSlots
 * @param {number} totalDuration - phút service cần đặt
 * @param {string} date - YYYY-MM-DD
 * @returns {Object[]}
 */
const buildTimeSlotStatus = (allTimeSlots, occupiedSlots, totalDuration, date) => {
  const today = dateUtils.getVNTodayString();
  const vnCurrentTime = dateUtils.getVNCurrentTime();
  const currentTotalMinutes = vnCurrentTime.totalMinutes;
  const isToday = date === today;

  return allTimeSlots.map((slot, index) => {
    let isPast = false;

    if (isToday) {
      const [h, m] = slot.split(':').map(Number);
      isPast = h * 60 + m < currentTotalMinutes + 30;
    }

    const isOccupied = occupiedSlots.has(slot);
    let isAvailable = !isPast && !isOccupied;

    if (isAvailable) {
      isAvailable = hasConsecutiveSlots(
        index,
        totalDuration,
        allTimeSlots,
        occupiedSlots,
        isToday,
        currentTotalMinutes,
        date,
        today
      );
    }

    return {
      start_time: slot,
      isPast,
      isAvailable,
      isOccupied,
      requiredDuration: totalDuration,
      occupiedTimeSlots: Array.from(occupiedSlots),
    };
  });
};

module.exports = {
  calculateOccupiedSlots,
  hasConsecutiveSlots,
  buildOccupiedSlotsSet,
  buildTimeSlotStatus,
};
