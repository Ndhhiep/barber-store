import React, { useState, useEffect } from 'react';
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
    description: '',
    specialization: '',
    imageUrl: '', // Vẫn giữ để hiển thị hình ảnh có sẵn
    imageFile: null, // Trường mới để tải lên tệp
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

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      setLoading(true);
      const response = await staffBarberService.getAllBarbersForStaff();
      
      // Xử lý dữ liệu đơn giản với ghi log tối thiểu
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
      setBarbers([]); // Đảm bảo barbers luôn là mảng, kể cả khi có lỗi
    } finally {
      setLoading(false);
    }
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Selected file:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
      
      // Lưu tệp vào formData
      setFormData(prev => ({ 
        ...prev, 
        imageFile: file,
        // Xóa imageUrl vì đang tải lên tệp mới
        imageUrl: '' 
      }));
      
      // Tạo URL xem trước cho ảnh được chọn
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };
  
  const openAddModal = () => {
    setEditingBarber(null);
    setFormData({
      name: '',
      description: '',
      specialization: '',
      imageUrl: '',
      imageFile: null,
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
    setFormErrors({});    setIsModalOpen(true);
  };
  
  const openEditModal = (barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name || '',
      description: barber.description || '',
      specialization: barber.specialization || '',
      imageUrl: barber.imgURL || barber.image_url || '',
      imageFile: null, // Reset image file khi chỉnh sửa
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
    if (barber.imgURL || barber.image_url) {
      setImagePreview(barber.imgURL || barber.image_url);
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

    // Xử lý checkbox ngày làm việc
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

    // Xử lý giờ làm việc
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

    // Xử lý các input thông thường
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
      // Xóa lỗi khi user sửa lại
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Các hàm thêm/bớt chuyên môn đã bị loại bỏ
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Barber name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    
    // Xác thực ảnh: cần imageFile hoặc imageUrl hiện có
    if (!formData.imageFile && !formData.imageUrl.trim()) {
      errors.image = 'Barber image is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      let response;
      
      // Hiển thị chỉ báo tải
      setFormErrors({ ...formErrors});
      
      if (editingBarber) {
        response = await staffBarberService.updateBarber(editingBarber._id, formData);
        // Cập nhật danh sách barbers
        setBarbers(barbers.map(barber => 
          barber._id === editingBarber._id ? response.data : barber
        ));
      } else {
        response = await staffBarberService.createBarber(formData);
        // Thêm barber mới vào danh sách
        setBarbers([...barbers, response.data]);
      }
      
      closeModal();
    } catch (err) {
      console.error('Error saving barber:', err);
      setFormErrors({ submit: err.message || 'Failed to save barber data' });
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
    }  };

  return (
    <div className="container mt-4">      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Barbers</h2>
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add New Barber
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
                    src={barber.imgURL || barber.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
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
                  {barber.specialization && (
                    <>
                      <div className="mb-3 mt-2">
                        {barber.specialization.split(',').map((specialty, i) => (
                          <span key={i} className="me-1 mb-1 px-2 py-0 rounded-pill d-inline-block border" style={{ fontSize: '0.7rem' }}>{specialty.trim()}</span>
                        ))}
                      </div>
                    </>
                  )}
                  <p className="card-text small mb-2">
                    {barber.description?.substring(0, 100)}
                    {barber.description?.length > 100 ? '...' : ''}
                  </p>
                  

                </div>
                <div className="card-footer bg-transparent">
                  <div className="btn-group btn-group-sm w-100">
                    <button 
                      className="btn btn-primary" 
                      onClick={() => openEditModal(barber)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleDeleteBarber(barber._id)}
                    >
                      <i className="fas fa-trash"></i> Delete
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
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" >
          <div className="modal-dialog modal-dialog-centered" style={{zIndex: 1050, maxWidth: '600px'}}> 
            <div className="modal-content">
              <div className="modal-header border-0">
                <h5 className="modal-title">{editingBarber ? 'Edit Barber' : 'Add New Barber'}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body pt-0" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {formErrors.submit && (
                    <div className="alert alert-danger">{formErrors.submit}</div>
                  )}
                  
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="name" className="form-label mb-1 fw-medium">Full Name</label>
                      <input
                        type="text"
                        className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter barber's full name"
                        required
                      />
                      {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="email" className="form-label mb-1 fw-medium">Email</label>
                      <input
                        type="email"
                        className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        required
                      />
                      {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label htmlFor="phone" className="form-label mb-1 fw-medium">Phone Number</label>
                      <input
                        type="tel"
                        className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                        required
                      />
                      {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label mb-1 fw-medium">Status</label>
                      <select 
                        className="form-select" 
                        name="is_active"
                        value={formData.is_active ? "Active" : "Inactive"}
                        onChange={(e) => setFormData({...formData, is_active: e.target.value === "Active" })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label mb-1 fw-medium">Email</label>
                    <input
                      type="email"
                      className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      required
                    />
                    {formErrors.email && <div className="invalid-feedback">{formErrors.email}</div>}
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="phone" className="form-label mb-1 fw-medium">Phone Number</label>
                    <input
                      type="tel"
                      className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                    />
                    {formErrors.phone && <div className="invalid-feedback">{formErrors.phone}</div>}
                  </div>
                    <div className="mb-3">
                    <label className="form-label mb-2 fw-medium">Specialties</label>
                    <div className="d-flex flex-wrap gap-2">
                      <div className="form-check form-check-inline mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="haircuts" 
                          name="haircuts" 
                          checked={formData.specialization?.includes('Haircuts')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = formData.specialization || '';
                            const specialties = current.split(',').map(s => s.trim()).filter(s => s !== '');
                            
                            if (checked && !specialties.includes('Haircuts')) {
                              specialties.push('Haircuts');
                            } else if (!checked) {
                              const index = specialties.indexOf('Haircuts');
                              if (index !== -1) specialties.splice(index, 1);
                            }
                            
                            setFormData({
                              ...formData,
                              specialization: specialties.join(', ')
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="haircuts">Haircuts</label>
                      </div>
                      <div className="form-check form-check-inline mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="beardTrim" 
                          name="beardTrim" 
                          checked={formData.specialization?.includes('Beard Trim')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = formData.specialization || '';
                            const specialties = current.split(',').map(s => s.trim()).filter(s => s !== '');
                            
                            if (checked && !specialties.includes('Beard Trim')) {
                              specialties.push('Beard Trim');
                            } else if (!checked) {
                              const index = specialties.indexOf('Beard Trim');
                              if (index !== -1) specialties.splice(index, 1);
                            }
                            
                            setFormData({
                              ...formData,
                              specialization: specialties.join(', ')
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="beardTrim">Beard Trim</label>
                      </div>
                      <div className="form-check form-check-inline mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="shaving" 
                          name="shaving" 
                          checked={formData.specialization?.includes('Shaving')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = formData.specialization || '';
                            const specialties = current.split(',').map(s => s.trim()).filter(s => s !== '');
                            
                            if (checked && !specialties.includes('Shaving')) {
                              specialties.push('Shaving');
                            } else if (!checked) {
                              const index = specialties.indexOf('Shaving');
                              if (index !== -1) specialties.splice(index, 1);
                            }
                            
                            setFormData({
                              ...formData,
                              specialization: specialties.join(', ')
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="shaving">Shaving</label>
                      </div>
                      <div className="form-check form-check-inline mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="hairColoring" 
                          name="hairColoring" 
                          checked={formData.specialization?.includes('Hair Coloring')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = formData.specialization || '';
                            const specialties = current.split(',').map(s => s.trim()).filter(s => s !== '');
                            
                            if (checked && !specialties.includes('Hair Coloring')) {
                              specialties.push('Hair Coloring');
                            } else if (!checked) {
                              const index = specialties.indexOf('Hair Coloring');
                              if (index !== -1) specialties.splice(index, 1);
                            }
                            
                            setFormData({
                              ...formData,
                              specialization: specialties.join(', ')
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="hairColoring">Hair Coloring</label>
                      </div>
                      <div className="form-check form-check-inline mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="styling" 
                          name="styling" 
                          checked={formData.specialization?.includes('Styling')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = formData.specialization || '';
                            const specialties = current.split(',').map(s => s.trim()).filter(s => s !== '');
                            
                            if (checked && !specialties.includes('Styling')) {
                              specialties.push('Styling');
                            } else if (!checked) {
                              const index = specialties.indexOf('Styling');
                              if (index !== -1) specialties.splice(index, 1);
                            }
                            
                            setFormData({
                              ...formData,
                              specialization: specialties.join(', ')
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="styling">Styling</label>
                      </div>
                      <div className="form-check form-check-inline mb-2">
                        <input 
                          className="form-check-input" 
                          type="checkbox" 
                          id="skinFade" 
                          name="skinFade" 
                          checked={formData.specialization?.includes('Skin Fade')}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const current = formData.specialization || '';
                            const specialties = current.split(',').map(s => s.trim()).filter(s => s !== '');
                            
                            if (checked && !specialties.includes('Skin Fade')) {
                              specialties.push('Skin Fade');
                            } else if (!checked) {
                              const index = specialties.indexOf('Skin Fade');
                              if (index !== -1) specialties.splice(index, 1);
                            }
                            
                            setFormData({
                              ...formData,
                              specialization: specialties.join(', ')
                            });
                          }}
                        />
                        <label className="form-check-label" htmlFor="skinFade">Skin Fade</label>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="description" className="form-label mb-1 fw-medium">Bio/Description</label>
                    <textarea
                      className={`form-control ${formErrors.description ? 'is-invalid' : ''}`}
                      id="description"
                      name="description"
                      rows="3"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter barber's bio, experience, and specialties"
                      required
                    ></textarea>
                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                  </div>

                  {/* Image Upload */}
                  <div className="mb-3">
                    <label htmlFor="imageFile" className="form-label mb-1 fw-medium">Profile Photo</label>
                    
                    <div className="border border-1 border-dashed rounded-3 p-3 text-center position-relative" style={{ cursor: 'pointer' }}>
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Barber preview"
                          className="img-fluid"
                          style={{ maxHeight: '150px', objectFit: 'contain' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/150x150?text=Invalid+Image';
                          }}
                        />
                      ) : (
                        <div className="py-4 text-muted">
                          <div className="mb-2">
                            <i className="fas fa-cloud-upload-alt fa-2x"></i>
                          </div>
                          <div>Drag and drop an image, or click to browse</div>
                          <div className="small text-secondary mt-1">PNG, JPG or WEBP (max. 2MB)</div>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        className="position-absolute top-0 start-0 w-100 h-100 opacity-0"
                        style={{ cursor: 'pointer' }}
                        id="imageFile"
                        name="imageFile"
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                    </div>
                    {formErrors.image && <div className="text-danger small mt-1">{formErrors.image}</div>}
                  </div>
                </div>
                
                <div className="modal-footer border-0 justify-content-end pt-1">
                  <button type="button" className="btn btn-sm btn-light" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-sm btn-primary">
                    {editingBarber ? 'Save Barber' : 'Add Barber'}
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