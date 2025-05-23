import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả dịch vụ
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

// Lấy dịch vụ theo ID
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

// Tạo dịch vụ mới
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

// Cập nhật dịch vụ
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

// Xóa dịch vụ
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