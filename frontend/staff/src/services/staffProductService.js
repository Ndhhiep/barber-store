import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả sản phẩm với tùy chọn lọc
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

// Lấy sản phẩm theo ID
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

// Tạo sản phẩm mới
const createProduct = async (productData) => {
  try {
    // Xử lý tải lên tệp nếu có hình ảnh
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

// Cập nhật sản phẩm
const updateProduct = async (id, productData) => {
  try {
    // Xử lý tải lên tệp nếu có hình ảnh
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

// Xóa sản phẩm
const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/products/${id}`, {
      headers: staffAuthService.authHeader()
    });
    // Phản hồi sẽ bao gồm thông tin về cả sản phẩm và việc xóa hình ảnh
    return response.data;
  } catch (error) {
    console.error('Error in deleteProduct service:', error);
    throw error.response?.data || { message: 'Failed to delete product or its associated image' };
  }
};

// Lấy tất cả danh mục
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

// Lấy thống kê sản phẩm cho dashboard
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