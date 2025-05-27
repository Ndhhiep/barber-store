/**
 * Utility functions for validating and optimizing image uploads
 */

/**
 * Validates an image file for upload
 * @param {File} file - The image file object to validate
 * @returns {{ valid: boolean, message: string }} Validation result
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, message: 'No file selected' };
  }

  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: 'Invalid file type. Only JPEG, PNG, and WEBP images are accepted' 
    };
  }

  // Check file size (max 2MB)
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `File is too large. Maximum size is 2MB. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB`
    };
  }

  return { valid: true, message: 'File is valid' };
};

/**
 * Creates a data URL preview from an image file
 * @param {File} file - The image file to create preview from
 * @returns {Promise<string>} Data URL for image preview
 */
export const createImagePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No file provided');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject('Error reading file');
    reader.readAsDataURL(file);
  });
};

/**
 * Diagnoses common image upload issues
 * @param {Error} error - The error from the upload attempt
 * @returns {string} Diagnostic message
 */
export const diagnoseImageUploadIssue = (error) => {
  if (!error) return 'Unknown error occurred';

  // Network or connectivity issues
  if (!error.response) {
    return 'Network error: Could not connect to the server. Please check your internet connection.';
  }

  // Server-side errors
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 400:
        return 'The image file may be corrupted or in an unsupported format.';
      case 401:
        return 'Authentication error. Please log in again.';
      case 403:
        return 'You don\'t have permission to upload images.';
      case 413:
        return 'The image file is too large. Maximum size is 2MB.';
      case 500:
        return 'Server error: The image service might be temporarily unavailable. Please try again later.';
      default:
        return `Server responded with error code ${status}. Please try again later.`;
    }
  }

  // Generic error with message
  if (error.message) {
    if (error.message.includes('network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'The request timed out. Please try with a smaller image or check your connection.';
    }
    return error.message;
  }

  return 'An unknown error occurred while uploading the image.';
};

export default {
  validateImageFile,
  createImagePreview,
  diagnoseImageUploadIssue
};
