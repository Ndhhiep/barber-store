import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import staffBarberService from '../services/staffBarberService';

const StaffBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingBarber, setEditingBarber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    specialization: '',
    expertise: [],
    imageUrl: '',
    email: '',
    phone: '',
    is_active: true,
    workingDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false
    },
    workingHours: {
      start: '09:00',
      end: '18:00'
    }
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [expertiseInput, setExpertiseInput] = useState('');

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const response = await staffBarberService.getAllBarbersForStaff();
      
      // Simplified data handling with minimal logging
      if (response && response.success && response.data && Array.isArray(response.data.barbers)) {
        setBarbers(response.data.barbers);
      } else if (response && Array.isArray(response.data)) {
        setBarbers(response.data);
      } else if (response && Array.isArray(response)) {
        setBarbers(response);
      } else {
        setBarbers([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching barbers:', err.message);
      setError('Failed to load barbers. Please try again later.');
      setBarbers([]); // Đảm bảo barbers luôn là mảng, ngay cả khi có lỗi
    } finally {
      setLoading(false);
    }
  };

  const handleImageUrlChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, imageUrl: value }));
    
    // Nếu URL hợp lệ thì hiển thị preview
    if (value.trim()) {
      setImagePreview(value);
    } else {
      setImagePreview(null);
    }
  };

  const openAddModal = () => {
    setEditingBarber(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      specialization: '',
      expertise: [],
      imageUrl: '',
      email: '',
      phone: '',
      is_active: true,
      workingDays: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false
      },
      workingHours: {
        start: '09:00',
        end: '18:00'
      }
    });
    setImagePreview(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name || '',
      title: barber.title || '',
      description: barber.description || '',
      specialization: barber.specialization || '',
      expertise: barber.expertise || [],
      imageUrl: barber.image_url || '',
      email: barber.email || '',
      phone: barber.phone || '',
      is_active: barber.is_active !== undefined ? barber.is_active : true,
      workingDays: barber.workingDays || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false
      },
      workingHours: barber.workingHours || {
        start: '09:00',
        end: '18:00'
      }
    });
    
    // Nếu barber có ảnh, hiển thị nó làm preview
    if (barber.image_url) {
      setImagePreview(barber.image_url);
    } else {
      setImagePreview(null);
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBarber(null);
    setImagePreview(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // For working days checkbox handling
    if (name.startsWith('workingDay_')) {
      const day = name.split('_')[1];
      setFormData(prev => ({
        ...prev,
        workingDays: {
          ...prev.workingDays,
          [day]: checked
        }
      }));
      return;
    }

    // For working hours
    if (name === 'startTime' || name === 'endTime') {
      const hourType = name === 'startTime' ? 'start' : 'end';
      setFormData(prev => ({
        ...prev,
        workingHours: {
          ...prev.workingHours,
          [hourType]: value
        }
      }));
      return;
    }

    // For regular inputs
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear errors when user fixes them
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      const newExpertise = expertiseInput.trim();
      if (!formData.expertise.includes(newExpertise)) {
        setFormData({
          ...formData,
          expertise: [...formData.expertise, newExpertise]
        });
      }
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (index) => {
    const updatedExpertise = formData.expertise.filter((_, i) => i !== index);
    setFormData({ ...formData, expertise: updatedExpertise });
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Barber name is required';
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (formData.expertise.length === 0) errors.expertise = 'At least one expertise is required';
    
    // Thay đổi validation cho imageUrl
    if (!formData.imageUrl.trim()) errors.imageUrl = 'Profile image URL is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      let response;
      let message;
      
      if (editingBarber) {
        response = await staffBarberService.updateBarber(editingBarber._id, formData);
        message = 'Barber updated successfully';
        
        // Update barbers list
        setBarbers(barbers.map(barber => 
          barber._id === editingBarber._id ? response.data : barber
        ));
      } else {
        response = await staffBarberService.createBarber(formData);
        message = 'Barber created successfully';
        
        // Add new barber to list
        setBarbers([...barbers, response.data]);
      }
      
      alert(message);
      closeModal();
    } catch (err) {
      console.error('Error saving barber:', err);
      setFormErrors({ submit: err.message || 'Failed to save barber data' });
    }
  };

  const handleToggleStatus = async (barber) => {
    try {
      const newStatus = !barber.is_active;
      await staffBarberService.toggleBarberStatus(barber._id, newStatus);
      
      // Update barbers list with new status
      setBarbers(barbers.map(b => 
        b._id === barber._id ? { ...b, is_active: newStatus } : b
      ));
    } catch (err) {
      console.error('Error toggling barber status:', err);
      alert('Failed to update barber status. Please try again.');
    }
  };

  const handleDeleteBarber = async (id) => {
    if (window.confirm('Are you sure you want to delete this barber? This action cannot be undone.')) {
      try {
        await staffBarberService.deleteBarber(id);
        setBarbers(barbers.filter(barber => barber._id !== id));
        alert('Barber deleted successfully');
      } catch (err) {
        console.error('Error deleting barber:', err);
        alert('Failed to delete barber. Please try again.');
      }
    }
  };

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Barbers</h2>
        <button className="btn btn-primary" onClick={openAddModal}>
          <i className="fas fa-plus me-1"></i> Add New Barber
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : barbers.length === 0 ? (
        <div className="alert alert-info">No barbers found. Add your first barber!</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {barbers.map(barber => (
            <div key={barber._id} className="col">
              <div className="card h-100">
                <div className="position-relative">
                  <img
                    src={barber.imgURL || 'https://via.placeholder.com/300x300?text=No+Image'}
                    className="card-img-top"
                    alt={barber.name}
                    style={{ height: '250px', objectFit: 'contain' }}
                  />
                  <span 
                    className={`position-absolute top-0 end-0 badge ${barber.is_active ? 'bg-success' : 'bg-danger'} mt-2 me-2`}
                  >
                    {barber.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{barber.name}</h5>
                  <h6 className="card-subtitle mb-2 text-muted">
                    {barber.title || barber.specialization || 'Barber'}
                  </h6>
                  <p className="card-text small mb-2">
                    {barber.description?.substring(0, 100)}
                    {barber.description?.length > 100 ? '...' : ''}
                  </p>
                  
                  {barber.expertise && barber.expertise.length > 0 && (
                    <>
                      <small className="text-muted d-block mb-1">Expertise:</small>
                      <div className="mb-3">
                        {barber.expertise.slice(0, 3).map((skill, i) => (
                          <span key={i} className="badge bg-light text-dark me-1 mb-1">{skill}</span>
                        ))}
                        {barber.expertise.length > 3 && (
                          <span className="badge bg-light text-dark">+{barber.expertise.length - 3} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="card-footer bg-transparent">
                  <div className="btn-group btn-group-sm w-100">
                    <button 
                      className="btn btn-outline-primary" 
                      onClick={() => openEditModal(barber)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      className="btn btn-outline-danger" 
                      onClick={() => handleDeleteBarber(barber._id)}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                    <button 
                      className={`btn ${barber.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`} 
                      onClick={() => handleToggleStatus(barber)}
                      title={barber.is_active ? 'Deactivate barber' : 'Activate barber'}
                    >
                      <i className={`fas fa-${barber.is_active ? 'power-off' : 'check'}`}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barber Form Modal */}
      {isModalOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" style={{zIndex: 1050}}> 
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingBarber ? 'Edit Barber' : 'Add New Barber'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {formErrors.submit && (
                    <div className="alert alert-danger">{formErrors.submit}</div>
                  )}
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="name" className="form-label">Name *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="title" className="form-label">Title *</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.title ? 'is-invalid' : ''}`}
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.title && <div className="invalid-feedback">{formErrors.title}</div>}
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">Email *</label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="phone" className="form-label">Phone *</label>
                      <input
                        type="tel"
                        className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="specialization" className="form-label">Specialization</label>
                    <input
                      type="text"
                      className="form-control"
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="E.g., Beard Specialist, Color Expert, etc."
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Description *</label>
                    <textarea
                      className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      required
                    ></textarea>
                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                  </div>
                  
                  {/* Expertise Section */}
                  <div className="mb-3">
                    <label className="form-label">Expertise *</label>
                    <div className="input-group mb-2">
                      <input
                        type="text"
                        className={`form-control ${formErrors.expertise ? 'is-invalid' : ''}`}
                        placeholder="Add expertise (e.g., Classic Cuts, Beard Trim)"
                        value={expertiseInput}
                        onChange={(e) => setExpertiseInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddExpertise();
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleAddExpertise}
                      >
                        <i className="fas fa-plus"></i> Add
                      </button>
                    </div>
                    {formErrors.expertise && <div className="text-danger small">{formErrors.expertise}</div>}
                    
                    <div className="mb-3">
                      {formData.expertise.map((skill, index) => (
                        <div key={index} className="badge bg-primary me-2 mb-2 py-2 px-3">
                          {skill}
                          <button
                            type="button"
                            className="btn-close btn-close-white ms-2"
                            style={{ fontSize: '0.5rem' }}
                            onClick={() => handleRemoveExpertise(index)}
                          ></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="mb-3">
                    <label htmlFor="imageUrl" className="form-label">
                      Profile Image URL *
                    </label>
                    <input
                      type="text"
                      className={`form-control ${formErrors.imageUrl ? 'is-invalid' : ''}`}
                      id="imageUrl"
                      name="imageUrl"
                      value={formData.imageUrl}
                      onChange={handleImageUrlChange}
                      required
                    />
                    {formErrors.imageUrl && <div className="invalid-feedback">{formErrors.imageUrl}</div>}
                    
                    <div className="mt-2" style={{ maxHeight: '200px', overflow: 'hidden' }}>
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Barber preview"
                          className="img-thumbnail"
                          style={{ maxHeight: '150px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150x150?text=Invalid+Image+URL';
                          }}
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Working Days & Hours */}
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Working Days</label>
                      {weekdays.map((day) => (
                        <div key={day} className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`workingDay_${day}`}
                            name={`workingDay_${day}`}
                            checked={formData.workingDays[day]}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor={`workingDay_${day}`}>
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </label>
                        </div>
                      ))}
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Working Hours</label>
                      <div className="input-group mb-2">
                        <span className="input-group-text">Start</span>
                        <input
                          type="time"
                          className="form-control"
                          name="startTime"
                          value={formData.workingHours.start}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="input-group">
                        <span className="input-group-text">End</span>
                        <input
                          type="time"
                          className="form-control"
                          name="endTime"
                          value={formData.workingHours.end}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Active Status */}
                  {editingBarber && (
                    <div className="form-check mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active
                      </label>
                    </div>
                  )}
                </div>
                <div className="modal-footer" style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingBarber ? 'Update Barber' : 'Add Barber'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
};

export default StaffBarbers;