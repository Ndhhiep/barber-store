import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = `${process.env.REACT_APP_BACKEND_API_URL}/contacts`; // Sử dụng biến môi trường thay vì hardcode URL

const getAllContacts = async () => {
  // Lấy user staff chứa token
  const staffUser = staffAuthService.getStaffUser();
  const token = staffUser ? staffUser.token : null;
  
  console.log('Staff user:', staffUser);
  console.log('Token available:', !!token);
  
  // Thiết lập header với token xác thực
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  
  try {
    const response = await axios.get(API_URL, config);
    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const getContactById = async (id) => {
  // Lấy user staff chứa token
  const staffUser = staffAuthService.getStaffUser();
  const token = staffUser ? staffUser.token : null;
  
  // Thiết lập header với token xác thực
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  
  const response = await axios.get(`${API_URL}/${id}`, config);
  return response.data;
};

const updateContactStatus = async (id, status) => {
  // Lấy user staff chứa token
  const staffUser = staffAuthService.getStaffUser();
  const token = staffUser ? staffUser.token : null;
  
  // Thiết lập header với token xác thực
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  
  const response = await axios.patch(`${API_URL}/${id}`, { status }, config);
  return response.data;
};

const deleteContact = async (id) => {
  // Lấy user staff chứa token
  const staffUser = staffAuthService.getStaffUser();
  const token = staffUser ? staffUser.token : null;
  
  // Thiết lập header với token xác thực
  const config = {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
  
  const response = await axios.delete(`${API_URL}/${id}`, config);
  return response.data;
};

const staffContactService = {
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact
};

export default staffContactService;
