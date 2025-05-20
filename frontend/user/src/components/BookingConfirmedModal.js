import React from 'react';
import { useNavigate } from 'react-router-dom';

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
    <div className="modal show d-block booking-confirmed-modal" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div className="modal-header border-0 p-0 m-0">
            <button
              type="button"
              className="btn-close"
              onClick={() => {
                setShowBookingConfirmedModal(false);
                setBookingStatus({
                  submitted: false,
                  error: false,
                  errorMessage: '',
                  confirmedDate: '',
                  confirmedTime: '',
                  confirmedService: '',
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
            </p>
            <div className="booking-info-container p-4 mb-4 bg-light rounded">
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr>
                    <td width="20%" className="fw-bold text-end">Date:</td>
                    <td>
                      <span className="booking-info-value">{bookingStatus.confirmedDate}</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="20%" className="fw-bold text-end">Time:</td>
                    <td>
                      <span className="booking-info-value">{bookingStatus.confirmedTime}</span>
                    </td>
                  </tr>
                  <tr>
                    <td width="20%" className="fw-bold text-end">Service:</td>
                    <td>
                      <span className="booking-info-value">{bookingStatus.confirmedService}</span>
                    </td>
                  </tr>
                  {setSelectedBarberName && (
                    <tr>
                      <td width="20%" className="fw-bold text-end">Barber:</td>
                      <td>
                        <span className="booking-info-value">{setSelectedBarberName}</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer border-0">
            <div className="d-flex justify-content-between w-100">
              <button
                type="button"
                className="btn btn-outline-secondary booking-outline-btn px-4"
                onClick={() => {
                  setShowBookingConfirmedModal(false);
                  setBookingStatus({
                    submitted: false,
                    error: false,
                    errorMessage: '',
                    confirmedDate: '',
                    confirmedTime: '',
                    confirmedService: '',
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
                className="btn booking-btn px-4"
                onClick={() => {
                  setShowBookingConfirmedModal(false);                  setBookingData({
                    service: '',
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
                  }
                  setBookingStatus({
                    submitted: false,
                    error: false,
                    errorMessage: '',
                    confirmedDate: '',
                    confirmedTime: '',
                    confirmedService: '',
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