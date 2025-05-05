/**
 * Service quản lý các API liên quan đến sản phẩm
 */
import api from './api';

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
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return await api.get(endpoint);
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
    return await api.get(`/products/${id}`);
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

export default {
  getProducts,
  getProductById,
  getProductsByCategory,
  searchProducts
};