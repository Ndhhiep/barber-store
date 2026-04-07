const productService = require('../services/productService');
const CreateProductDTO = require('../dto/product/CreateProductDTO');

const _error = (res, err) =>
  res.status(err.statusCode || 500).json({ message: err.message || 'Server error' });

// GET /api/products
const getProducts = async (req, res) => {
  try {
    const result = await productService.getProducts(req.query);
    res.json(result);
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (error) {
    _error(res, error);
  }
};

// POST /api/products
const createProduct = async (req, res) => {
  try {
    const dto = new CreateProductDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return res.status(400).json({ message: errors[0] });

    const fileUrl = req.file ? req.file.path : null;
    const created = await productService.createProduct(dto, fileUrl);
    res.status(201).json(created);
  } catch (error) {
    _error(res, error);
  }
};

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const fileUrl = req.file ? req.file.path : null;
    const updated = await productService.updateProduct(req.params.id, req.body, fileUrl);
    res.json(updated);
  } catch (error) {
    _error(res, error);
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(req.params.id);
    res.json({ message: 'Product and associated image removed' });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/products/categories
const getProductsByCategory = async (req, res) => {
  try {
    const result = await productService.getProductsByCategory();
    res.json(result);
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/products/showcase-by-category
const getProductsByCategoryShowcase = async (req, res) => {
  try {
    const result = await productService.getProductsByCategoryShowcase();
    res.json(result || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch showcase products', error: error.message });
  }
};

// GET /api/products/stats
const getProductStats = async (req, res) => {
  try {
    const stats = await productService.getProductStats();
    res.json(stats);
  } catch (error) {
    _error(res, error);
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getProductsByCategory, getProductsByCategoryShowcase, getProductStats };