import axios from 'axios';
import staffAuthService from './staffAuthService';
import { isSameDate, getTodayString } from '../utils/dateUtils';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api';

/**
 * Get time slot status for a specific barber on a given date
 * @param {string} barberId - ID of the barber
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} services - Array of selected service IDs (optional)
 * @param {string} excludeBookingId - ID of booking to exclude from occupied slots (optional, for editing)
 * @returns {Promise<Array>} - Array of time slot objects with start_time and status properties
 */
const getTimeSlotStatus = async (barberId, date, services = [], excludeBookingId = null) => {
  try {
    let endpoint = `${API_URL}/bookings/time-slots-status`;
    const params = new URLSearchParams();
    
    if (barberId) {
      params.append('barberId', barberId);
    }
      if (date) {
      params.append('date', date);
    }
    
    // Add services if provided
    if (services && services.length > 0) {
      params.append('services', JSON.stringify(services));
    }
    
    // Add excludeBookingId if provided (for editing appointments)
    if (excludeBookingId) {
      params.append('excludeBookingId', excludeBookingId);
    }
    
    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }
    
    const response = await axios.get(endpoint, {
      headers: staffAuthService.authHeader()
    });
    
    // Check for proper response structure
    if (response.data && response.data.data && response.data.data.timeSlots) {
      return response.data.data.timeSlots;
    }
    
    // If response doesn't have expected structure, return the data directly
    // This is a fallback for different API response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    throw new Error('Invalid time slots data format from API');
  } catch (error) {
    console.error('Error fetching time slot status:', error);
    
    // Return default time slots with availability set to true
    const defaultTimeSlots = [
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
      "18:00", "18:30", "19:00"
    ];
      // If it's today, mark past slots as unavailable
    const today = getTodayString();
    if (isSameDate(date, today)) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      
      return defaultTimeSlots.map(timeSlot => {
        const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
        const slotTotalMinutes = slotHour * 60 + slotMinute;
        
        return {
          start_time: timeSlot,
          isPast: slotTotalMinutes < (currentTotalMinutes + 30), // Add 30-min buffer
          isAvailable: slotTotalMinutes >= (currentTotalMinutes + 30)
        };
      });
    }
    
    // For future dates, all slots are available
    return defaultTimeSlots.map(time => ({
      start_time: time,
      isAvailable: true,
      isPast: false
    }));
  }
};

/**
 * Check if a specific time slot is available
 * @param {string} barberId - ID of the barber
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} timeSlot - Time slot in HH:MM format
 * @returns {Promise<boolean>} - True if the time slot is available
 */
const checkTimeSlotAvailability = async (barberId, date, timeSlot) => {
  try {
    const response = await axios.get(`${API_URL}/bookings/check-availability`, {
      params: {
        barberId,
        date,
        timeSlot
      },
      headers: staffAuthService.authHeader()
    });
    
    if (response.data && response.data.data && typeof response.data.data.isAvailable === 'boolean') {
      return response.data.data.isAvailable;
    }
    
    return true; // Default to available if response format is unexpected
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    return true; // Default to available if there's an error
  }
};

/**
 * Get default time slot settings (business hours)
 * @returns {Object} - Time slot settings
 */
const getTimeSlotSettings = () => {
  return {
    defaultDuration: 30, // minutes
    workingHours: {
      start: '09:00',
      end: '19:00'
    }
  };
};

const staffTimeSlotService = {
  getTimeSlotStatus,
  checkTimeSlotAvailability,
  getTimeSlotSettings
};

export default staffTimeSlotService;
