import api from './api';

// Get all services
const getAllServices = async () => {
  try {
    const response = await api.get(`/services`);
    // Fix the data access to match the controller's response structure
    return response.data.data && response.data.data.services 
      ? { data: response.data.data.services } 
      : { data: response.data.data || [] };
  } catch (error) {
    console.error("Error fetching services:", error);
    return { data: [] }; // Return empty data instead of throwing
  }
};

// Get service by ID
const getServiceById = async (id) => {
  try {
    const response = await api.get(`/services/${id}`);
    // Fix the data access to match the controller's response structure
    return response.data.data && response.data.data.service
      ? response.data.data.service
      : response.data.data;
  } catch (error) {
    console.error(`Error fetching service with ID ${id}:`, error);
    return null; // Return null instead of throwing
  }
};

const serviceService = {
  getAllServices,
  getServiceById
};

export default serviceService;