/**
 * Service quản lý các API liên quan đến authentication
 */
import api from './api';

/**
 * Đăng nhập người dùng
 * @param {string} email - Email người dùng
 * @param {string} password - Mật khẩu
 * @returns {Promise<Object>} - Thông tin người dùng và token
 */
export const login = async (email, password) => {
  try {
    const result = await api.post('/auth/login', { email, password });
    
    if (result.status === 'success' && result.token) {
      // Kiểm tra vai trò người dùng
      if (result.data && result.data.user) {
        // Chỉ xử lý đăng nhập cho tài khoản user thông thường
        // Staff sẽ được xử lý qua staffAuthService.staffLogin
        if (result.data.user.role === 'user') {
          // Lưu thông tin user trong localStorage
          // Không xóa thông tin staff nữa để có thể đăng nhập đồng thời
          localStorage.setItem('token', result.token);
          localStorage.setItem('user', JSON.stringify(result.data.user));
        } else if (result.data.user.role === 'staff') {
          // Nếu đây là tài khoản staff nhưng đang cố đăng nhập qua trang user
          // thì chuyển hướng đến trang đăng nhập staff
          window.location.href = '/staff/login';
          return result;
        }
      }
      
      // Chuyển hướng nếu có đường dẫn được cung cấp
      if (result.redirectPath) {
        window.location.href = result.redirectPath;
      } else {
        // Mặc định chuyển hướng đến trang chủ
        window.location.href = '/';
      }
    }
    
    return result;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Đăng ký người dùng mới
 * @param {Object} userData - Thông tin người dùng (name, email, password, ...)
 * @returns {Promise<Object>} - Thông tin người dùng đã đăng ký
 */
export const register = async (userData) => {
  try {
    const result = await api.post('/auth/register', userData);
    
    if (result.success && result.token) {
      localStorage.setItem('token', result.token);
      
      // Lưu thông tin user vào localStorage nếu có
      if (result.data && result.data.user) {
        localStorage.setItem('user', JSON.stringify(result.data.user));
      }
    }
    
    return result;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 * @returns {Promise<Object>} - Thông tin người dùng
 */
export const getUserProfile = async () => {
  try {
    const result = await api.get('/auth/me');
    
    // Cập nhật thông tin user trong localStorage
    if (result.success && result.data && result.data.user) {
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    
    return result;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Cập nhật thông tin người dùng
 * @param {Object} userData - Thông tin cần cập nhật
 * @returns {Promise<Object>} - Thông tin người dùng đã cập nhật
 */
export const updateUserProfile = async (userData) => {
  try {
    const result = await api.put('/auth/update-profile', userData);
    
    // Cập nhật thông tin user trong localStorage nếu thành công
    if (result.success && result.data && result.data.user) {
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
    
    return result;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

/**
 * Đăng xuất người dùng thông thường
 * @returns {void}
 */
export const logout = () => {
  // Chỉ xóa thông tin người dùng thông thường, giữ lại thông tin của staff
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Xóa các item trong sessionStorage nếu có
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  
  // Chuyển hướng đến trang chủ
  window.location.href = '/';
};

/**
 * Kiểm tra người dùng đã đăng nhập hay chưa
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

/**
 * Kiểm tra người dùng có quyền truy cập dựa trên vai trò
 * @param {string} requiredRole - Vai trò cần thiết để truy cập ('user' hoặc 'staff')
 * @returns {boolean}
 */
export const hasRoleAccess = (requiredRole) => {
  try {
    if (requiredRole === 'staff') {
      // Check for staff access using staffToken instead of staffUser
      const staffToken = localStorage.getItem('staffToken');
      const staffUserStr = localStorage.getItem('staffUser');
      
      if (!staffToken || !staffUserStr) return false;
      
      // Validate the staffUser data structure
      try {
        const staffUser = JSON.parse(staffUserStr);
        return staffUser && staffUser.role === 'staff';
      } catch (e) {
        return false;
      }
      
    } else if (requiredRole === 'user') {
      // Check for regular user access - both token and valid user data must exist
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) return false;
      
      try {
        // Validate the user data structure and role
        const userData = JSON.parse(userStr);
        return userData && userData.role === 'user';
      } catch (e) {
        // If we can't parse the user data, user is not properly authenticated
        return false;
      }
    }
  } catch (e) {
    console.error('Error checking role access:', e);
    return false;
  }
  
  return false;
};

/**
 * Service object containing all authentication functions
 */
const authService = {
  login,
  register,
  getUserProfile,
  updateUserProfile,
  logout,
  isAuthenticated,
  hasRoleAccess,
};

export default authService;