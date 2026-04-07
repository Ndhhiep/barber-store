const { checkCloudinaryConfig } = require('../utils/cloudinaryCheck');

/**
 * Xác thực cấu hình Cloudinary và lấy URL ảnh từ file upload.
 * @param {Object} file - req.file từ multer/cloudinary middleware
 * @returns {{ url: string, public_id: string }}
 */
const processUploadedImage = async (file) => {
  const cloudinaryStatus = await checkCloudinaryConfig();
  if (!cloudinaryStatus.success) {
    throw Object.assign(
      new Error('CLOUDINARY_CONFIG_ERROR: Image service is not properly configured'),
      { statusCode: 500, detail: cloudinaryStatus.message }
    );
  }

  if (!file) {
    throw Object.assign(new Error('Vui lòng upload file ảnh'), { statusCode: 400 });
  }

  return {
    url: file.path,        // Cloudinary URL
    public_id: file.filename,
  };
};

module.exports = { processUploadedImage };
