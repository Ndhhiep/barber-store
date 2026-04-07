import React, { useState, useEffect, useCallback } from 'react';
import staffBarberService from '../services/staffBarberService';
import { validateImageFile, diagnoseImageUploadIssue } from '../utils/imageUtils';
import useSuccessMessage from '../hooks/useSuccessMessage';
import useDeleteConfirm from '../hooks/useDeleteConfirm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import SuccessToast from '../components/common/SuccessToast';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import BarberFormModal from '../components/barbers/BarberFormModal';

const EMPTY_FORM = {
  name: '', description: '', specialization: '',
  imageUrl: '', imageFile: null,
  email: '', phone: '', is_active: true,
  workingDays: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: true, sunday: false },
  workingHours: { start: '09:00', end: '18:00' },
};

/** Normalize barber to ensure both imgURL and image_url are set */
const normalizeBarber = (barber) => {
  if (!barber) return barber;
  const b = { ...barber };
  if (b.imgURL && !b.image_url) b.image_url = b.imgURL;
  else if (b.image_url && !b.imgURL) b.imgURL = b.image_url;
  return b;
};

const StaffBarbers = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingBarber, setEditingBarber] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { message: successMessage, showSuccess, clearMessage } = useSuccessMessage(3000);
  const deleteConfirm = useDeleteConfirm(
    (id) => staffBarberService.deleteBarber(id),
    () => {
      setBarbers(prev => prev.filter(b => b._id !== deleteConfirm.itemToDelete));
      showSuccess('Barber deleted successfully!');
    }
  );

  const fetchBarbers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffBarberService.getAllBarbersForStaff();
      let list = [];
      if (response?.success && Array.isArray(response.data?.barbers)) list = response.data.barbers;
      else if (Array.isArray(response?.data)) list = response.data;
      else if (Array.isArray(response)) list = response;
      setBarbers(list.map(normalizeBarber));
      setError(null);
    } catch (err) {
      console.error('Error fetching barbers:', err.message);
      setError('Failed to load barbers. Please try again later.');
      setBarbers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBarbers(); }, [fetchBarbers]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setFormErrors(prev => ({ ...prev, image: validation.message })); return; }
    setFormErrors(prev => ({ ...prev, image: null }));
    setFormData(prev => ({ ...prev, imageFile: file, imageUrl: '' }));
    setImagePreview(URL.createObjectURL(file));
  };

  const openAddModal = () => {
    setEditingBarber(null);
    setFormData(EMPTY_FORM);
    setImagePreview(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name || '', description: barber.description || '',
      specialization: barber.specialization || '',
      imageUrl: barber.imgURL || barber.image_url || '', imageFile: null,
      email: barber.email || '', phone: barber.phone || '',
      is_active: barber.is_active !== undefined ? barber.is_active : true,
      workingDays: barber.workingDays || EMPTY_FORM.workingDays,
      workingHours: barber.workingHours || EMPTY_FORM.workingHours,
    });
    setImagePreview(barber.imgURL || barber.image_url || null);
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
    if (name.startsWith('workingDay_')) {
      const day = name.split('_')[1];
      setFormData(prev => ({ ...prev, workingDays: { ...prev.workingDays, [day]: checked } }));
      return;
    }
    if (name === 'startTime' || name === 'endTime') {
      setFormData(prev => ({ ...prev, workingHours: { ...prev.workingHours, [name === 'startTime' ? 'start' : 'end']: value } }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const testImagePreview = (url) =>
    new Promise(resolve => { const img = new Image(); img.onload = () => resolve(true); img.onerror = () => resolve(false); img.src = url; });

  const validateForm = async () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Barber name is required';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.imageFile && !formData.imageUrl.trim()) {
      errors.image = 'Barber image is required';
    } else if (!formData.imageFile && formData.imageUrl.trim()) {
      const valid = await testImagePreview(formData.imageUrl);
      if (!valid) errors.image = 'The existing image URL is invalid. Please upload a new image.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isValid = await validateForm();
    if (!isValid) { setIsLoading(false); return; }

    try {
      let barberData;
      if (editingBarber) {
        const response = await staffBarberService.updateBarber(editingBarber._id, formData);
        const raw = response.data?.data || response.data;
        barberData = normalizeBarber(raw);
        setBarbers(prev => prev.map(b => b._id === editingBarber._id ? barberData : b));
        showSuccess('Barber updated successfully!');
      } else {
        const response = await staffBarberService.createBarber(formData);
        const raw = response.data?.data || response.data;
        barberData = normalizeBarber(raw);
        setBarbers(prev => [...prev, barberData]);
        showSuccess('New barber added successfully!');
      }
      closeModal();
    } catch (err) {
      console.error('Error saving barber:', err);
      let errorMessage = err.message || 'Failed to save barber data';
      if (errorMessage.includes('image') || errorMessage.includes('upload') || errorMessage.includes('CLOUDINARY')) {
        const diagnosticMessage = diagnoseImageUploadIssue(err);
        setFormErrors({ submit: errorMessage, image: diagnosticMessage || 'Error uploading image.' });
        if (errorMessage.includes('Cloudinary') || errorMessage.includes('CLOUDINARY')) {
          staffBarberService.checkCloudinaryStatus()
            .then(r => { if (!r.success) setFormErrors(p => ({ ...p, submit: `Image service unavailable: ${r.message}.` })); })
            .catch(e => console.error('Could not check Cloudinary status:', e));
        }
      } else {
        setFormErrors({ submit: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Barbers</h2>
        <button className="btn btn-success" onClick={openAddModal}>
          <i className="bi bi-plus-circle me-1"></i> Add New Barber
        </button>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner />
      ) : barbers.length === 0 ? (
        <EmptyState message="No barbers found. Add your first barber!" icon="bi-scissors" />
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {barbers.map(barber => (
            <div key={barber._id} className="col">
              <div className="card h-100">
                <div className="position-relative">
                  <img
                    src={barber.imgURL || barber.image_url || 'https://via.placeholder.com/300x300?text=No+Image'}
                    className="card-img-top" alt={barber.name}
                    style={{ height: '250px', objectFit: 'contain' }}
                  />
                  <span className={`position-absolute top-0 end-0 badge ${barber.is_active ? 'bg-success' : 'bg-danger'} mt-2 me-2`}>
                    {barber.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="card-body">
                  <h5 className="card-title">{barber.name}</h5>
                  {barber.specialization && (
                    <div className="mb-3 mt-2">
                      {barber.specialization.split(',').map((sp, i) => (
                        <span key={i} className="me-1 mb-1 px-2 py-0 rounded-pill d-inline-block border" style={{ fontSize: '0.7rem' }}>
                          {sp.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="card-text small mb-2">
                    {barber.description?.substring(0, 100)}{barber.description?.length > 100 ? '...' : ''}
                  </p>
                </div>
                <div className="card-footer bg-transparent">
                  <div className="btn-group btn-group-sm w-100">
                    <button className="btn btn-primary" onClick={() => openEditModal(barber)}>
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteConfirm.openDelete(barber._id, barber.name)}>
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
      <BarberFormModal
        isOpen={isModalOpen}
        editMode={!!editingBarber}
        formData={formData}
        imagePreview={imagePreview}
        formErrors={formErrors}
        isLoading={isLoading}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onImageChange={handleImageChange}
        onStatusChange={(val) => setFormData(prev => ({ ...prev, is_active: val === 'Active' }))}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        entityName="barber"
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

export default StaffBarbers;