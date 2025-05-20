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

// Khởi tạo upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Giới hạn 5MB
  fileFilter: fileFilter
});

module.exports = upload;