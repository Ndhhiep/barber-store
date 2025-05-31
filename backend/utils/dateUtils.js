/**
 * Các tiện ích xử lý thời gian với múi giờ UTC+7 (Việt Nam)
 */

/**
 * Chuyển đổi ngày giờ sang đối tượng Date với múi giờ Việt Nam
 * @param {string|Date} date - Ngày cần chuyển đổi
 * @returns {Date} Đối tượng Date đã được chuyển đổi
 */
const toVNDateTime = (date) => {
  if (!date) return null;
  
  // Nếu date là string với định dạng YYYY-MM-DD, chuyển đổi nó đúng cách
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    // Tạo một date mới với giờ 00:00:00 ở múi giờ UTC
    const [year, month, day] = date.split('-').map(Number);
    console.log(`Converting YYYY-MM-DD format: ${date} to Date object (year: ${year}, month: ${month-1}, day: ${day})`);
    
    // Create Date with consistent timezone handling (UTC)
    // First create the date as a string in ISO format to avoid timezone issues
    const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`;
    const dateObj = new Date(isoDate);
    
    console.log(`Created Date object: ${dateObj.toISOString()}`);
    return dateObj;
  }
  
  // Xử lý trường hợp date đã là object
  return new Date(date);
};

/**
 * Format ngày thành chuỗi theo định dạng dd/MM/yyyy
 * @param {string|Date} date - Ngày cần format 
 * @returns {string} Chuỗi ngày đã được format
 */
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format giờ thành chuỗi theo định dạng HH:mm
 * @param {string|Date} date - Ngày giờ cần format
 * @returns {string} Chuỗi giờ đã được format
 */
const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Lấy ngày hiện tại ở múi giờ Việt Nam, reset về 00:00:00
 * @returns {Date} Ngày hiện tại đầu ngày
 */
const getVNStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  
  // Extract year, month, day to create a consistent date
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();
  
  // Create a new date object with consistent time (start of day)
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  console.log(`Created start of day for ${date}: ${startOfDay.toISOString()}`);
  return startOfDay;
};

/**
 * Lấy ngày hiện tại ở múi giờ Việt Nam, set về 23:59:59
 * @returns {Date} Ngày hiện tại cuối ngày
 */
const getVNEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  
  // Extract year, month, day to create a consistent date
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed
  const day = d.getDate();
  
  // Create a new date object with consistent time (end of day)
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  console.log(`Created end of day for ${date}: ${endOfDay.toISOString()}`);
  return endOfDay;
};

/**
 * Chuyển đổi giờ dạng chuỗi "HH:mm" thành đối tượng Date
 * @param {string} timeString - Chuỗi giờ (ví dụ: "14:30")
 * @param {Date} dateObj - Đối tượng ngày để đặt giờ vào
 * @returns {Date} Đối tượng Date với giờ đã được thiết lập
 */
const timeStringToDate = (timeString, dateObj = new Date()) => {
  if (!timeString || !timeString.includes(':')) return dateObj;
  
  const date = new Date(dateObj);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Kiểm tra xem thời gian có nằm trong khoảng ngày làm việc không
 * @param {string} timeString - Chuỗi giờ (ví dụ: "14:30") 
 * @param {Object} workingHours - Object chứa giờ mở cửa và đóng cửa
 * @returns {boolean} true nếu thời gian nằm trong giờ làm việc
 */
const isWithinWorkingHours = (timeString, workingHours = { open: "09:00", close: "20:00" }) => {
  // Convert to minutes for easier comparison
  const convertToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const timeMinutes = convertToMinutes(timeString);
  const openMinutes = convertToMinutes(workingHours.open);
  const closeMinutes = convertToMinutes(workingHours.close);
  
  return timeMinutes >= openMinutes && timeMinutes <= closeMinutes;
};

/**
 * Tạo danh sách các khung giờ có sẵn
 * @param {Date} date - Ngày cần tạo khung giờ
 * @param {number} intervalMinutes - Khoảng thời gian giữa các khung giờ (phút)
 * @param {Object} workingHours - Giờ làm việc
 * @returns {Array} Danh sách khung giờ định dạng "HH:mm"
 */
const generateTimeSlots = (date = new Date(), intervalMinutes = 30, workingHours = { open: "09:00", close: "20:00" }) => {
  const [openHour, openMinute] = workingHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = workingHours.close.split(':').map(Number);
  
  const startDate = new Date(date);
  startDate.setHours(openHour, openMinute, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(closeHour, closeMinute, 0, 0);
  
  const slots = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    slots.push(formatTime(current));
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return slots;
};

module.exports = {
  toVNDateTime,
  formatDate,
  formatTime,
  getVNStartOfDay,
  getVNEndOfDay,
  timeStringToDate,
  isWithinWorkingHours,
  generateTimeSlots
};