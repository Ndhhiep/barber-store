const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  getProductsByCategory, 
  getProductsByCategoryShowcase,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');
const { protect, staffOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   GET /api/products
// @desc    Lấy tất cả sản phẩm với phân trang và lọc
router.get('/', getProducts);

// @route   GET /api/products/categories
// @desc    Lấy các danh mục sản phẩm khác nhau
router.get('/categories', getProductsByCategory);

// @route   GET /api/products/showcase-by-category
// @desc    Lấy sản phẩm theo nhóm danh mục để trình diễn
router.get('/showcase-by-category', getProductsByCategoryShowcase);

// @route   GET /api/products/stats
// @desc    Lấy thống kê sản phẩm cho dashboard
router.get('/stats', protect, staffOnly, getProductStats);

// @route   POST /api/products
// @desc    Tạo sản phẩm mới
router.post('/', protect, staffOnly, upload.single('image'), createProduct);

// @route   GET /api/products/:id
// @desc    Lấy sản phẩm theo ID
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Cập nhật sản phẩm
router.put('/:id', protect, staffOnly, upload.single('image'), updateProduct);

// @route   DELETE /api/products/:id
// @desc    Xóa sản phẩm
router.delete('/:id', protect, staffOnly, deleteProduct);

module.exports = router;