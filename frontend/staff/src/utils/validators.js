/**
 * Reusable validation utilities for staff frontend forms
 */

/**
 * Check that a value is not empty
 * @param {any} value
 * @returns {boolean}
 */
export const isRequired = (value) => {
  if (value == null) return false;
  return value.toString().trim().length > 0;
};

/**
 * Check valid email format
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Check valid Vietnamese phone number (10–11 digits)
 * @param {string} phone
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};

/**
 * Check that a value is a positive number
 * @param {any} value
 * @returns {boolean}
 */
export const isPositiveNumber = (value) => {
  if (value == null || value === '') return false;
  return !isNaN(value) && Number(value) > 0;
};

/**
 * Check that a value is zero or a positive number
 * @param {any} value
 * @returns {boolean}
 */
export const isNonNegativeNumber = (value) => {
  if (value == null || value === '') return false;
  return !isNaN(value) && Number(value) >= 0;
};

/**
 * Check that a value is within a numeric range (inclusive)
 * @param {any} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean}
 */
export const isInRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Check minimum string length
 * @param {string} value
 * @param {number} min
 * @returns {boolean}
 */
export const hasMinLength = (value, min) => {
  if (!value) return false;
  return value.toString().trim().length >= min;
};

/**
 * Check maximum string length
 * @param {string} value
 * @param {number} max
 * @returns {boolean}
 */
export const hasMaxLength = (value, max) => {
  if (!value) return true; // Empty is within max
  return value.toString().trim().length <= max;
};

/**
 * Run a set of validation rules against form data
 * @param {Object} data - Form data object
 * @param {Object} rules - { fieldName: (value, data) => errorString | null }
 * @returns {Object} errors - { fieldName: errorString }
 */
export const validateForm = (data, rules) => {
  const errors = {};
  Object.entries(rules).forEach(([field, ruleFn]) => {
    const error = ruleFn(data[field], data);
    if (error) errors[field] = error;
  });
  return errors;
};

export default {
  isRequired,
  isValidEmail,
  isValidPhone,
  isPositiveNumber,
  isNonNegativeNumber,
  isInRange,
  hasMinLength,
  hasMaxLength,
  validateForm,
};
