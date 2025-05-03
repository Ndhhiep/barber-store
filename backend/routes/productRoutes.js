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
// @desc    Fetch all products with pagination and filtering
router.get('/', getProducts);

// @route   GET /api/products/categories
// @desc    Get distinct product categories
router.get('/categories', getProductsByCategory);

// @route   GET /api/products/showcase-by-category
// @desc    Get products grouped by category for showcase
router.get('/showcase-by-category', getProductsByCategoryShowcase);

// @route   GET /api/products/stats
// @desc    Get product statistics for dashboard
router.get('/stats', protect, staffOnly, getProductStats);

// @route   POST /api/products
// @desc    Create a new product
router.post('/', protect, staffOnly, upload.single('image'), createProduct);

// @route   GET /api/products/:id
// @desc    Fetch a single product by ID
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Update a product
router.put('/:id', protect, staffOnly, upload.single('image'), updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete a product
router.delete('/:id', protect, staffOnly, deleteProduct);

module.exports = router;