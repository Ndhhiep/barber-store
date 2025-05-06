import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all services
const getAllServices = async () => {
  try {
    const response = await axios.get(`${API_URL}/services`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch services' };
  }
};

// Get service by ID
const getServiceById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/services/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch service' };
  }
};

// Create new service
const createService = async (serviceData) => {
  try {
    const response = await axios.post(
      `${API_URL}/services`,
      serviceData,
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create service' };
  }
};

// Update existing service
const updateService = async (id, serviceData) => {
  try {
    const response = await axios.put(
      `${API_URL}/services/${id}`,
      serviceData,
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update service' };
  }
};

// Delete a service
const deleteService = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/services/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete service' };
  }
};

const staffServiceService = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};

export default staffServiceService;