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
    // Removed sensitive auth header logging
    
    const response = await axios.get(`${API_URL}/barbers/staff`, {
      headers: headers
    });
    // Removed full response logging
    return response.data;
  } catch (error) {
    console.error('Error fetching barbers:', error.message);
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

// Upload barber image to Cloudinary
const uploadBarberImage = async (imageFile) => {
  try {
    console.log('Uploading file to Cloudinary:', imageFile.name);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Log form data content for debugging
    console.log('Form data created with image file');
    
    const response = await axios.post(`${API_URL}/barbers/upload-image`, formData, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Image upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error.response?.data || { message: 'Failed to upload image' };
  }
};

// Create new barber
const createBarber = async (barberData) => {
  try {    
    // Prepare barber data
    const { title, expertise, imageFile, ...restData } = barberData;
    
    // If there's an image file to upload
    let image_url = '';
    if (imageFile) {
      console.log('Creating barber with image file upload');
      const uploadResult = await uploadBarberImage(imageFile);
      
      if (uploadResult && uploadResult.data) {
        image_url = uploadResult.data.url;
        console.log('Image uploaded for new barber:', image_url);
      }
    }
    
    const barberPayload = {
      ...restData,
      image_url: image_url
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
    console.log('Updating barber ID:', id);
    
    // If there's an image file to upload
    let image_url = barberData.imageUrl || '';
    if (barberData.imageFile) {
      console.log('Updating with new image file, will replace existing image');
      const uploadResult = await uploadBarberImage(barberData.imageFile);
      if (uploadResult && uploadResult.data) {
        image_url = uploadResult.data.url;
        console.log('New image uploaded:', image_url);
      }
    } else {
      console.log('Keeping existing image URL:', image_url);
    }

    // Properly format data to match backend expectations
    const barberPayload = {
      name: barberData.name,
      // If phone and email don't exist in form, provide default values
      phone: barberData.phone || "Not provided",
      email: barberData.email || "not-provided@example.com",
      description: barberData.description,
      specialization: barberData.specialization,
      // Backend expects to save as imgURL but needs image_url in the request
      image_url: image_url,
      is_active: barberData.is_active,
      workingDays: barberData.workingDays,
      workingHours: barberData.workingHours
      // Title and expertise fields have been removed
    };
    
    // Removed payload logging
    
    const response = await axios.put(`${API_URL}/barbers/${id}`, barberPayload, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating barber:', error.message);
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
  toggleBarberStatus,
  uploadBarberImage
};

export default staffBarberService;