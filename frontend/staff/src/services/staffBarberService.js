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
    
    console.log('Fetching barbers from API...');
    const response = await axios.get(`${API_URL}/barbers/staff`, {
      headers: headers
    });
    
    console.log('Original API response structure:', 
      response.data && typeof response.data === 'object' 
        ? Object.keys(response.data) 
        : typeof response.data
    );
    
    // Check and log the original data structure
    if (response.data && response.data.data && Array.isArray(response.data.data.barbers)) {
      console.log('Barbers data is in response.data.data.barbers');
      console.log('First barber sample:', response.data.data.barbers[0]);
    } else if (response.data && Array.isArray(response.data.barbers)) {
      console.log('Barbers data is in response.data.barbers');
      console.log('First barber sample:', response.data.barbers[0]);
    } else if (response.data && Array.isArray(response.data)) {
      console.log('Barbers data is directly in response.data array');
      if (response.data.length > 0) {
        console.log('First barber sample:', response.data[0]);
      }
    }
    
    // Normalize image URL fields for consistency
    if (response.data && response.data.data && Array.isArray(response.data.data.barbers)) {
      response.data.data.barbers = response.data.data.barbers.map(barber => {
        // Create a new object with existing fields
        const normalizedBarber = { ...barber };
        
        // Ensure both imgURL and image_url fields exist
        if (normalizedBarber.imgURL && !normalizedBarber.image_url) {
          normalizedBarber.image_url = normalizedBarber.imgURL;
        } else if (normalizedBarber.image_url && !normalizedBarber.imgURL) {
          normalizedBarber.imgURL = normalizedBarber.image_url;
        }
        
        return normalizedBarber;
      });
      
      console.log('Normalized first barber:', response.data.data.barbers[0]);
    } else if (response.data && Array.isArray(response.data.barbers)) {
      response.data.barbers = response.data.barbers.map(barber => {
        const normalizedBarber = { ...barber };
        
        if (normalizedBarber.imgURL && !normalizedBarber.image_url) {
          normalizedBarber.image_url = normalizedBarber.imgURL;
        } else if (normalizedBarber.image_url && !normalizedBarber.imgURL) {
          normalizedBarber.imgURL = normalizedBarber.image_url;
        }
        
        return normalizedBarber;
      });
      
      if (response.data.barbers.length > 0) {
        console.log('Normalized first barber:', response.data.barbers[0]);
      }
    } else if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(barber => {
        const normalizedBarber = { ...barber };
        
        if (normalizedBarber.imgURL && !normalizedBarber.image_url) {
          normalizedBarber.image_url = normalizedBarber.imgURL;
        } else if (normalizedBarber.image_url && !normalizedBarber.imgURL) {
          normalizedBarber.imgURL = normalizedBarber.image_url;
        }
        
        return normalizedBarber;
      });
      
      if (response.data.length > 0) {
        console.log('Normalized first barber:', response.data[0]);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching barbers:', error);
    if (error.response) {
      console.error('Server response error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Request setup error:', error.message);
    }
    throw error.response?.data || { message: 'Failed to fetch barbers' };
  }
};

// Lấy thợ cắt theo ID
const getBarberById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/barbers/${id}`, {
      headers: staffAuthService.authHeader()
    });
    
    // Normalize image URL fields
    if (response.data && response.data.data) {
      const barber = response.data.data;
      
      // Ensure both imgURL and image_url fields exist
      if (barber.imgURL && !barber.image_url) {
        barber.image_url = barber.imgURL;
      } else if (barber.image_url && !barber.imgURL) {
        barber.imgURL = barber.image_url;
      }
    }
    
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
    return response.data;  } catch (error) {
    console.error('Error uploading image:', error);
    
    // Improved error handling
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from server:', {
        status: error.response.status,
        data: error.response.data
      });
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      throw { message: 'No response from server. Check your network connection.' };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error in request setup:', error.message);
      throw { message: `Request setup error: ${error.message}` };
    }
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
      try {
        const uploadResult = await uploadBarberImage(imageFile);
        
        if (uploadResult && uploadResult.data) {
          image_url = uploadResult.data.url;
          console.log('Image uploaded for new barber:', image_url);
        }
      } catch (uploadError) {
        console.error('Failed to upload barber image:', uploadError);
        throw uploadError; // Propagate the error to the next catch block
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
    
    console.log('API response from barber creation:', response.data);
    
    // Normalize the response data structure
    let normalizedData = response.data;
    
    // Extract actual barber data from response
    if (response.data && response.data.data) {
      normalizedData = response.data.data;
    }
    
    // Make sure both imgURL and image_url fields exist for frontend compatibility
    if (normalizedData) {
      if (normalizedData.imgURL && !normalizedData.image_url) {
        normalizedData.image_url = normalizedData.imgURL;
      } else if (normalizedData.image_url && !normalizedData.imgURL) {
        normalizedData.imgURL = normalizedData.image_url;
      }
      
      console.log('Normalized barber data:', normalizedData);
    }
    
    // Preserve the original response structure but with normalized data
    if (response.data && response.data.data) {
      response.data.data = normalizedData;
    } else {
      response.data = normalizedData;
    }
    
    return response.data;} catch (error) {
    console.error('Error creating barber:', error);
    
    // Better error handling with more details
    if (error.response) {
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.message) {
      throw { message: error.message };
    } else {
      throw { message: 'Failed to create barber' };
    }
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
      try {
        const uploadResult = await uploadBarberImage(barberData.imageFile);
        if (uploadResult && uploadResult.data) {
          image_url = uploadResult.data.url;
          console.log('New image uploaded:', image_url);
        }
      } catch (uploadError) {
        console.error('Failed to upload barber image during update:', uploadError);
        throw uploadError; // Propagate the error to the next catch block
      }
    }else {
      console.log('Keeping existing image URL:', image_url);
    }    // Định dạng dữ liệu phù hợp với yêu cầu backend
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
    
    console.log('API response from barber update:', response.data);
    
    // Normalize the response data structure
    let normalizedData = response.data;
    
    // Extract actual barber data from response
    if (response.data && response.data.data) {
      normalizedData = response.data.data;
    }
    
    // Make sure both imgURL and image_url fields exist for frontend compatibility
    if (normalizedData) {
      if (normalizedData.imgURL && !normalizedData.image_url) {
        normalizedData.image_url = normalizedData.imgURL;
      } else if (normalizedData.image_url && !normalizedData.imgURL) {
        normalizedData.imgURL = normalizedData.image_url;
      }
      
      console.log('Normalized barber data after update:', normalizedData);
    }
    
    // Preserve the original response structure but with normalized data
    if (response.data && response.data.data) {
      response.data.data = normalizedData;
    } else {
      response.data = normalizedData;
    }
    
    return response.data;} catch (error) {
    console.error('Error updating barber:', error);
    
    // Better error handling with more details
    if (error.response) {
      throw error.response.data || { message: `Server error: ${error.response.status}` };
    } else if (error.message) {
      throw { message: error.message };
    } else {
      throw { message: 'Failed to update barber' };
    }
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

// Kiểm tra trạng thái kết nối Cloudinary
const checkCloudinaryStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/barbers/check-cloudinary`, {
      headers: staffAuthService.authHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error checking Cloudinary status:', error);
    throw error.response?.data || { message: 'Failed to check Cloudinary status' };
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
  uploadBarberImage,
  checkCloudinaryStatus
};

export default staffBarberService;