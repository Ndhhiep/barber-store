/**
 * Các tiện ích xử lý thời gian với múi giờ UTC+7 (Việt Nam) cho frontend staff
 */

/**
 * Format ngày thành chuỗi theo định dạng dd/MM/yyyy
 * @param {string|Date} date - Ngày cần format 
 * @returns {string} Chuỗi ngày đã được format
 */
export const formatDate = (date) => {
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
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format ngày và giờ thành chuỗi dd/MM/yyyy HH:mm
 * @param {string|Date} date - Ngày giờ cần format
 * @returns {string} Chuỗi ngày giờ đã được format
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Format ngày theo định dạng cho hiển thị trong bảng hoặc báo cáo
 * @param {string|Date} date - Ngày cần format
 * @returns {string} Chuỗi ngày đã được format
 */
export const formatDateForDisplay = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return d.toLocaleDateString('vi-VN', options);
};

/**
 * Lấy ngày đầu tiên của tuần hiện tại
 * @returns {Date} Ngày đầu tiên của tuần
 */
export const getStartOfWeek = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Chủ nhật, 1 = Thứ hai, ...
  const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Điều chỉnh nếu hôm nay là Chủ nhật
  const monday = new Date(today.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Lấy ngày cuối cùng của tuần hiện tại
 * @returns {Date} Ngày cuối cùng của tuần
 */
export const getEndOfWeek = () => {
  const startOfWeek = getStartOfWeek();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

/**
 * Lấy ngày đầu tiên của tháng hiện tại
 * @returns {Date} Ngày đầu tiên của tháng
 */
export const getStartOfMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

/**
 * Lấy ngày cuối cùng của tháng hiện tại
 * @returns {Date} Ngày cuối cùng của tháng
 */
export const getEndOfMonth = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
};

/**
 * Tạo mảng các ngày trong tuần hiện tại
 * @returns {Array<Date>} Mảng các ngày trong tuần
 */
export const getDaysOfWeek = () => {
  const startOfWeek = getStartOfWeek();
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push(day);
  }
  
  return days;
};

/**
 * Kiểm tra xem một ngày có nằm trong ngày hiện tại không
 * @param {Date|string} date - Ngày cần kiểm tra
 * @returns {boolean} Kết quả kiểm tra
 */
export const isToday = (date) => {
  const today = new Date();
  const compareDate = new Date(date);
  
  return (
    today.getDate() === compareDate.getDate() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getFullYear() === compareDate.getFullYear()
  );
};

/**
 * Lấy danh sách tháng trong năm (dùng cho báo cáo)
 * @returns {Array<string>} Danh sách tháng
 */
export const getMonthNames = () => {
  return [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateForDisplay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getDaysOfWeek,
  isToday,
  getMonthNames
};