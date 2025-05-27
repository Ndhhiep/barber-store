/**
 * Service quản lý các API liên quan đến sản phẩm
 */
import axios from 'axios';
import { API_URL, getRequestConfig } from '../utils/apiConfig';

// Helper function to get auth headers - maintained for backward compatibility
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Lấy danh sách sản phẩm với các bộ lọc tùy chọn
 * @param {Object} filters - Các tham số lọc (category, search, sort, page, limit)
 * @returns {Promise<Object>} - Danh sách sản phẩm và metadata
 */
export const getProducts = async (filters = {}) => {
  try {
    // Xây dựng query string từ filters
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    const queryString = queryParams.toString();
    const endpoint = queryString ? `${API_URL}/products?${queryString}` : `${API_URL}/products`;
    
    // Use the shared API config
    const response = await axios.get(endpoint, getRequestConfig());
    return response;
  } catch (error) {
    console.error('Get products error:', error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết sản phẩm theo ID
 * @param {string} id - ID của sản phẩm
 * @returns {Promise<Object>} - Chi tiết sản phẩm
 */
export const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`, getRequestConfig());
    return response;
  } catch (error) {
    console.error(`Get product ${id} error:`, error);
    throw error;
  }
};

/**
 * Lấy sản phẩm theo danh mục
 * @param {string} category - Tên danh mục
 * @returns {Promise<Object>} - Danh sách sản phẩm trong danh mục
 */
export const getProductsByCategory = async (category) => {
  try {
    return await getProducts({ category });
  } catch (error) {
    console.error(`Get products by category ${category} error:`, error);
    throw error;
  }
};

/**
 * Tìm kiếm sản phẩm theo từ khóa
 * @param {string} keyword - Từ khóa tìm kiếm
 * @returns {Promise<Object>} - Danh sách sản phẩm phù hợp
 */
export const searchProducts = async (keyword) => {
  try {
    return await getProducts({ search: keyword });
  } catch (error) {
    console.error(`Search products error:`, error);
    throw error;
  }
};

/**
 * Lấy sản phẩm showcase theo danh mục
 * @returns {Promise<Array>} - Danh sách sản phẩm showcase theo danh mục
 */
export const getProductsByCategoryShowcase = async () => {
  try {
    const response = await axios.get(`${API_URL}/products/showcase-by-category`, getRequestConfig());
    return response.data;
  } catch (error) {
    console.error('Get products showcase by category error:', error);
    throw error;
  }
};

const productService = {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts,
  getProductsByCategoryShowcase
};

export default productService;