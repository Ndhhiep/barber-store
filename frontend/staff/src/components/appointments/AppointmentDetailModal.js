import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatTimeSlot } from '../../utils/formatters';

/**
 * AppointmentDetailModal — read-only view of appointment details + status actions.
 *
 * Props:
 *   appointment      {object}    - normalized appointment data
 *   isOpen           {boolean}
 *   availableServices {Array}
 *   onClose          {Function}
 *   onStatusUpdate   {Function}  - (id, newStatus) => void
 */

/** Resolve service name from service object/ID/name field */
const resolveServiceNames = (appointment, availableServices) => {
  if (appointment.services && Array.isArray(appointment.services) && appointment.services.length > 0) {
    return appointment.services.map(service => {
      if (typeof service === 'object' && service !== null) {
        if (service.name) return service.name;
        if (service._id) {
          const found = availableServices.find(s => s._id === service._id);
          return found ? found.name : 'Unknown Service';
        }
      }
      if (typeof service === 'string') {
        const found = availableServices.find(s => s._id === service);
        return found ? found.name : 'Unknown Service';
      }
      return 'Service Information Unavailable';
    });
  }
  if (appointment.serviceName && appointment.serviceName !== 'N/A') {
    return [appointment.serviceName];
  }
  if (appointment.service && appointment.service !== 'N/A') {
    if (typeof appointment.service === 'object' && appointment.service !== null) {
      return [appointment.service.name || 'Service Information Unavailable'];
    }
    return [appointment.service];
  }
  return null;
};

const AppointmentDetailModal = ({
  appointment,
  isOpen,
  availableServices = [],
  onClose,
  onStatusUpdate,
}) => {
  if (!isOpen || !appointment) return null;

  const serviceNames = resolveServiceNames(appointment, availableServices);
  const { status } = appointment;
  const canModify = status === 'pending' || status === 'confirmed';

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
              <h5 className="modal-title">Appointment Details</h5>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
              {/* Customer Info */}
              <h5 className="mb-3"><i className="bi bi-person-circle me-2"></i>Customer Information</h5>
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row mb-1">
                    <div className="col-3 fw-bold">Name:</div>
                    <div className="col-9">{appointment.userName || appointment.name || 'N/A'}</div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-3 fw-bold">Email:</div>
                    <div className="col-9">{appointment.userEmail || appointment.email || 'N/A'}</div>
                  </div>
                  <div className="row">
                    <div className="col-3 fw-bold">Phone:</div>
                    <div className="col-9">{appointment.userPhone || appointment.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Appointment Info */}
              <h5 className="mb-3"><i className="bi bi-calendar-event me-2"></i>Appointment Information</h5>
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row mb-1">
                    <div className="col-3 fw-bold">Service:</div>
                    <div className="col-9">
                      {serviceNames ? (
                        <ul className="list-unstyled mb-0">
                          {serviceNames.map((name, idx) => (
                            <li key={idx} className="mb-1">
                              <i className="bi bi-scissors me-2"></i>{name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-muted">No service information available</span>
                      )}
                    </div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-3 fw-bold">Barber:</div>
                    <div className="col-9">{appointment.barberName || 'Any Available'}</div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-3 fw-bold">Date:</div>
                    <div className="col-9">{formatDate(appointment.date)}</div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-3 fw-bold">Time:</div>
                    <div className="col-9">{formatTimeSlot(appointment.time)}</div>
                  </div>
                  <div className="row">
                    <div className="col-3 fw-bold">Status:</div>
                    <div className="col-9">
                      <StatusBadge status={appointment.status} type="booking" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <h5 className="mb-3"><i className="bi bi-card-text me-2"></i>Notes</h5>
              <div className="card mb-4">
                <div className="card-body">
                  <p className="p-3 bg-light rounded">{appointment.notes || 'No notes'}</p>
                </div>
              </div>
            </div>

            {/* Status Action Buttons */}
            <div className="row mb-4 px-3">
              <div className="col-12">
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {status === 'pending' && (
                    <button
                      className="btn btn-success"
                      onClick={() => onStatusUpdate(appointment._id, 'confirmed')}
                    >
                      <i className="bi bi-check-circle me-2"></i>Confirm Appointment
                    </button>
                  )}
                  {status === 'confirmed' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => onStatusUpdate(appointment._id, 'completed')}
                    >
                      <i className="bi bi-check-square me-2"></i>Mark as Completed
                    </button>
                  )}
                  {canModify && (
                    <button
                      className="btn btn-danger"
                      onClick={() => onStatusUpdate(appointment._id, 'cancelled')}
                    >
                      <i className="bi bi-x-circle me-2"></i>Cancel Appointment
                    </button>
                  )}
                  {!canModify && (
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      This appointment is {status} and cannot be modified further.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ flex: '0 0 auto', backgroundColor: 'white' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentDetailModal;
