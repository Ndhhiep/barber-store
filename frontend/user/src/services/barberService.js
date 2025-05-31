import api from './api';

// Always use localhost:5000 for local development
const API_URL = 'http://localhost:5000/api';

// Get all active barbers
const getAllBarbers = async () => {
  try {
    const response = await api.get(`/barbers`);
    // Fix the data access to match the controller's response structure
    return response.data.data && response.data.data.barbers ? response.data.data.barbers : [];
  } catch (error) {
    console.error("Error fetching barbers:", error);
    // Return empty array instead of throwing to prevent app from crashing
    return [];
  }
};

// Get barber by ID
const getBarberById = async (id) => {
  try {
    const response = await api.get(`/barbers/${id}`);
    // Fix the data access to match the controller's response structure
    return response.data.data && response.data.data.barber ? response.data.data.barber : null;
  } catch (error) {
    console.error(`Error fetching barber with ID ${id}:`, error);
    return null;
  }
};

const barberService = {
  getAllBarbers,
  getBarberById
};

export default barberService;