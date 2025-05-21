/**
 * Tiện ích kiểm tra kết nối server và hiển thị phản hồi
 */

const API_URL = 'http://localhost:5000'; // URL gốc của API

/**
 * Kiểm tra xem server có thể truy cập được không
 * @returns {Promise<boolean>} - True nếu server có thể truy cập được
 */
export const isServerOnline = async () => {
  try {
    // Sử dụng fetch với timeout để kiểm tra kết nối server
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // timeout 5 giây
    
    const response = await fetch(`${API_URL}/api`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    // Lỗi mạng hoặc không thể kết nối server
    console.warn('Server connectivity check failed:', error);
    return false;
  }
};

/**
 * Hiển thị thông báo lỗi kết nối server
 * @param {Function} setError - Hàm để cập nhật trạng thái lỗi
 * @param {string} customMessage - Thông điệp lỗi tuỳ chọn
 */
export const showServerError = (setError, customMessage = null) => {
  const defaultMessage = 'Could not connect to the server. Please check your internet connection and try again.';
  setError(customMessage || defaultMessage);
};

/**
 * Xử lý lỗi API dựa trên mã phản hồi
 * @param {Error} error - Đối tượng lỗi từ cuộc gọi API
 * @returns {string} - Thông điệp lỗi thân thiện với người dùng
 */
export const handleApiError = (error) => {
  if (!error.response) {
    // Lỗi mạng hoặc không thể kết nối server
    return 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet.';
  }
  
  const { status } = error.response;
  
  switch (status) {
    case 401:
      return 'Your session has expired. Please login again.';
    case 403:
      return 'You do not have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    default:
      return error.response.data?.message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Kiểm tra kết nối server với phương án dự phòng cập nhật giao diện
 * @param {Function} onlineCallback - Hàm gọi khi server online
 * @param {Function} offlineCallback - Hàm gọi khi server offline
 */
export const checkServerWithFallback = async (onlineCallback, offlineCallback) => {
  const isOnline = await isServerOnline();
  
  if (isOnline) {
    onlineCallback();
  } else {
    offlineCallback();
  }
};

/**
 * Chờ độ trễ xác định
 * @param {number} ms - Số mili-giây chờ
 * @returns {Promise} - Promise sẽ resolve sau khi chờ
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Trợ giúp thử gọi API lại với cơ chế lùi thời gian lũy thừa
 * @param {Function} apiCall - Hàm thực hiện cuộc gọi API
 * @param {number} maxRetries - Số lần thử tối đa
 * @param {number} initialDelay - Độ trễ ban đầu (ms)
 * @returns {Promise<any>} - Kết quả của cuộc gọi API
 */
export const retryWithBackoff = async (apiCall, maxRetries = 3, initialDelay = 1000) => {
  let retries = 0;
  let delay = initialDelay;
  
  while (retries < maxRetries) {
    try {
      return await apiCall();
    } catch (error) {
      retries++;
      
      // Nếu đạt số lần thử tối đa hoặc không phải lỗi kết nối, ném lỗi
      if (retries >= maxRetries || (error.response && error.response.status !== 0)) {
        throw error;
      }
      
      // Chờ với cơ chế lùi thời gian lũy thừa bằng hàm trợ giúp
      await wait(delay);
      delay *= 2; // Exponential backoff
    }
  }
};

// Tạo object trước khi xuất mặc định
const serverCheckUtils = {
  isServerOnline,
  showServerError,
  handleApiError,
  checkServerWithFallback,
  retryWithBackoff
};

export default serverCheckUtils;