/**
 * Status helpers for staff frontend
 * Maps status strings to Bootstrap badge colors and display labels
 */

// ─── Booking / Appointment ────────────────────────────────────────────────────

const BOOKING_STATUS_MAP = {
  pending:   { color: 'warning',   label: 'Pending' },
  confirmed: { color: 'success',   label: 'Confirmed' },
  cancelled: { color: 'danger',    label: 'Cancelled' },
  completed: { color: 'info',      label: 'Completed' },
};

/**
 * Get Bootstrap badge color for a booking/appointment status
 * @param {string} status
 * @returns {string} Bootstrap color class suffix
 */
export const getBookingStatusColor = (status) =>
  (BOOKING_STATUS_MAP[status?.toLowerCase()] || { color: 'secondary' }).color;

/**
 * Get display label for a booking/appointment status
 * @param {string} status
 * @returns {string}
 */
export const getBookingStatusLabel = (status) =>
  (BOOKING_STATUS_MAP[status?.toLowerCase()] || { label: status || 'Unknown' }).label;

// ─── Order ────────────────────────────────────────────────────────────────────

const ORDER_STATUS_MAP = {
  pending:    { color: 'warning',   label: 'Pending' },
  processing: { color: 'info',      label: 'Processing' },
  shipped:    { color: 'primary',   label: 'Shipped' },
  delivered:  { color: 'success',   label: 'Delivered' },
  cancelled:  { color: 'danger',    label: 'Cancelled' },
};

/**
 * Get Bootstrap badge color for an order status
 * @param {string} status
 * @returns {string}
 */
export const getOrderStatusColor = (status) =>
  (ORDER_STATUS_MAP[status?.toLowerCase()] || { color: 'secondary' }).color;

/**
 * Get display label for an order status
 * @param {string} status
 * @returns {string}
 */
export const getOrderStatusLabel = (status) =>
  (ORDER_STATUS_MAP[status?.toLowerCase()] || { label: status || 'Unknown' }).label;

// ─── Contact ──────────────────────────────────────────────────────────────────

const CONTACT_STATUS_MAP = {
  new:      { color: 'warning',    label: 'New' },
  read:     { color: 'info',       label: 'Read' },
  replied:  { color: 'success',    label: 'Replied' },
  archived: { color: 'secondary',  label: 'Archived' },
};

/**
 * Get Bootstrap badge color for a contact status
 * @param {string} status
 * @returns {string}
 */
export const getContactStatusColor = (status) =>
  (CONTACT_STATUS_MAP[status?.toLowerCase()] || { color: 'secondary' }).color;

/**
 * Get display label for a contact status
 * @param {string} status
 * @returns {string}
 */
export const getContactStatusLabel = (status) =>
  (CONTACT_STATUS_MAP[status?.toLowerCase()] || { label: status || 'Unknown' }).label;

// ─── Generic helper ───────────────────────────────────────────────────────────

/**
 * Get Bootstrap badge color for any entity type
 * @param {'booking'|'order'|'contact'} type
 * @param {string} status
 * @returns {string}
 */
export const getStatusColor = (type, status) => {
  switch (type) {
    case 'booking': return getBookingStatusColor(status);
    case 'order':   return getOrderStatusColor(status);
    case 'contact': return getContactStatusColor(status);
    default:        return 'secondary';
  }
};

/**
 * Get display label for any entity type
 * @param {'booking'|'order'|'contact'} type
 * @param {string} status
 * @returns {string}
 */
export const getStatusLabel = (type, status) => {
  switch (type) {
    case 'booking': return getBookingStatusLabel(status);
    case 'order':   return getOrderStatusLabel(status);
    case 'contact': return getContactStatusLabel(status);
    default:        return status || 'Unknown';
  }
};

export default {
  getBookingStatusColor,
  getBookingStatusLabel,
  getOrderStatusColor,
  getOrderStatusLabel,
  getContactStatusColor,
  getContactStatusLabel,
  getStatusColor,
  getStatusLabel,
};
