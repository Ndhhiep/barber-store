import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Adjust to your backend URL

// Store staff user in localStorage with separate keys
const setStaffUser = (data) => {
  localStorage.setItem('staffToken', data.token);
  localStorage.setItem('staffUser', JSON.stringify(data.data.user));
};

// Get staff user from localStorage
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

// Check if staff is authenticated
const isStaffAuthenticated = () => {
  return localStorage.getItem('staffToken') !== null;
};

// Staff Login - now specifically for staff access
const staffLogin = async (email, password) => {
  try {
    // Using the regular login endpoint but processing differently
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    
    // Check if user is staff
    if (response.data.status === 'success' && response.data.token) {
      if (response.data.data?.user?.role === 'staff') {
        // Store staff user data with separate keys
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

// Staff Logout - clears staff-specific data and navigation history
const staffLogout = () => {
  localStorage.removeItem('staffToken');
  localStorage.removeItem('staffUser');
  sessionStorage.removeItem('staffNavHistory');
  sessionStorage.removeItem('staffJustLoggedIn');
  window.location.href = '/login';
};

// Get authentication header for staff
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