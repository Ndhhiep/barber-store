const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Kiểm tra loại file
const fileFilter = (req, file, cb) => {
  // Chỉ cho phép upload ảnh
  const filetypes = /jpeg|jpg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép tải lên các file hình ảnh!'));
  }
};

// Cấu hình lưu trữ Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req, file) => {
      // Check URL path to determine folder
      const url = req.originalUrl;
      
      if (url.includes('/barbers/upload-image')) {
        return 'barber-store/barbers';
      }
      
      // Lấy category từ body request (for products)
      const { category } = req.body;
      // Nếu có category, lưu vào folder tương ứng
      if (category) {
        return `barber-store/products/${category}`;
      }
      return 'barber-store/products';
    },
    format: async () => {
      // Luôn chuyển đổi ảnh sang định dạng jpg
      return 'jpg';
    },
    public_id: (req, file) => {
      // Lấy tên file gốc và loại bỏ extension
      const originalName = file.originalname.split('.')[0];
      return originalName;
    }
  }
});

// Khởi tạo upload với error handling
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Giới hạn 5MB
  fileFilter: fileFilter
}).single('image'); // Pre-configured for single image uploads

// Wrap multer middleware with error handler
module.exports = function(req, res, next) {
  upload(req, res, function(err) {
    if (err) {
      console.error('Upload middleware error:', err);
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            message: 'File quá lớn. Kích thước tối đa là 5MB.'
          });
        }
        return res.status(400).json({
          success: false,
          message: `Lỗi upload: ${err.message}`
        });
      } else {
        // An unknown error occurred when uploading.
        return res.status(500).json({
          success: false,
          message: err.message || 'Lỗi không xác định khi tải tệp lên'
        });
      }
    }
    
    // Everything went fine.
    next();
  });
};

module.exports = upload;