/**
 * Chuẩn hóa dữ liệu đặt lịch từ các nguồn khác nhau (API, Socket.IO, v.v.)
 * để đảm bảo định dạng và truy cập trường nhất quán
 * 
 * @param {Object} bookingData - Dữ liệu đặt lịch thô từ bất kỳ nguồn nào
 * @returns {Object} - Dữ liệu đặt lịch đã được chuẩn hóa với tên trường nhất quán
 */
const normalizeBookingData = (bookingData) => {
  if (!bookingData) return {};
  
  const normalized = { ...bookingData };
  
  // Xử lý thông tin người dùng từ các cấu trúc có thể khác nhau
  // 1. Trường trực tiếp
  let userName = normalized.userName || normalized.name || null;
  let userEmail = normalized.userEmail || normalized.email || null;
  let userPhone = normalized.userPhone || normalized.phone || null;
  
  // 2. Kiểm tra nếu thông tin người dùng nằm trong object lồng nhau (trường user_id hoặc user)
  const userObject = normalized.user || 
                    (normalized.user_id && typeof normalized.user_id === 'object' ? normalized.user_id : null);
  
  if (userObject) {
    userName = userName || userObject.name;
    userEmail = userEmail || userObject.email;
    userPhone = userPhone || userObject.phone;
  }
  
  // 3. Gán các trường người dùng đã chuẩn hóa
  normalized.userName = userName || 'N/A';
  normalized.userEmail = userEmail || 'N/A';
  normalized.userPhone = userPhone || 'N/A';
  
  // Xử lý thông tin thợ cắt - cải thiện cách xử lý thông tin thợ
  let barberName = normalized.barberName || null;
  
  // Kiểm tra nếu thông tin thợ cắt nằm trong object lồng nhau
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
  
  // Gán trường barber đã chuẩn hóa
  normalized.barberName = barberName || 'Any Available';
  
  // Đảm bảo trường serviceName được gán
  normalized.serviceName = normalized.serviceName || normalized.service || 'N/A';
  
  return normalized;
};

export default normalizeBookingData;
