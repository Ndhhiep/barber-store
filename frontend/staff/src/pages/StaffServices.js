import React, { useState, useEffect } from 'react';
import staffService from '../services/staffService';

const StaffServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [editingService, setEditingService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    isActive: true
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await staffService.getAllServices();
      setServices(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      isActive: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price,
      description: service.description,
      isActive: service.isActive !== undefined ? service.isActive : true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Xóa lỗi khi user sửa
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Service name is required';
    }
    
    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || Number(formData.price) < 0) {
      errors.price = 'Price must be a positive number';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const serviceData = {
      name: formData.name,
      price: Number(formData.price),
      description: formData.description,
      isActive: formData.isActive
    };
    
    try {
      if (editingService) {
        await staffService.updateService(editingService._id, serviceData);
        setServices(services.map(s => 
          s._id === editingService._id ? { ...s, ...serviceData } : s
        ));
      } else {
        const response = await staffService.createService(serviceData);
        setServices([...services, response.data]);
      }
      closeModal();
    } catch (err) {
      console.error('Error saving service:', err);
      setFormErrors(prev => ({ 
        ...prev, 
        submit: err.message || 'Failed to save service. Please try again.' 
      }));
    }
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await staffService.deleteService(id);
        setServices(services.filter(service => service._id !== id));
      } catch (err) {
        console.error('Error deleting service:', err);
        alert('Failed to delete service. Please try again.');
      }
    }
  };

  
  return (
    <div className="container mt-4">      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Services</h2>
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add New Service
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center my-3">
              <div className="spinner-border" role="status"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(service => (
                    <tr key={service._id}>
                      <td>{service.name}</td>
                      <td>${service.price}</td>
                      <td>
                        {service.description.length > 50 
                          ? `${service.description.substring(0, 50)}...` 
                          : service.description}
                      </td>
                      <td>
                        <span className={`badge bg-${service.isActive ? 'success' : 'danger'}`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>                      <td>
                        <div className="btn-group" role="group">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openEditModal(service)}
                            title="Edit Service"
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteService(service._id)}
                            title="Delete Service"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center">No services found. Create your first service!</p>
          )}
        </div>
      </div>

      {/* Service Modal */}
      {isModalOpen && (
        <>
          <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }}></div>          <div className="modal show d-block" tabIndex="-1" style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 2000, 
            overflow: 'auto', 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'center',
            paddingTop: '120px'
          }}>            <div className="modal-dialog" style={{ 
              margin: '0 auto', 
              zIndex: 2010, 
              width: '100%', 
              maxWidth: '500px',
              position: 'relative'
            }}>
              <div className="modal-content">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header">
                    <h5 className="modal-title">
                      {editingService ? 'Edit Service' : 'Add New Service'}
                    </h5>
                    <button type="button" className="btn-close" onClick={closeModal}></button>
                  </div>
                
                  <div className="modal-body">
                    {formErrors.submit && (
                      <div className="alert alert-danger">{formErrors.submit}</div>
                    )}
                    
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label fw-bold">Service Name:</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback">{formErrors.name}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="price" className="form-label fw-bold">Price (USD):</label>
                      <input
                        type="number"
                        className={`form-control ${formErrors.price ? 'is-invalid' : ''}`}
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        min="0"
                        required
                      />
                      {formErrors.price && (
                        <div className="invalid-feedback">{formErrors.price}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label fw-bold">Description:</label>
                      <textarea
                        className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        required
                      ></textarea>
                      {formErrors.description && (
                        <div className="invalid-feedback">{formErrors.description}</div>
                      )}
                    </div>

                    {editingService && (
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                        />
                        <label className="form-check-label fw-bold" htmlFor="isActive">Active</label>
                      </div>
                    )}
                  </div>
                  
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingService ? 'Update Service' : 'Create Service'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffServices;