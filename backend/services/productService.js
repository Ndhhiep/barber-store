const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');

const getProducts = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const filter = {};
  if (query.category) filter.category = query.category;

  const totalProducts = await Product.countDocuments(filter);
  const products = await Product.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit);

  return {
    products,
    page,
    pages: Math.ceil(totalProducts / limit),
    totalPages: Math.ceil(totalProducts / limit),
    totalProducts,
  };
};

const getProductById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });
  return product;
};

const createProduct = async (dto, fileUrl = null) => {
  const imgURL = fileUrl || '/assets/product-default.jpg';
  const product = new Product({
    name: dto.name,
    description: dto.description,
    price: dto.price,
    category: dto.category,
    quantity: dto.stock || 0,
    imgURL,
  });
  return product.save();
};

const updateProduct = async (id, dto, fileUrl = null) => {
  const product = await Product.findById(id);
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  product.name = dto.name || product.name;
  product.description = dto.description || product.description;
  product.price = dto.price || product.price;
  product.category = dto.category || product.category;
  product.quantity = dto.stock !== undefined ? dto.stock : product.quantity;
  if (fileUrl) product.imgURL = fileUrl;

  return product.save();
};

const deleteProduct = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw Object.assign(new Error('Product not found'), { statusCode: 404 });

  // Xóa ảnh khỏi Cloudinary nếu có
  if (product.imgURL && product.imgURL.includes('cloudinary.com')) {
    try {
      const uploadIndex = product.imgURL.indexOf('/upload/');
      if (uploadIndex !== -1) {
        const parts = product.imgURL.substring(uploadIndex + 8).split('/');
        if (parts[0].startsWith('v') && /^\d+$/.test(parts[0].substring(1))) parts.shift();
        const publicId = parts.join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
    } catch (_) {
      // Tiếp tục dù lỗi xóa ảnh
    }
  }

  await Product.findByIdAndDelete(id);
};

const getProductsByCategory = async () => {
  const products = await Product.find();
  const byCategory = {};
  for (const product of products) {
    if (!product.category) continue;
    if (!byCategory[product.category]) byCategory[product.category] = [];
    byCategory[product.category].push(product);
  }
  return byCategory;
};

const getProductsByCategoryShowcase = async () => {
  return Product.aggregate([
    { $match: { category: { $exists: true, $ne: null } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: '$category', products: { $push: '$$ROOT' } } },
    { $project: { category: '$_id', products: { $slice: ['$products', 3] }, _id: 0 } },
    { $sort: { category: 1 } },
  ]);
};

const getProductStats = async () => {
  const [totalProducts, lowStock, inventoryValue] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ quantity: { $lt: 5 } }),
    Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ['$price', '$quantity'] } } } }]),
  ]);
  return {
    totalProducts,
    lowStock,
    inventoryValue: inventoryValue.length > 0 ? inventoryValue[0].total : 0,
  };
};

module.exports = {
  getProducts, getProductById, createProduct, updateProduct,
  deleteProduct, getProductsByCategory, getProductsByCategoryShowcase, getProductStats,
};
