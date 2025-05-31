import api from './api';

/**
 * Gửi thông tin liên hệ từ form contact
 * @param {Object} contactData - Thông tin liên hệ (name, email, phone, message)
 * @returns {Promise<Object>} - Kết quả từ API
 */
export const submitContactForm = async (contactData) => {
  try {
    const response = await api.post('/contacts', contactData);
    // Handle different response structures
    if (response.data) {
      return response.data;
    }
    return response;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return { success: false, message: 'Failed to submit contact form' };
  }
};

/**
 * Service đối tượng chứa tất cả các hàm liên quan đến contact
 */
const contactService = {
  submitContactForm
};

export default contactService;
