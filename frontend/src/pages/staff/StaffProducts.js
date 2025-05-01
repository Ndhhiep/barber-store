import React, { useState, useEffect } from 'react';
import staffProductService from '../../services/staff_services/staffProductService';

const StaffProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState('');
  
  // Fetch products on initial load and when filters change
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, currentPage]);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await staffProductService.getAllProducts(selectedCategory, currentPage, 10);
      setProducts(response.products || []);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await staffProductService.getAllCategories();
      setCategories(['All Categories', ...response]);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1); // Reset to first page when changing category
  };
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const resetForm = () => {
    setCurrentProduct({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      image: null
    });
    setImagePreview('');
    setEditMode(false);
  };
  
  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };
  
  const openEditModal = (product) => {
    setCurrentProduct({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      image: null // Existing image will be kept if not changed
    });
    setImagePreview(product.imageUrl);
    setEditMode(true);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct({
      ...currentProduct,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentProduct({
        ...currentProduct,
        image: file
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: currentProduct.name,
        description: currentProduct.description,
        price: parseFloat(currentProduct.price),
        stock: parseInt(currentProduct.stock),
        category: currentProduct.category,
        image: currentProduct.image
      };
      
      if (editMode) {
        await staffProductService.updateProduct(currentProduct.id, productData);
      } else {
        await staffProductService.createProduct(productData);
      }
      
      closeModal();
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error('Error saving product:', err);
      alert(`Failed to ${editMode ? 'update' : 'create'} product. Please try again.`);
    }
  };
  
  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await staffProductService.deleteProduct(id);
        fetchProducts(); // Refresh the product list
      } catch (err) {
        console.error('Error deleting product:', err);
        alert('Failed to delete product. Please try again.');
      }
    }
  };
  
  return (
    <div className="container mt-4">
      <h2>Manage Products</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="mb-3">
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add New Product
        </button>
      </div>
      
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Products</span>
              <div>
                <select 
                  className="form-select form-select-sm" 
                  style={{width: '150px'}}
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center my-3"><div className="spinner-border" role="status"></div></div>
              ) : products.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product._id}>
                          <td>{product._id.slice(-6).toUpperCase()}</td>
                          <td>
                            <img 
                              src={product.imageUrl || '/assets/products/placeholder.jpg'} 
                              alt={product.name} 
                              width="40" 
                              className="img-thumbnail"
                            />
                          </td>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>${parseFloat(product.price).toFixed(2)}</td>
                          <td>{product.stock}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary me-1" 
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-danger me-1" 
                              onClick={() => handleDeleteProduct(product._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No products found for the selected category.</p>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <li 
                        key={i} 
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Modal Form */}
      {isModalOpen && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editMode ? 'Edit Product' : 'Add New Product'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">Product Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="name" 
                          name="name" 
                          value={currentProduct.name} 
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label htmlFor="description" className="form-label">Description</label>
                        <textarea 
                          className="form-control" 
                          id="description" 
                          name="description" 
                          rows="3" 
                          value={currentProduct.description} 
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="image" className="form-label">Product Image</label>
                        <input 
                          type="file" 
                          className="form-control" 
                          id="image" 
                          name="image" 
                          onChange={handleImageChange}
                          accept="image/*"
                        />
                        {imagePreview && (
                          <div className="mt-2">
                            <img 
                              src={imagePreview} 
                              alt="Product preview" 
                              className="img-fluid img-thumbnail" 
                              style={{ maxHeight: '100px' }} 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="category" className="form-label">Category</label>
                        <select 
                          className="form-select" 
                          id="category" 
                          name="category" 
                          value={currentProduct.category} 
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.filter(c => c !== 'All Categories').map((category, index) => (
                            <option key={index} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="price" className="form-label">Price ($)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          id="price" 
                          name="price" 
                          min="0.01" 
                          step="0.01" 
                          value={currentProduct.price} 
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label htmlFor="stock" className="form-label">Stock</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          id="stock" 
                          name="stock" 
                          min="0" 
                          value={currentProduct.stock} 
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
};

export default StaffProducts;