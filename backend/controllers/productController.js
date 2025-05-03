const Product = require('../models/Product');

// @desc    Fetch all products with optional filters and pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // Xử lý filter và phân trang
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Xây dựng query filters
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Đếm tổng số sản phẩm để tính số trang
    const totalProducts = await Product.countDocuments(filter);
    
    // Lấy sản phẩm theo filter với phân trang
    const products = await Product.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Trả về dữ liệu với format chuẩn
    res.json({
      products,
      page,
      pages: Math.ceil(totalProducts / limit),
      totalPages: Math.ceil(totalProducts / limit),
      totalProducts
    });
  } catch (error) {
    console.error('Error fetching products:', error);
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

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Staff
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    // Handle image upload from Cloudinary
    let imgURL = '/assets/product-default.jpg'; // Default image
    if (req.file) {
      // Sử dụng URL từ Cloudinary
      imgURL = req.file.path;
    }
    
    const product = new Product({
      name,
      description,
      price,
      category,
      quantity: stock || 0, // Map stock từ request vào quantity trong model
      imgURL // Sử dụng URL ảnh từ Cloudinary
    });
    
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Staff
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Cập nhật thông tin sản phẩm
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.quantity = stock !== undefined ? stock : product.quantity;
    
    // Xử lý upload ảnh mới từ Cloudinary nếu có
    if (req.file) {
      product.imgURL = req.file.path;
    }
    
    const updatedProduct = await product.save();
    res.json(updatedProduct);
    
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Staff
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Sử dụng findByIdAndDelete thay vì remove() cho phiên bản mongoose mới
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get products grouped by category
// @route   GET /api/products/categories
// @access  Public
const getProductsByCategory = async (req, res) => {
  try {
    // Get all products
    const products = await Product.find();
    
    // Group products by category
    const productsByCategory = {};
    
    // Process each product
    for (const product of products) {
      // Skip products without a category
      if (!product.category) continue;
      
      // Initialize the category array if it doesn't exist
      if (!productsByCategory[product.category]) {
        productsByCategory[product.category] = [];
      }
      
      // Add the product to its category
      productsByCategory[product.category].push(product);
    }
    
    res.json(productsByCategory);
  } catch (error) {
    console.error('Error fetching products by category:', error);
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

// @desc    Get product statistics for dashboard
// @route   GET /api/products/stats
// @access  Private/Staff
const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStock = await Product.countDocuments({ quantity: { $lt: 5 } });
    
    // Tính tổng giá trị kho hàng
    const inventoryValue = await Product.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: ["$price", "$quantity"] } }
        }
      }
    ]);
    
    const stats = {
      totalProducts,
      lowStock,
      inventoryValue: inventoryValue.length > 0 ? inventoryValue[0].total : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting product stats:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getProducts, 
  getProductById, 
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory, 
  getProductsByCategoryShowcase,
  getProductStats
};