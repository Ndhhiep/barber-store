import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all barbers (only active ones)
const getAllBarbers = async () => {
  try {
    const response = await axios.get(`${API_URL}/barbers`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch barbers' };
  }
};

// Get all barbers for staff (both active and inactive)
const getAllBarbersForStaff = async () => {
  try {
    const headers = staffAuthService.authHeader();
    console.log('Auth headers:', headers);
    console.log('Calling API endpoint:', `${API_URL}/barbers/staff`);
    
    const response = await axios.get(`${API_URL}/barbers/staff`, {
      headers: headers
    });
    console.log('Response received:', response);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response || error);
    throw error.response?.data || { message: 'Failed to fetch barbers' };
  }
};

// Get barber by ID
const getBarberById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/barbers/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch barber' };
  }
};

// Create new barber
const createBarber = async (barberData) => {
  try {
    // Chuyển đổi từ FormData sang JSON
    const barberPayload = {
      ...barberData,
      // Đảm bảo imageUrl được giữ nguyên
      image_url: barberData.imageUrl
    };
    
    const response = await axios.post(`${API_URL}/barbers`, barberPayload, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create barber' };
  }
};

// Update barber
const updateBarber = async (id, barberData) => {
  try {
    // Properly format data to match backend expectations
    const barberPayload = {
      name: barberData.name,
      // If phone and email don't exist in form, provide default values
      phone: barberData.phone || "Not provided",
      email: barberData.email || "not-provided@example.com",
      description: barberData.description,
      specialization: barberData.specialization,
      // Backend expects to save as imgURL but needs image_url in the request
      image_url: barberData.imageUrl,
      is_active: barberData.is_active,
      workingDays: barberData.workingDays,
      workingHours: barberData.workingHours,
      // Include any additional fields from frontend
      expertise: barberData.expertise,
      // Include title from frontend
      title: barberData.title
    };
    
    console.log('Updating barber with payload:', barberPayload);
    
    const response = await axios.put(`${API_URL}/barbers/${id}`, barberPayload, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error saving barber:', error.response || error);
    throw error.response?.data || { message: 'Failed to update barber' };
  }
};

// Delete barber
const deleteBarber = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/barbers/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete barber' };
  }
};

// Toggle barber active status
const toggleBarberStatus = async (id, isActive) => {
  try {
    const response = await axios.patch(
      `${API_URL}/barbers/${id}/toggle-status`,
      { is_active: isActive },
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to toggle barber status' };
  }
};

const staffBarberService = {
  getAllBarbers,
  getAllBarbersForStaff,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
  toggleBarberStatus
};

export default staffBarberService;