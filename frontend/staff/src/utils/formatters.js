/**
 * Centralized formatters for staff frontend
 * Combines and extends dateUtils.js patterns used across pages
 */

/**
 * Format date string to dd/MM/yyyy
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format date/time to HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Format a time-slot string "HH:mm" or "H:mm" to 12h format e.g. "09:30 AM"
 * Used in Dashboard / Appointments where time is stored as a plain string, not a Date.
 * @param {string} timeString  e.g. "09:30"
 * @returns {string}
 */
export const formatTimeSlot = (timeString) => {
  if (!timeString) return '';
  const d = new Date(`2000-01-01T${timeString}`);
  if (isNaN(d.getTime())) return timeString;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format date and time to dd/MM/yyyy HH:mm
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Format a number as Vietnamese currency (VNĐ)
 * @param {number} amount
 * @returns {string}
 */
export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '0 VNĐ';
  return `${Number(amount).toLocaleString('vi-VN')} VNĐ`;
};

/**
 * Format a MongoDB _id to a short display ID (last 6 chars uppercase)
 * @param {string} id
 * @returns {string}
 */
export const formatShortId = (id) => {
  if (!id) return '';
  return `#${id.slice(-6).toUpperCase()}`;
};

/**
 * Capitalize first letter of a string
 * @param {string} str
 * @returns {string}
 */
export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export default {
  formatDate,
  formatTime,
  formatDateTime,
  formatCurrency,
  formatShortId,
  capitalizeFirst,
};
