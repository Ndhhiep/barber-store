const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getProductsByCategory, getProductsByCategoryShowcase } = require('../controllers/productController');

// @route   GET /api/products
// @desc    Fetch all products
router.get('/', getProducts);

// @route   GET /api/products/categories
// @desc    Get products grouped by category
router.get('/categories', getProductsByCategory);

// @route   GET /api/products/showcase-by-category
// @desc    Get products grouped by category for showcase
router.get('/showcase-by-category', getProductsByCategoryShowcase);

// @route   GET /api/products/:id
// @desc    Fetch a single product by ID
router.get('/:id', getProductById);

module.exports = router;