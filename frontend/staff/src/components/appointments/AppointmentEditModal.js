import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import TimeSlotSelector from './TimeSlotSelector';

/**
 * AppointmentEditModal — form to edit an existing appointment.
 *
 * Props:
 *   isOpen              {boolean}
 *   formData            {object}  - {customerName, customerPhone, customerEmail, services, barberId, date, time, notes}
 *   formErrors          {object}
 *   availableServices   {Array}
 *   availableBarbers    {Array}
 *   timeSlots           {string[]}
 *   timeSlotStatuses    {Array}
 *   isLoadingTimeSlots  {boolean}
 *   showServiceSelector {boolean}
 *   totalDuration       {number}
 *   onClose             {Function}
 *   onSubmit            {Function}  - (e) => void
 *   onFormChange        {Function}  - (field, value) => void
 *   onServiceAdd        {Function}  - (serviceId) => void
 *   onServiceRemove     {Function}  - (serviceId) => void
 *   onToggleServiceSelector {Function}
 *   onTimeSelect        {Function}  - (time) => void
 *   isSlotDisabled      {Function}  - (time) => boolean
 *   getDisabledReason   {Function}  - (time) => string
 *   calculateEndTime    {Function}  - (startTime, duration) => string
 */
const AppointmentEditModal = ({
  isOpen,
  formData,
  formErrors = {},
  availableServices = [],
  availableBarbers = [],
  timeSlots = [],
  timeSlotStatuses = [],
  isLoadingTimeSlots = false,
  showServiceSelector = false,
  totalDuration = 0,
  onClose,
  onSubmit,
  onFormChange,
  onServiceAdd,
  onServiceRemove,
  onToggleServiceSelector,
  onTimeSelect,
  isSlotDisabled,
  getDisabledReason,
  calculateEndTime,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        onClick={onClose}
      ></div>
      <div
        className="modal fade show"
        style={{ display: 'block', paddingRight: '15px', paddingLeft: '15px', zIndex: 1050, overflow: 'hidden' }}
        tabIndex="-1"
      >
        <div className="modal-dialog modal-lg" style={{ margin: '5rem auto 1.75rem', display: 'flex', alignItems: 'flex-start', height: '80vh' }}>
          <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '80vh' }}>
            <div className="modal-header" style={{ flex: '0 0 auto' }}>
              <h5 className="modal-title">Edit Appointment</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close"></button>
            </div>

            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
                {/* Customer Info */}
                <h6 className="mb-3"><i className="bi bi-person-circle me-2"></i>Customer Information</h6>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="editCustomerName" className="form-label">Customer Name <span className="text-danger">*</span></label>
                    <input
                      type="text" id="editCustomerName"
                      className={`form-control ${formErrors.customerName ? 'is-invalid' : ''}`}
                      value={formData.customerName}
                      onChange={(e) => onFormChange('customerName', e.target.value)}
                      placeholder="Enter customer name"
                    />
                    {formErrors.customerName && <div className="invalid-feedback">{formErrors.customerName}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="editCustomerPhone" className="form-label">Phone Number <span className="text-danger">*</span></label>
                    <input
                      type="tel" id="editCustomerPhone"
                      className={`form-control ${formErrors.customerPhone ? 'is-invalid' : ''}`}
                      value={formData.customerPhone}
                      onChange={(e) => onFormChange('customerPhone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                    {formErrors.customerPhone && <div className="invalid-feedback">{formErrors.customerPhone}</div>}
                  </div>
                </div>

                <div className="row mb-4">
                  <div className="col-12">
                    <label htmlFor="editCustomerEmail" className="form-label">Email Address (Optional)</label>
                    <input
                      type="email" id="editCustomerEmail"
                      className={`form-control ${formErrors.customerEmail ? 'is-invalid' : ''}`}
                      value={formData.customerEmail}
                      onChange={(e) => onFormChange('customerEmail', e.target.value)}
                      placeholder="Enter email address"
                    />
                    {formErrors.customerEmail && <div className="invalid-feedback">{formErrors.customerEmail}</div>}
                  </div>
                </div>

                {/* Appointment Details */}
                <h6 className="mb-3"><i className="bi bi-calendar-event me-2"></i>Appointment Details</h6>

                {/* Services */}
                <div className="row mb-3">
                  <div className="col-12">
                    <label className="form-label">Services <span className="text-danger">*</span></label>

                    {/* Selected Services */}
                    <div className={`border rounded p-3 mb-3 ${formErrors.services ? 'border-danger' : ''}`}>
                      {formData.services.length > 0 ? (
                        <div>
                          <h6 className="mb-3">Selected Services:</h6>
                          {formData.services.map(serviceId => {
                            const service = availableServices.find(s => s._id === serviceId);
                            return (
                              <div key={serviceId} className="mb-2 w-100">
                                <div className="selected-service-item d-flex align-items-center justify-content-between bg-light rounded p-3">
                                  <div className="service-info">
                                    <strong>{service?.name || 'Unknown Service'}</strong>
                                    {service && (
                                      <div className="text-muted small mt-1">
                                        ${service.price} - {service.duration || 30}min
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button" className="btn btn-sm btn-outline-danger"
                                    onClick={() => onServiceRemove(serviceId)} title="Remove service"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <i className="bi bi-scissors text-muted" style={{ fontSize: '2rem' }}></i>
                          <p className="text-muted mb-0 mt-2">No services selected</p>
                        </div>
                      )}
                    </div>

                    {/* Add Service */}
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <button type="button" className="btn btn-outline-primary" onClick={onToggleServiceSelector}>
                        <i className="bi bi-plus-circle me-2"></i>Add Service
                      </button>
                    </div>

                    {/* Service Selector Dropdown */}
                    {showServiceSelector && (
                      <div className="border rounded p-3 mb-3 bg-light">
                        <h6 className="mb-3">Available Services:</h6>
                        {availableServices.filter(s => !formData.services.includes(s._id)).length > 0 ? (
                          availableServices
                            .filter(s => !formData.services.includes(s._id))
                            .map(service => (
                              <div key={service._id} className="mb-2">
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary w-100 text-start p-3"
                                  onClick={() => onServiceAdd(service._id)}
                                >
                                  <strong>{service.name}</strong>
                                  <div className="text-muted small mt-1">${service.price} - {service.duration || 30}min</div>
                                </button>
                              </div>
                            ))
                        ) : (
                          <p className="text-muted mb-0">
                            {availableServices.length === 0 ? 'No services available' : 'All available services have been selected'}
                          </p>
                        )}
                      </div>
                    )}

                    {formErrors.services && <div className="text-danger mt-1">{formErrors.services}</div>}
                  </div>
                </div>

                {/* Barber + Date */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label htmlFor="editBarberId" className="form-label">Preferred Barber</label>
                    <select
                      className="form-select" id="editBarberId"
                      value={formData.barberId}
                      onChange={(e) => onFormChange('barberId', e.target.value)}
                    >
                      <option value="">Any Available</option>
                      {availableBarbers.map(barber => (
                        <option key={barber._id} value={barber._id}>{barber.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="editAppointmentDate" className="form-label">Date <span className="text-danger">*</span></label>
                    <DatePicker
                      selected={formData.date}
                      onChange={(date) => onFormChange('date', date)}
                      className={`form-control ${formErrors.date ? 'is-invalid' : ''}`}
                      placeholderText="Select date"
                      dateFormat="dd/MM/yyyy"
                      minDate={new Date()}
                      id="editAppointmentDate"
                    />
                    {formErrors.date && <div className="text-danger mt-1">{formErrors.date}</div>}
                  </div>
                </div>

                {/* Time Slot Selector */}
                <div className="row mb-3">
                  <div className="col-12 px-0">
                    <label htmlFor="editAppointmentTime" className="form-label fw-bold">
                      <i className="bi bi-clock me-2"></i>Available Time Slots <span className="text-danger">*</span>
                    </label>
                    <input type="hidden" id="editAppointmentTime" name="time" value={formData.time} required />
                    <TimeSlotSelector
                      timeSlots={timeSlots}
                      timeSlotStatuses={timeSlotStatuses}
                      selectedTime={formData.time}
                      selectedDate={formData.date}
                      barberId={formData.barberId}
                      totalDuration={totalDuration}
                      isLoading={isLoadingTimeSlots}
                      formErrors={formErrors}
                      onTimeSelect={onTimeSelect}
                      isSlotDisabled={isSlotDisabled}
                      getDisabledReason={getDisabledReason}
                      calculateEndTime={calculateEndTime}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="row mb-3">
                  <div className="col-12">
                    <label htmlFor="editNotes" className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-control" id="editNotes" rows="3"
                      value={formData.notes}
                      onChange={(e) => onFormChange('notes', e.target.value)}
                      placeholder="Any additional notes or special requests..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ flex: '0 0 auto', backgroundColor: 'white' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  <i className="bi bi-check-circle me-2"></i>Update Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentEditModal;
