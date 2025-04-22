const Product = require('../models/Product');

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get products grouped by category
// @route   GET /api/products/categories
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    // Get all unique categories
   
    const categories = await Product.distinct('category');
    
    
    // Create an object to store products by category
    const productsByCategory = {};
    
    if (categories.length === 0) {
      console.log('No categories found, returning empty object.'); // Log if no categories
    }

    // For each category, find all products
    for (const category of categories) {
      
      const products = await Product.find({ category });
      
      productsByCategory[category] = products;
    }
    
    res.json(productsByCategory);
  } catch (error) {
    
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get max 3 products per category for showcase
// @route   GET /api/products/showcase-by-category
// @access  Public
const getProductsByCategoryShowcase = async (req, res) => {
  try {
    const productsShowcase = await Product.aggregate([
      {
        $match: { category: { $exists: true, $ne: null } } // Only include products with valid category
      },
      {
        $sort: { createdAt: -1 } // Sort products first (newest first)
      },
      {
        $group: {
          _id: '$category', // Group by category
          products: { $push: '$$ROOT' } // Collect products for each category
        }
      },
      {
        $project: {
          category: '$_id', // The category name is already in _id since it's a string
          products: { $slice: ['$products', 3] }, // Get top 3 products
          _id: 0 // Exclude the default _id field from output
        }
      },
      {
        $sort: { category: 1 } // Sort the results by category name
      }
    ]);
    
    
    // Return empty array instead of null if no results
    res.json(productsShowcase || []);

  } catch (error) {
    console.error('Error in getProductsByCategoryShowcase:', error);
    res.status(500).json({ 
      message: 'Failed to fetch showcase products', 
      error: error.message 
    });
  }
};

module.exports = { 
  getProducts, 
  getProductById, 
  getProductsByCategory, 
  getProductsByCategoryShowcase // Add the new function here
};