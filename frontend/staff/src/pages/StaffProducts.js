import React, { useState, useEffect, useCallback } from 'react';
import staffProductService from '../services/staffProductService';
import useSuccessMessage from '../hooks/useSuccessMessage';
import useDeleteConfirm from '../hooks/useDeleteConfirm';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import SuccessToast from '../components/common/SuccessToast';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import ProductFormModal from '../components/products/ProductFormModal';
import { formatShortId } from '../utils/formatters';

const ITEMS_PER_PAGE = 10;
const EMPTY_PRODUCT = { name: '', description: '', price: '', stock: '', category: '', image: null };

const StaffProducts = () => {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState(['All Categories']);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(EMPTY_PRODUCT);
  const [imagePreview, setImagePreview] = useState('');

  const { message: successMessage, showSuccess, clearMessage } = useSuccessMessage(3000);
  const deleteConfirm = useDeleteConfirm(
    (id) => staffProductService.deleteProduct(id),
    () => { fetchProducts(); showSuccess('Product and associated image deleted successfully!'); }
  );

  const fetchCategories = useCallback(async () => {
    try {
      const response = await staffProductService.getAllCategories();
      setCategories(Array.isArray(response) ? ['All Categories', ...response] : ['All Categories', 'Pomade', 'Pre-styling', 'Grooming']);
    } catch (err) {
      console.error('Error fetching categories:', err.message);
      setCategories(['All Categories', 'Pomade', 'Pre-styling', 'Grooming']);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory !== 'All Categories' ? selectedCategory : '';

      if (showLowStockOnly) {
        const allPagesResponse = await staffProductService.getAllProducts(categoryParam, 1, 1000);
        if (allPagesResponse?.products) {
          const lowStock = allPagesResponse.products.filter(p => (p.quantity || 0) <= 5);
          const totalLowStockPages = Math.max(1, Math.ceil(lowStock.length / ITEMS_PER_PAGE));
          const start = (currentPage - 1) * ITEMS_PER_PAGE;
          setFilteredProducts(lowStock.slice(start, start + ITEMS_PER_PAGE));
          setTotalPages(totalLowStockPages);
        } else {
          setFilteredProducts([]); setTotalPages(1);
        }
      } else {
        const response = await staffProductService.getAllProducts(categoryParam, currentPage, ITEMS_PER_PAGE);
        if (response?.products) {
          setFilteredProducts(response.products);
          setTotalPages(response.totalPages || 1);
        } else {
          console.warn('Invalid response format:', response);
          setFilteredProducts([]); setTotalPages(1);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again later.');
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, currentPage, showLowStockOnly]);

  useEffect(() => { fetchProducts(); fetchCategories(); }, [selectedCategory, currentPage, fetchProducts, fetchCategories]);

  const resetForm = () => { setCurrentProduct(EMPTY_PRODUCT); setImagePreview(''); setEditMode(false); };

  const openAddModal = () => { resetForm(); setIsModalOpen(true); };

  const openEditModal = (product) => {
    setCurrentProduct({
      id: product._id,
      name: product.name || '',
      description: product.description || '',
      price: product.price ? product.price.toString() : '0',
      stock: product.quantity ? product.quantity.toString() : '0',
      category: product.category || '',
      image: null,
    });
    setImagePreview(product.imgURL || '');
    setEditMode(true);
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); resetForm(); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCurrentProduct(prev => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const productData = {
        name: currentProduct.name,
        description: currentProduct.description,
        price: parseFloat(currentProduct.price),
        stock: parseInt(currentProduct.stock),
        category: currentProduct.category,
        image: currentProduct.image,
      };
      if (editMode) {
        await staffProductService.updateProduct(currentProduct.id, productData);
        showSuccess('Product updated successfully!');
      } else {
        await staffProductService.createProduct(productData);
        showSuccess('New product added successfully!');
      }
      closeModal();
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(`Failed to ${editMode ? 'update' : 'create'} product. Please try again.`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container px-3 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Manage Products</h2>
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add New Product
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span className="me-3">All Products</span>
              <div className="d-flex align-items-center">
                <div className="form-check form-switch me-3">
                  <input
                    className="form-check-input" type="checkbox" id="lowStockFilter"
                    checked={showLowStockOnly}
                    onChange={() => { setShowLowStockOnly(prev => !prev); setCurrentPage(1); }}
                  />
                  <label className="form-check-label text-danger fw-bold" htmlFor="lowStockFilter">Low Stock</label>
                </div>
                <select
                  className="form-select form-select-sm" style={{ width: '150px' }}
                  value={selectedCategory}
                  onChange={e => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                >
                  {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingSpinner />
              ) : filteredProducts.length > 0 ? (
                <div className="table-responsive" style={{ minHeight: '650px' }}>
                  <table className="table table-hover">
                    <thead>
                      <tr><th>ID</th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => {
                        const isLowStock = (product.quantity || 0) <= 5;
                        return (
                          <tr key={product._id}>
                            <td>{formatShortId(product._id)}</td>
                            <td>
                              <img
                                src={product.imgURL || '/assets/products/placeholder.jpg'}
                                alt={product.name} width="40" className="img-thumbnail"
                              />
                            </td>
                            <td>{product.name}</td>
                            <td>{product.category}</td>
                            <td>${parseFloat(product.price).toFixed(2)}</td>
                            <td>
                              {isLowStock ? (
                                <span className="text-danger fw-bold d-flex align-items-center">
                                  {product.quantity || 0}
                                  <i className="bi bi-exclamation-triangle-fill ms-2"></i>
                                </span>
                              ) : product.quantity || 0}
                            </td>
                            <td>
                              <button className="btn btn-sm btn-primary me-1" onClick={() => openEditModal(product)}>Edit</button>
                              <button
                                className="btn btn-sm btn-danger me-1"
                                onClick={() => deleteConfirm.openDelete(product._id, formatShortId(product._id))}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  message={showLowStockOnly ? 'No low stock products found in this category.' : 'No products found for the selected category.'}
                  icon="bi-box-seam"
                />
              )}

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); }} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        editMode={editMode}
        product={currentProduct}
        imagePreview={imagePreview}
        categories={categories}
        isUploading={isUploading}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleInputChange}
        onImageChange={handleImageChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        entityName="product"
        displayId={deleteConfirm.displayName}
        isDeleting={deleteConfirm.isDeleting}
        onConfirm={deleteConfirm.confirmDelete}
        onCancel={deleteConfirm.closeDelete}
      />

      {/* Success Toast */}
      <SuccessToast message={successMessage} onClose={clearMessage} />
    </div>
  );
};

export default StaffProducts;