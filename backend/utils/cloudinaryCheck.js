/**
 * Utility to check if Cloudinary is properly configured
 */
const cloudinary = require('../config/cloudinary');

/**
 * Checks if Cloudinary is properly configured with valid credentials
 * @returns {Promise<{ success: boolean, message: string }>} 
 */
const checkCloudinaryConfig = async () => {
  try {
    // Basic check if required environment variables are set
    const { cloud_name, api_key, api_secret } = cloudinary.config();
    
    if (!cloud_name || !api_key || !api_secret) {
      return {
        success: false,
        message: 'Cloudinary configuration is incomplete. Please check environment variables.'
      };
    }
    
    // Make a simple API call to verify credentials
    const result = await cloudinary.api.ping();
    
    if (result && result.status === 'ok') {
      return {
        success: true,
        message: 'Cloudinary configuration is valid'
      };
    } else {
      return {
        success: false,
        message: 'Could not verify Cloudinary credentials'
      };
    }
  } catch (error) {
    console.error('Cloudinary configuration check failed:', error);
    return {
      success: false,
      message: `Invalid Cloudinary configuration: ${error.message || 'Unknown error'}`
    };
  }
};

module.exports = { checkCloudinaryConfig };
