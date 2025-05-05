import api from './api';
import { isServerOnline } from '../utils/serverCheck';

/**
 * Get all active barbers
 * @returns {Promise<Array>} - Array of barber objects
 */
const getAllBarbers = async () => {
  try {
    // Check if server is online
    const serverReachable = await isServerOnline();
    if (!serverReachable) {
      throw new Error('Server is not reachable');
    }

    const response = await api.get('/barbers');
    return response.data.data.barbers;
  } catch (error) {
    console.error('Error fetching barbers:', error);
    throw error;
  }
};

/**
 * Get details for a specific barber
 * @param {string} id - Barber ID
 * @returns {Promise<Object>} - Barber details
 */
const getBarberById = async (id) => {
  try {
    const response = await api.get(`/barbers/${id}`);
    return response.data.data.barber;
  } catch (error) {
    console.error(`Error fetching barber with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get barber's working days and hours
 * @param {string} id - Barber ID
 * @returns {Promise<Object>} - Working days and hours
 */
const getBarberSchedule = async (id) => {
  try {
    const barber = await getBarberById(id);
    return {
      workingDays: barber.workingDays,
      workingHours: barber.workingHours
    };
  } catch (error) {
    console.error(`Error fetching barber schedule for ID ${id}:`, error);
    throw error;
  }
};

const barberService = {
  getAllBarbers,
  getBarberById,
  getBarberSchedule
};

export default barberService;