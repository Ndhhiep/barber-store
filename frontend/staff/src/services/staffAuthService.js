import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lưu token và thông tin user staff vào localStorage
const setStaffUser = (data) => {
  localStorage.setItem('staffToken', data.token);
  localStorage.setItem('staffUser', JSON.stringify(data.data.user));
};

// Lấy thông tin user staff từ localStorage
const getStaffUser = () => {
  const staffToken = localStorage.getItem('staffToken');
  const staffUserStr = localStorage.getItem('staffUser');
  
  if (!staffToken || !staffUserStr) return null;
  
  try {
    const staffUser = JSON.parse(staffUserStr);
    return { token: staffToken, user: staffUser };
  } catch (e) {
    return null;
  }
};

// Kiểm tra xem staff đã xác thực chưa
const isStaffAuthenticated = () => {
  return localStorage.getItem('staffToken') !== null;
};

// Đăng nhập cho staff - chỉ dành cho staff
const staffLogin = async (email, password) => {
  try {
    // Sử dụng endpoint login chung nhưng xử lý đặc biệt cho staff
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    // Kiểm tra user có vai trò staff không
    if (response.data.status === 'success' && response.data.token) {
      if (response.data.data?.user?.role === 'staff') {
        // Lưu dữ liệu staff với các key riêng
        setStaffUser(response.data);
        return response.data;
      } else {
        throw new Error('This login is for staff only');
      }
    } else {
      throw new Error('Authentication failed');
    }
  } catch (error) {
    console.error('Staff login error:', error);
    throw error.response?.data || { message: 'Login failed' };
  }
};

// Đăng xuất staff - xóa dữ liệu và lịch sử điều hướng của staff
const staffLogout = () => {
  localStorage.removeItem('staffToken');
  localStorage.removeItem('staffUser');
  sessionStorage.removeItem('staffNavHistory');
  sessionStorage.removeItem('staffJustLoggedIn');
  window.location.href = '/login';
};

// Lấy header xác thực cho staff
const authHeader = () => {
  const staffToken = localStorage.getItem('staffToken');
  
  if (staffToken) {
    return { Authorization: `Bearer ${staffToken}` };
  } else {
    return {};
  }
};

const staffAuthService = {
  staffLogin,
  staffLogout,
  getStaffUser,
  setStaffUser,
  authHeader,
  isStaffAuthenticated
};

export default staffAuthService;