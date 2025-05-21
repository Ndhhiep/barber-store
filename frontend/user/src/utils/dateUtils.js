/**
 * Các tiện ích xử lý thời gian với múi giờ UTC+7 (Việt Nam) cho frontend
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
 * Format ngày đầy đủ kiểu thân thiện
 * @param {string|Date} date - Ngày cần format
 * @returns {string} Chuỗi ngày đã được format
 */
export const formatDateLong = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long', 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric'
  });
};

/**
 * Kiểm tra xem một ngày có phải là ngày hôm nay không
 * @param {string|Date} date - Ngày cần kiểm tra
 * @returns {boolean} True nếu là ngày hôm nay
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Lấy ngày hiện tại định dạng YYYY-MM-DD
 * @returns {string} Ngày hiện tại định dạng YYYY-MM-DD
 */
export const getTodayISO = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Chuyển đổi giờ dạng 24 giờ sang 12 giờ
 * @param {string} time - Giờ định dạng HH:mm (24 giờ)
 * @returns {string} Giờ định dạng 12 giờ (VD: 2:30 PM)
 */
export const convertTo12HourFormat = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Tính số ngày giữa hai ngày
 * @param {string|Date} startDate - Ngày bắt đầu
 * @param {string|Date} endDate - Ngày kết thúc
 * @returns {number} Số ngày giữa hai ngày
 */
export const daysBetween = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const dateUtils = {
  formatDate,
  formatTime,
  formatDateTime,
  formatDateLong,
  isToday,
  getTodayISO,
  convertTo12HourFormat,
  daysBetween
};

export default dateUtils;