import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api'; // Use variable from .env file

// Get all active barbers
const getAllBarbers = async () => {
  try {
    const response = await axios.get(`${API_URL}/barbers`);
    // Fix the data access to match the controller's response structure
    return response.data.data.barbers || [];
  } catch (error) {
    console.error("Error fetching barbers:", error);
    throw error;
  }
};

// Get barber by ID
const getBarberById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/barbers/${id}`);
    // Fix the data access to match the controller's response structure
    return response.data.data.barber;
  } catch (error) {
    console.error(`Error fetching barber with ID ${id}:`, error);
    throw error;
  }
};

const barberService = {
  getAllBarbers,
  getBarberById
};

export default barberService;