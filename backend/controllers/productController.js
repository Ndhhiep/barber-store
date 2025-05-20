const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

// @desc    Lấy tất cả sản phẩm với bộ lọc và phân trang tùy chọn
// @route   GET /api/products
// @access  Công khai
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

// @desc    Lấy một sản phẩm theo ID
// @route   GET /api/products/:id
// @access  Công khai
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

// @desc    Tạo sản phẩm mới
// @route   POST /api/products
// @access  Riêng tư/Staff
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    
    // Xử lý tải ảnh lên Cloudinary
    let imgURL = '/assets/product-default.jpg'; // Hình mặc định
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

// @desc    Cập nhật thông tin sản phẩm
// @route   PUT /api/products/:id
// @access  Riêng tư/Staff
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

// @desc    Xóa sản phẩm
// @route   DELETE /api/products/:id
// @access  Riêng tư/Staff
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Trích xuất public ID từ URL Cloudinary nếu tồn tại
    if (product.imgURL && product.imgURL.includes('cloudinary.com')) {
      try {
        // Extract the public ID from Cloudinary URL
        const uploadIndex = product.imgURL.indexOf('/upload/');
        if (uploadIndex !== -1) {
          // Get everything after /upload/v1234567890/
          const parts = product.imgURL.substring(uploadIndex + 8).split('/');
          // Remove the version number (starts with v)
          if (parts[0].startsWith('v') && /^\d+$/.test(parts[0].substring(1))) {
            parts.shift();
          }
          
          // Join the remaining parts to form the public ID
          const publicId = parts.join('/').split('.')[0]; // Remove extension
          
          // Delete image from Cloudinary
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (cloudinaryError) {
        // Continue with product deletion even if image deletion fails
      }
    }
    
    // Delete the product from MongoDB
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product and associated image removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Lấy sản phẩm nhóm theo category
// @route   GET /api/products/categories
// @access  Công khai
const getProductsByCategory = async (req, res) => {
  try {
    // Lấy tất cả sản phẩm
    const products = await Product.find();
    
    // Nhóm sản phẩm theo category
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

// @desc    Lấy tối đa 3 sản phẩm cho mỗi category để hiển thị
// @route   GET /api/products/showcase-by-category
// @access  Công khai
const getProductsByCategoryShowcase = async (req, res) => {
  try {
    const productsShowcase = await Product.aggregate([
      {
        $match: { category: { $exists: true, $ne: null } } // Chỉ bao gồm sản phẩm có category hợp lệ
      },
      {
        $sort: { createdAt: -1 } // Sắp xếp sản phẩm (mới nhất trước)
      },
      {
        $group: {
          _id: '$category', // Nhóm theo category
          products: { $push: '$$ROOT' } // Gom các sản phẩm cho mỗi category
        }
      },
      {
        $project: {
          category: '$_id',
          products: { $slice: ['$products', 3] }, // Lấy tối đa 3 sản phẩm
          _id: 0 // Loại bỏ trường _id mặc định khỏi kết quả
        }
      },
      {
        $sort: { category: 1 } // Sắp xếp kết quả theo tên category
      }
    ]);
    
    // Trả về mảng rỗng nếu không có kết quả
    res.json(productsShowcase || []);

  } catch (error) {
    console.error('Error in getProductsByCategoryShowcase:', error);
    res.status(500).json({ 
      message: 'Failed to fetch showcase products', 
      error: error.message 
    });
  }
};

// @desc    Lấy thống kê sản phẩm cho dashboard
// @route   GET /api/products/stats
// @access  Riêng tư/Staff
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