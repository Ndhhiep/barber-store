import React, { useState, useEffect } from 'react';
import staffProductService from '../services/staffProductService';

const StaffProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false); // New state for upload loading
  const [successMessage, setSuccessMessage] = useState(''); // New state for success message
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productDisplayId, setProductDisplayId] = useState(null); // New state for displayed product ID
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Fetch products on initial load and when filters change
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [selectedCategory, currentPage]);
  
  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Chỉ truyền category khi không phải "All Categories"
      const categoryParam = selectedCategory !== 'All Categories' ? selectedCategory : '';
      const response = await staffProductService.getAllProducts(categoryParam, currentPage, 10);
      
      // Kiểm tra dữ liệu trả về
      if (response && response.products) {
        setProducts(response.products);
        setTotalPages(response.totalPages || 1);
      } else {
        // Fallback nếu response không đúng định dạng
        console.warn('Invalid response format:', response);
        setProducts([]);
        setTotalPages(1);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await staffProductService.getAllCategories();
      if (Array.isArray(response)) {
        setCategories(['All Categories', ...response]);
      } else {
        // Fallback với một số danh mục mặc định
        setCategories(['All Categories', 'Pomade', 'Pre-styling', 'Grooming']);
      }
    } catch (err) {
      console.error('Error fetching categories:', err.message);
      // Fallback với một số danh mục mặc định nếu có lỗi
      setCategories(['All Categories', 'Pomade', 'Pre-styling', 'Grooming']);
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
    setIsUploading(true); // Start loading state
    
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
        setSuccessMessage('Product updated successfully!');
      } else {
        await staffProductService.createProduct(productData);
        setSuccessMessage('New product added successfully!');
      }
      
      closeModal();
      fetchProducts(); // Refresh the product list
    } catch (err) {
      console.error('Error saving product:', err);
      setError(`Failed to ${editMode ? 'update' : 'create'} product. Please try again.`);
      setTimeout(() => setError(null), 3000); // Clear error after 3 seconds
    } finally {
      setIsUploading(false); // End loading state
    }
  };
  
  const openDeleteModal = (id, productId) => {
    setProductToDelete(id);
    // Store the displayed product ID (last 6 characters)
    setProductDisplayId(productId.slice(-6).toUpperCase());
    setDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setProductToDelete(null);
    setProductDisplayId(null);
    setDeleteModalOpen(false);
  };
  
  const handleDeleteProduct = async () => {
    try {
      setDeleteLoading(true);
      await staffProductService.deleteProduct(productToDelete);
      fetchProducts(); // Refresh the product list
      setSuccessMessage('Product and associated image deleted successfully!');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleteLoading(false);
      closeDeleteModal();
    }
  };
  
  return (
    <div className="container-fluid px-3 mt-4">
      <h2>Manage Products</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      
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
                <div className="table-responsive" style={{ minHeight: '650px' }}>
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
                              src={product.imgURL || '/assets/products/placeholder.jpg'} 
                              alt={product.name} 
                              width="40" 
                              className="img-thumbnail"
                            />
                          </td>
                          <td>{product.name}</td>
                          <td>{product.category}</td>
                          <td>${parseFloat(product.price).toFixed(2)}</td>
                          <td>{product.quantity || 0}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-primary me-1" 
                              onClick={() => openEditModal(product)}
                            >
                              Edit
                            </button>
                            <button 
                              className="btn btn-sm btn-danger me-1" 
                              onClick={() => openDeleteModal(product._id, product._id)}
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
        <>
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered"> {/* Added modal-dialog-centered */}
              <div className="modal-content">
                <div className="modal-header bg-light"> {/* Added background color */}
                  <h5 className="modal-title">{editMode ? 'Edit Product' : 'Add New Product'}</h5>
                  <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"></button> {/* Improved close button */}
                </div>
                <div className="modal-body p-4"> {/* Added padding */}
                  <form onSubmit={handleSubmit}>
                    {/* Row 1: Name and Category */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="name" className="form-label fw-bold">Product Name</label> {/* Added fw-bold */}
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
                      <div className="col-md-6">
                        <label htmlFor="category" className="form-label fw-bold">Category</label> {/* Added fw-bold */}
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

                    {/* Row 2: Price and Stock */}
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="price" className="form-label fw-bold">Price ($)</label> {/* Added fw-bold */}
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
                      <div className="col-md-6">
                        <label htmlFor="stock" className="form-label fw-bold">Stock</label> {/* Added fw-bold */}
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

                    {/* Row 3: Description */}
                    <div className="row mb-3">
                      <div className="col-12">
                        <label htmlFor="description" className="form-label fw-bold">Description</label> {/* Added fw-bold */}
                        <textarea 
                          className="form-control" 
                          id="description" 
                          name="description" 
                          rows="4" // Increased rows for better visibility
                          value={currentProduct.description} 
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>

                    {/* Row 4: Image Upload and Preview */}
                    <div className="row mb-4"> {/* Increased bottom margin */}
                      <div className="col-12">
                        <label htmlFor="image" className="form-label fw-bold">Product Image</label> {/* Added fw-bold */}
                        <div className="d-flex align-items-start"> {/* Use flexbox for alignment */}
                          <div className="flex-grow-1 me-3">
                            <input 
                              type="file" 
                              className="form-control" 
                              id="image" 
                              name="image" 
                              onChange={handleImageChange}
                              accept="image/*"
                            />
                            <small className="form-text text-muted">
                              {editMode && currentProduct.imageUrl ? 'Leave blank to keep the current image.' : 'Upload a new image.'}
                            </small>
                          </div>
                          {imagePreview && (
                            <div className="mt-0"> {/* Removed mt-2 */}
                              <img 
                                src={imagePreview} 
                                alt="Product preview" 
                                className="img-thumbnail" // Use img-thumbnail for border
                                style={{ maxHeight: '100px', maxWidth: '150px', objectFit: 'contain' }} // Adjusted style
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Modal Footer */}
                    <div className="modal-footer mt-4 pt-3 border-top"> {/* Added margin-top, padding-top and border */}
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary" 
                        onClick={closeModal}
                        disabled={isUploading}
                      >
                        Cancel
                      </button> {/* Styled Cancel button */}
                      <button 
                        type="submit" 
                        className="btn btn-primary"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            {editMode ? 'Saving...' : 'Uploading...'}
                          </>
                        ) : (
                          editMode ? 'Save Changes' : 'Add Product'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <>
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0">
                  <h5 className="modal-title fs-4">Confirmation</h5>
                  <button type="button" className="btn-close" onClick={closeDeleteModal} aria-label="Close"></button>
                </div>
                <div className="modal-body pt-0">
                  <p className="text-secondary">
                    Are you sure you want to delete product with ID: <span className="fw-bold">{productDisplayId}</span>? This action cannot be undone and you will be unable to recover any data.
                  </p>
                </div>
                <div className="modal-footer border-0">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ backgroundColor: '#CED4DA', borderColor: '#CED4DA', color: '#212529' }}
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    style={{ backgroundColor: '#FA5252' }}
                    onClick={handleDeleteProduct}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Deleting...
                      </>
                    ) : (
                      'Yes, delete it!'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
      
      {/* Floating success notification */}
      {successMessage && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            maxWidth: '300px'
          }}
          className="toast show bg-success text-white"
        >
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">Success</strong>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setSuccessMessage('')}
            ></button>
          </div>
          <div className="toast-body">
            {successMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProducts;