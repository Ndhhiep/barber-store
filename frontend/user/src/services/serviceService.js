import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:5000/api'; // Use variable from .env file

// Get all services
const getAllServices = async () => {
  try {
    const response = await axios.get(`${API_URL}/services`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch services' };
  }
};

// Get service by ID
const getServiceById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/services/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch service' };
  }
};

const serviceService = {
  getAllServices,
  getServiceById
};

export default serviceService;