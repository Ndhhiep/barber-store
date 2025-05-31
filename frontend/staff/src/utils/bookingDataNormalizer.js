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
  // Xử lý thông tin dịch vụ - hỗ trợ cả dịch vụ đơn lẻ và nhiều dịch vụ
  if (normalized.services && Array.isArray(normalized.services) && normalized.services.length > 0) {
    // Nếu có mảng services, xử lý để hiển thị tên dịch vụ
    const serviceNames = normalized.services.map(service => {
      if (typeof service === 'object' && service !== null) {
        return service.name || 'Unknown Service';
      }
      return service;
    });
    normalized.serviceName = serviceNames.join(', '); // Tạo serviceName từ mảng để tương thích ngược
    normalized.serviceNames = serviceNames; // Thêm mảng tên dịch vụ
  } else if (normalized.serviceNames && Array.isArray(normalized.serviceNames)) {
    // Nếu đã có mảng serviceNames từ backend
    normalized.serviceName = normalized.serviceNames.join(', ');
    
    // Tạo objects services nếu chỉ có các tên
    if (!normalized.services || !normalized.services.length) {
      normalized.services = normalized.serviceNames.map(name => ({
        name,
        price: 0,
        duration: 30,
        description: 'Service'
      }));
    }
  } else if (normalized.service) {
    // Nếu chỉ có dịch vụ đơn lẻ
    if (typeof normalized.service === 'object' && normalized.service !== null) {
      normalized.serviceName = normalized.service.name || 'Unknown Service';
      normalized.serviceNames = [normalized.serviceName];
      normalized.services = [normalized.service];
    } else {
      normalized.serviceName = normalized.service;
      normalized.serviceNames = [normalized.service];
      normalized.services = [{
        name: normalized.service,
        price: 0,
        duration: 30,
        description: 'Legacy Service'
      }];
    }
  } else {
    // Không có thông tin dịch vụ
    normalized.serviceName = normalized.serviceName || 'N/A';
    normalized.serviceNames = [];
    normalized.services = [];
  }
  
  return normalized;
};

export default normalizeBookingData;
