import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/modal-fix.css';
import '../css/BookingConfirmedModal.css';

// Add custom styles to ensure vertical centering
const modalStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%'
};

const BookingConfirmedModal = ({
  bookingStatus,
  setShowBookingConfirmedModal,
  setBookingStatus,
  setBookingData,
  setSelectedBarberName,
  isLoggedIn,
  userData
}) => {
  const navigate = useNavigate();  
    return (
    <div className="modal show d-block booking-confirmed-modal modal-centered" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', ...modalStyle }}>
      <div className="modal-dialog modal-lg" style={{ margin: 'auto', position: 'relative' }}>
        <div className="modal-content mx-3 mx-md-0" style={{ maxWidth: '700px', margin: '0 auto', transform: 'none' }}>
          <div className="modal-header border-0 p-0 m-0">
            <button
              type="button"
              className="btn-close"              onClick={() => {
                setShowBookingConfirmedModal(false);
                setBookingStatus({
                  submitted: false,
                  error: false,
                  errorMessage: '',
                  confirmedDate: '',
                  confirmedTime: '',
                  confirmedService: [],
                  confirmedEmail: ''
                });
              }}
            ></button>
          </div>
          <div className="modal-body text-center py-4">
            <div className="confirmation-icon mb-4">
              <div className="success-checkmark">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4.5rem' }}></i>
              </div>
            </div>
            <h2 className="h3 confirmation-title">Booking Confirmed!</h2>
            <p className="mb-4">
              Thank you for confirming your booking with The Gentleman's Cut. Your appointment is now confirmed and added to our schedule.
            </p>            <div className="booking-info-container p-3 p-md-4 mb-4 bg-light rounded">
              <div className="table-responsive">
                <table className="table table-borderless mb-0">
                  <tbody>
                    <tr>
                      <td className="fw-bold text-end text-md-end text-start" style={{ width: '30%' }}>Date:</td>
                      <td>
                        <span className="booking-info-value">{bookingStatus.confirmedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="fw-bold text-end text-md-end text-start">Time:</td>
                      <td>
                        <span className="booking-info-value">{bookingStatus.confirmedTime}</span>
                      </td>
                    </tr>                    <tr>
                      <td className="fw-bold text-end text-md-end text-start">Services:</td>
                      <td>
                        {typeof bookingStatus.confirmedService === 'string' ? (
                          <span className="booking-info-value">{bookingStatus.confirmedService}</span>
                        ) : Array.isArray(bookingStatus.confirmedService) ? (
                          <ul className="list-unstyled mb-0">
                            {bookingStatus.confirmedService.map((service, index) => (
                              <li key={index} className="booking-info-value">{service}</li>
                            ))}
                          </ul>
                        ) : (
                          <span className="booking-info-value">No service selected</span>
                        )}
                      </td>
                    </tr>
                    {setSelectedBarberName && (
                      <tr>
                        <td className="fw-bold text-end text-md-end text-start">Barber:</td>
                        <td>
                          <span className="booking-info-value">{setSelectedBarberName}</span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>          <div className="modal-footer border-0 p-3">
            <div className="d-flex flex-column flex-md-row justify-content-between w-100 gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary booking-outline-btn px-4 order-2 order-md-1"                onClick={() => {
                  setShowBookingConfirmedModal(false);
                  setBookingStatus({
                    submitted: false,
                    error: false,
                    errorMessage: '',
                    confirmedDate: '',
                    confirmedTime: '',
                    confirmedService: [],
                    confirmedEmail: ''
                  });
                  navigate('/');
                }}
              >
                <i className="bi bi-house me-2"></i>
                Return to Home
              </button>
              <button
                type="button"
                className="btn booking-btn px-4 order-1 order-md-2"
                onClick={() => {                  setShowBookingConfirmedModal(false);
                  setBookingData({
                    services: [], // Use empty array instead of empty string
                    barber_id: '',
                    date: '',
                    time: '',
                    name: isLoggedIn && userData ? userData.name : '',
                    email: isLoggedIn && userData ? userData.email : '',
                    phone: isLoggedIn && userData ? userData.phone : '',
                    notes: '',
                    user_id: isLoggedIn && userData ? userData._id : null
                  });
                  if (setSelectedBarberName) {
                    setSelectedBarberName('');
                  }                  setBookingStatus({
                    submitted: false,
                    error: false,
                    errorMessage: '',
                    confirmedDate: '',
                    confirmedTime: '',
                    confirmedService: [],
                    confirmedEmail: ''
                  });
                }}
              >
                <i className="bi bi-calendar-plus me-2"></i>
                Book Another Appointment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmedModal;