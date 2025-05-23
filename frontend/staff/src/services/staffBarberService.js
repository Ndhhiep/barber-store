import axios from 'axios';
import staffAuthService from './staffAuthService';

const API_URL = process.env.REACT_APP_BACKEND_API_URL; // Sử dụng biến môi trường thay vì hardcode URL

// Lấy tất cả thợ cắt (chỉ những người đang hoạt động)
const getAllBarbers = async () => {
  try {
    const response = await axios.get(`${API_URL}/barbers`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch barbers' };
  }
};

// Lấy tất cả thợ cắt cho nhân viên (bao gồm đang hoạt động và không hoạt động)
const getAllBarbersForStaff = async () => {
  try {
    const headers = staffAuthService.authHeader();
    // Đã loại bỏ việc ghi log header xác thực nhạy cảm
    
    const response = await axios.get(`${API_URL}/barbers/staff`, {
      headers: headers
    });
    // Đã loại bỏ việc ghi toàn bộ response
    return response.data;
  } catch (error) {
    console.error('Error fetching barbers:', error.message);
    throw error.response?.data || { message: 'Failed to fetch barbers' };
  }
};

// Lấy thợ cắt theo ID
const getBarberById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/barbers/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch barber' };
  }
};

// Tải hình ảnh thợ cắt lên Cloudinary
const uploadBarberImage = async (imageFile) => {
  try {
    console.log('Uploading file to Cloudinary:', imageFile.name);
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // Ghi log nội dung form data để gỡ lỗi
    console.log('Form data created with image file');
    
    const response = await axios.post(`${API_URL}/barbers/upload-image`, formData, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Image upload successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error.response?.data || { message: 'Failed to upload image' };
  }
};

// Tạo thợ cắt mới
const createBarber = async (barberData) => {
  try {    
    // Chuẩn bị dữ liệu thợ cắt
    const { title, expertise, imageFile, ...restData } = barberData;
    
    // Nếu có file hình ảnh để tải lên
    let image_url = '';
    if (imageFile) {
      console.log('Creating barber with image file upload');
      const uploadResult = await uploadBarberImage(imageFile);
      
      if (uploadResult && uploadResult.data) {
        image_url = uploadResult.data.url;
        console.log('Image uploaded for new barber:', image_url);
      }
    }
    
    const barberPayload = {
      ...restData,
      image_url: image_url
    };
    
    const response = await axios.post(`${API_URL}/barbers`, barberPayload, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create barber' };
  }
};

// Cập nhật thợ cắt
const updateBarber = async (id, barberData) => {
  try {
    console.log('Updating barber ID:', id);
    
    // Nếu có file hình ảnh để tải lên
    let image_url = barberData.imageUrl || '';
    if (barberData.imageFile) {
      console.log('Updating with new image file, will replace existing image');
      const uploadResult = await uploadBarberImage(barberData.imageFile);
      if (uploadResult && uploadResult.data) {
        image_url = uploadResult.data.url;
        console.log('New image uploaded:', image_url);
      }
    } else {
      console.log('Keeping existing image URL:', image_url);
    }

    // Định dạng dữ liệu phù hợp với yêu cầu backend
    const barberPayload = {
      name: barberData.name,
      // Nếu phone và email không tồn tại trong form, cung cấp giá trị mặc định
      phone: barberData.phone || "Not provided",
      email: barberData.email || "not-provided@example.com",
      description: barberData.description,
      specialization: barberData.specialization,
      // Backend mong muốn lưu dưới dạng imgURL nhưng cần image_url trong request
      image_url: image_url,
      is_active: barberData.is_active,
      workingDays: barberData.workingDays,
      workingHours: barberData.workingHours
      // Đã loại bỏ các trường title và expertise
    };
    
    // Đã loại bỏ việc ghi log payload
    
    const response = await axios.put(`${API_URL}/barbers/${id}`, barberPayload, {
      headers: {
        ...staffAuthService.authHeader(),
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating barber:', error.message);
    throw error.response?.data || { message: 'Failed to update barber' };
  }
};

// Xóa thợ cắt
const deleteBarber = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/barbers/${id}`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete barber' };
  }
};

// Chuyển đổi trạng thái hoạt động của thợ cắt
const toggleBarberStatus = async (id, isActive) => {
  try {
    const response = await axios.patch(
      `${API_URL}/barbers/${id}/toggle-status`,
      { is_active: isActive },
      { headers: staffAuthService.authHeader() }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to toggle barber status' };
  }
};

const staffBarberService = {
  getAllBarbers,
  getAllBarbersForStaff,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
  toggleBarberStatus,
  uploadBarberImage
};

export default staffBarberService;