import api from './api';
import { isServerOnline } from '../../utils/serverCheck';

/**
 * Get time slot status for a specific barber on a given date
 * @param {string} barberId - ID of the barber
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array>} - Array of time slot objects with start_time and status properties
 */
const getTimeSlotStatus = async (barberId, date) => {
  try {
    // Check if server is online
    const serverReachable = await isServerOnline();
    if (!serverReachable) {
      throw new Error('Server is not reachable');
    }

    const response = await api.get('/bookings/time-slots-status', {
      params: {
        barberId,
        date
      }
    });

    // Return time slots status array
    return response.data.data.timeSlots;
  } catch (error) {
    console.error('Error fetching time slot status:', error);
    throw error;
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
    const response = await api.get('/bookings/check-availability', {
      params: {
        barberId,
        date,
        timeSlot
      }
    });
    
    return response.data.data.isAvailable;
  } catch (error) {
    console.error('Error checking time slot availability:', error);
    throw error;
  }
};

/**
 * Get working hours configuration
 * @returns {Object} - Working hours configuration
 */
const getTimeSlotSettings = () => {
  // This could be fetched from the backend in the future,
  // but for now we'll use hardcoded values
  return {
    defaultDuration: 30, // minutes
    workingHours: {
      start: '09:00',
      end: '19:00'
    },
    breakBetweenSlots: 5 // minutes
  };
};

/**
 * Generate time slots for a given working hours range
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @param {number} durationMinutes - Duration of each slot in minutes
 * @returns {Array<string>} - Array of time slots in HH:MM format
 */
const generateTimeSlots = (startTime, endTime, durationMinutes = 30) => {
  const slots = [];
  
  // Parse start and end times
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);
  
  // Convert to minutes for easier calculations
  let startTimeInMinutes = startHours * 60 + startMinutes;
  const endTimeInMinutes = endHours * 60 + endMinutes;
  
  // Generate slots
  while (startTimeInMinutes + durationMinutes <= endTimeInMinutes) {
    // Format the time slot
    const hours = Math.floor(startTimeInMinutes / 60);
    const minutes = startTimeInMinutes % 60;
    
    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    
    slots.push(`${formattedHours}:${formattedMinutes}`);
    
    // Move to next slot
    startTimeInMinutes += durationMinutes;
  }
  
  return slots;
};

const timeSlotService = {
  getTimeSlotStatus,
  checkTimeSlotAvailability,
  getTimeSlotSettings,
  generateTimeSlots
};

export default timeSlotService;