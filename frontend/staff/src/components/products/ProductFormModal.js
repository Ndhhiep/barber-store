import React, { useState } from 'react';

const INITIAL_PRODUCT = { name: '', description: '', price: '', stock: '', category: '', image: null };

/**
 * ProductFormModal — form thêm/sửa sản phẩm với image upload và preview.
 *
 * Props:
 *   isOpen        {boolean}   - Modal có mở không
 *   editMode      {boolean}   - Đang sửa hay thêm mới
 *   product       {object}    - Dữ liệu sản phẩm ban đầu (khi editMode)
 *   imagePreview  {string}    - URL ảnh preview hiện tại
 *   categories    {string[]}  - Danh sách categories để chọn
 *   isUploading   {boolean}   - Đang upload / submit
 *   onClose       {Function}  - Callback đóng modal
 *   onSubmit      {Function}  - (e) => void — form submit handler từ parent
 *   onChange      {Function}  - (e) => void — input change handler từ parent
 *   onImageChange {Function}  - (e) => void — image change handler từ parent
 */
const ProductFormModal = ({
  isOpen,
  editMode,
  product = INITIAL_PRODUCT,
  imagePreview,
  categories = [],
  isUploading = false,
  onClose,
  onSubmit,
  onChange,
  onImageChange,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-light">
              <h5 className="modal-title">{editMode ? 'Edit Product' : 'Add New Product'}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>
            <div className="modal-body p-4">
              <form onSubmit={onSubmit}>
                {/* Row 1: Name & Category */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label fw-bold">Product Name</label>
                    <input
                      type="text" className="form-control" id="name" name="name"
                      value={product.name} onChange={onChange} required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="category" className="form-label fw-bold">Category</label>
                    <select
                      className="form-select" id="category" name="category"
                      value={product.category} onChange={onChange} required
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter(c => c !== 'All Categories')
                        .map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                {/* Row 2: Price & Stock */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="price" className="form-label fw-bold">Price ($)</label>
                    <input
                      type="number" className="form-control" id="price" name="price"
                      min="0.01" step="0.01" value={product.price} onChange={onChange} required
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="stock" className="form-label fw-bold">Stock</label>
                    <input
                      type="number" className="form-control" id="stock" name="stock"
                      min="0" value={product.stock} onChange={onChange} required
                    />
                  </div>
                </div>

                {/* Row 3: Description */}
                <div className="row mb-3">
                  <div className="col-12">
                    <label htmlFor="description" className="form-label fw-bold">Description</label>
                    <textarea
                      className="form-control" id="description" name="description"
                      rows="4" value={product.description} onChange={onChange}
                    ></textarea>
                  </div>
                </div>

                {/* Row 4: Image */}
                <div className="row mb-4">
                  <div className="col-12">
                    <label htmlFor="image" className="form-label fw-bold">Product Image</label>
                    <div className="d-flex flex-column align-items-center mb-3">
                      {imagePreview ? (
                        <div className="text-center mb-3">
                          <img
                            src={imagePreview} alt="Product preview" className="img-thumbnail"
                            style={{ height: '180px', width: '180px', objectFit: 'contain' }}
                          />
                        </div>
                      ) : (
                        <div className="text-center mb-3">
                          <div
                            className="border rounded p-4 d-flex justify-content-center align-items-center"
                            style={{ height: '180px', width: '180px', backgroundColor: '#f8f9fa' }}
                          >
                            <i className="bi bi-image" style={{ fontSize: '2.5rem', color: '#adb5bd' }}></i>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <input
                          type="file" className="d-none" id="image" name="image"
                          onChange={onImageChange} accept="image/*"
                        />
                        <label htmlFor="image" className="btn btn-outline-primary">
                          <i className="bi bi-upload me-1"></i> Choose Image
                        </label>
                        <small className="d-block form-text text-muted mt-2">
                          {editMode ? 'Leave blank to keep the current image.' : 'Recommended size: 500x500 pixels'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="modal-footer mt-4 pt-3 border-top">
                  <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={isUploading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUploading}>
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
    </>
  );
};

export default ProductFormModal;
