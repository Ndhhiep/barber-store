import React from 'react';

const SPECIALTIES = ['Haircuts', 'Beard Trim', 'Shaving', 'Hair Coloring', 'Styling', 'Skin Fade'];

/**
 * BarberFormModal — form thêm/sửa barber với specialty checkboxes, working days, image upload.
 *
 * Props:
 *   isOpen        {boolean}
 *   editMode      {boolean}
 *   formData      {object}    - current form state
 *   imagePreview  {string}    - URL/blob để preview ảnh
 *   formErrors    {object}    - validation error messages
 *   isLoading     {boolean}
 *   onClose       {Function}
 *   onSubmit      {Function}  - (e) => void
 *   onChange      {Function}  - (e) => void — handles all inputs including working days/hours checkboxes
 *   onImageChange {Function}  - (e) => void
 *   onStatusChange{Function}  - (value: 'Active'|'Inactive') => void
 */
const BarberFormModal = ({
  isOpen,
  editMode,
  formData,
  imagePreview,
  formErrors = {},
  isLoading = false,
  onClose,
  onSubmit,
  onChange,
  onImageChange,
  onStatusChange,
}) => {
  if (!isOpen) return null;

  const toggleSpecialty = (specialty) => {
    const current = formData.specialization || '';
    const specialties = current.split(',').map(s => s.trim()).filter(Boolean);
    const idx = specialties.indexOf(specialty);
    if (idx === -1) specialties.push(specialty);
    else specialties.splice(idx, 1);
    // Create a synthetic event-like object for onChange
    onChange({ target: { name: 'specialization', value: specialties.join(', '), type: 'text' } });
  };

  return (
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1050, maxWidth: '600px' }}>
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title">{editMode ? 'Edit Barber' : 'Add New Barber'}</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <form onSubmit={onSubmit}>
              <div className="modal-body pt-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {formErrors.submit && <div className="alert alert-danger">{formErrors.submit}</div>}

                {/* Row 1: Name & Email */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label mb-1 fw-medium">Full Name</label>
                    <input
                      type="text" id="name" name="name"
                      className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                      value={formData.name} onChange={onChange}
                      placeholder="Enter barber's full name" required
                    />
                    {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="email" className="form-label mb-1 fw-medium">Email</label>
                    <input
                      type="email" id="email" name="email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      value={formData.email} onChange={onChange}
                      placeholder="Enter email address" required
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                  </div>
                </div>

                {/* Row 2: Phone & Status */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="phone" className="form-label mb-1 fw-medium">Phone Number</label>
                    <input
                      type="tel" id="phone" name="phone"
                      className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                      value={formData.phone} onChange={onChange}
                      placeholder="Enter phone number" required
                    />
                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label mb-1 fw-medium">Status</label>
                    <select
                      className="form-select" name="is_active"
                      value={formData.is_active ? 'Active' : 'Inactive'}
                      onChange={(e) => onStatusChange(e.target.value)}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Specialties */}
                <div className="mb-3">
                  <label className="form-label mb-2 fw-medium">Specialties</label>
                  <div className="d-flex flex-wrap gap-2">
                    {SPECIALTIES.map(sp => (
                      <div className="form-check form-check-inline mb-2" key={sp}>
                        <input
                          className="form-check-input" type="checkbox"
                          id={`sp-${sp}`} checked={formData.specialization?.includes(sp)}
                          onChange={() => toggleSpecialty(sp)}
                        />
                        <label className="form-check-label" htmlFor={`sp-${sp}`}>{sp}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label htmlFor="description" className="form-label mb-1 fw-medium">Bio/Description</label>
                  <textarea
                    id="description" name="description" rows="3"
                    className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                    value={formData.description} onChange={onChange}
                    placeholder="Enter barber's bio, experience, and specialties" required
                  ></textarea>
                  {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                </div>

                {/* Image Upload */}
                <div className="mb-3">
                  <label htmlFor="imageFile" className="form-label mb-1 fw-medium">Profile Photo</label>
                  <div
                    className="border border-1 border-dashed rounded-3 p-3 text-center position-relative"
                    style={{ cursor: 'pointer' }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview} alt="Barber preview" className="img-fluid"
                        style={{ maxHeight: '150px', objectFit: 'contain' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150x150?text=Invalid+Image'; }}
                      />
                    ) : (
                      <div className="py-4 text-muted">
                        <div className="mb-2"><i className="fas fa-cloud-upload-alt fa-2x"></i></div>
                        <div>Drag and drop an image, or click to browse</div>
                        <div className="small text-secondary mt-1">PNG, JPG or WEBP (max. 2MB)</div>
                      </div>
                    )}
                    <input
                      type="file" className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                      style={{ cursor: 'pointer' }} id="imageFile" name="imageFile"
                      onChange={onImageChange} accept="image/*"
                    />
                  </div>
                  {formErrors.image && <div className="text-danger small mt-1">{formErrors.image}</div>}
                </div>
              </div>

              <div className="modal-footer border-0 justify-content-end pt-1">
                <button type="button" className="btn btn-sm btn-light" onClick={onClose} disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary ms-2" disabled={isLoading}>
                  {isLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Loading...</>
                  ) : (
                    editMode ? 'Save Barber' : 'Add Barber'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default BarberFormModal;
