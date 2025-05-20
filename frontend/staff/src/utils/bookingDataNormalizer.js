/**
 * Normalizes booking data from different sources (API, Socket.IO, etc.)
 * to ensure consistent format and field access
 * 
 * @param {Object} bookingData - Raw booking data from any source
 * @returns {Object} - Normalized booking data with consistent field naming
 */
const normalizeBookingData = (bookingData) => {
  if (!bookingData) return {};
  
  const normalized = { ...bookingData };
  
  // Process user information from different possible structures
  // 1. Direct fields
  let userName = normalized.userName || normalized.name || null;
  let userEmail = normalized.userEmail || normalized.email || null;
  let userPhone = normalized.userPhone || normalized.phone || null;
  
  // 2. Check if user info is in a nested user object (user_id or user field)
  const userObject = normalized.user || 
                    (normalized.user_id && typeof normalized.user_id === 'object' ? normalized.user_id : null);
  
  if (userObject) {
    userName = userName || userObject.name;
    userEmail = userEmail || userObject.email;
    userPhone = userPhone || userObject.phone;
  }
  
  // 3. Set normalized user fields
  normalized.userName = userName || 'N/A';
  normalized.userEmail = userEmail || 'N/A';
  normalized.userPhone = userPhone || 'N/A';
  
  // Process barber information - Cải thiện xử lý thông tin barber
  let barberName = normalized.barberName || null;
  
  // Check if barber info is in a nested barber object
  const barberObject = normalized.barber_id && typeof normalized.barber_id === 'object' ? 
                      normalized.barber_id : null;
                      
  // MongoDB object có thể trả về barber_id là ObjectId hoặc là object đầy đủ
  if (barberObject) {
    // Nếu barber_id là object đầy đủ, lấy name từ đó
    barberName = barberName || barberObject.name;
  } else if (normalized.barber && typeof normalized.barber === 'object') {
    // Hoặc có thể barber được lưu trong trường "barber"
    barberName = barberName || normalized.barber.name;
  } else if (typeof normalized.barber === 'string') {
    // Hoặc đôi khi trường barber có thể là string name trực tiếp
    barberName = barberName || normalized.barber;
  }
  
  // Set normalized barber field
  normalized.barberName = barberName || 'Any Available';
  
  // Ensure serviceName is set
  normalized.serviceName = normalized.serviceName || normalized.service || 'N/A';
  
  return normalized;
};

export default normalizeBookingData;
