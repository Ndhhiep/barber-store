import axios from 'axios';
import { isServerOnline } from '../utils/serverCheck';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api'; // Use variable from .env file

// Helper function to get auth headers
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

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

    // If barberId is 'any', use a different endpoint or provide default time slots
    if (barberId === 'any') {
      // Return default time slots without checking availability
      // These can be adjusted according to your business hours
      const defaultTimeSlots = [
        "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
        "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
        "18:00", "18:30", "19:00"
      ];

      // Filter out past time slots if the date is today
      if (date === new Date().toISOString().split('T')[0]) {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMinute;

        return defaultTimeSlots.map(timeSlot => {
          const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
          const slotTotalMinutes = slotHour * 60 + slotMinute;
          
          return {
            start_time: timeSlot,
            isPast: slotTotalMinutes < (currentTotalMinutes + 30),
            isAvailable: slotTotalMinutes >= (currentTotalMinutes + 30)
          };
        });
      }      // For future dates, all slots are available
      return defaultTimeSlots.map(timeSlot => ({
        start_time: timeSlot,
        isPast: false,
        isAvailable: true
      }));
    }
    
    // Regular flow for specific barber
    const response = await axios.get(`${API_URL}/bookings/time-slots-status`, {
      params: {
        barberId,
        date
      },
      headers: getAuthHeader()
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
    const response = await axios.get(`${API_URL}/bookings/check-availability`, {
      params: {
        barberId,
        date,
        timeSlot
      },
      headers: getAuthHeader()
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