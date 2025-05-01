import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Get all products with optional filtering
const getAllProducts = async (category = '', page = 1, limit = 10) => {
  try {
    const query = new URLSearchParams();
    if (category && category !== 'All Categories') query.append('category', category);
    query.append('page', page);
    query.append('limit', limit);
    
    const response = await axios.get(`${API_URL}/products?${query.toString()}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch products' };
  }
};

// Get product by ID
const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch product' };
  }
};

// Create new product
const createProduct = async (productData) => {
  try {
    // Handle file upload if there's an image
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData.image instanceof File) {
        formData.append('image', productData.image);
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    const response = await axios.post(`${API_URL}/products`, formData, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create product' };
  }
};

// Update product
const updateProduct = async (id, productData) => {
  try {
    // Handle file upload if there's an image
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (key === 'image' && productData.image instanceof File) {
        formData.append('image', productData.image);
      } else {
        formData.append(key, productData[key]);
      }
    });
    
    const response = await axios.put(`${API_URL}/products/${id}`, formData, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update product' };
  }
};

// Delete product
const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/products/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete product' };
  }
};

// Get all categories
const getAllCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/categories`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch categories' };
  }
};

// Get product statistics for dashboard
const getProductStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/stats`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch product statistics' };
  }
};

const staffProductService = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllCategories,
  getProductStats
};

export default staffProductService;