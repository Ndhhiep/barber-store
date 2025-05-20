import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/BookingPage.css';

const BookingConfirmedPage = () => {
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [bookingStatus, setBookingStatus] = useState({
    submitted: false,
    error: false,
    errorMessage: '',
    confirmedDate: '',
    confirmedTime: '',
    confirmedService: '',
    confirmedEmail: '',
    confirmedBarber: ''
  });
  const location = useLocation();
  const navigate = useNavigate();

  const validateBookingToken = useCallback(async (token) => {
    try {
      setIsValidatingToken(true);
      // Call API to validate the token
      const response = await axios.post(
        'http://localhost:5000/api/bookings/confirm',
        { token }
      );
      if (response.data.success) {
        const { booking } = response.data;
        // Store confirmation info in booking status
        setBookingStatus({
          submitted: true,
          error: false,
          errorMessage: '',
          confirmedDate: new Date(booking.date).toLocaleDateString(),
          confirmedTime: booking.time,
          confirmedService: booking.service,
          confirmedEmail: booking.email,
          confirmedBarber: booking.barber_name || ''
        });
      } else {
        setBookingStatus((prevStatus) => ({
          ...prevStatus,
          error: true,
          errorMessage: response.data.message || 'Invalid or expired confirmation link.'
        }));
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setBookingStatus((prevStatus) => ({
        ...prevStatus,
        error: true,
        errorMessage: 'Failed to validate the confirmation link. It may have expired.'
      }));
    } finally {
      setIsValidatingToken(false);
    }
  }, []); // Wrapped validateBookingToken in useCallback

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const confirmationToken = queryParams.get('token');

    if (confirmationToken) {
      validateBookingToken(confirmationToken);
    } else {
      setIsValidatingToken(false);
      setBookingStatus((prevStatus) => ({
        ...prevStatus,
        error: true,
        errorMessage: 'No confirmation token provided.'
      }));
    }
  }, [location.search, validateBookingToken]); // Updated to use functional update for setBookingStatus

  return (
    <div className="py-5 booking-page-bg">
      <div className="container booking-page-container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card booking-card shadow">
              <div className="card-body p-4 p-md-5" >
                {isValidatingToken ? (
                  <div className="py-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Validating your booking confirmation...</p>
                  </div>
                ) : bookingStatus.error ? (
                  <div className="py-5 text-center">
                    <div className="text-danger mb-4">
                      <i className="bi bi-exclamation-circle" style={{fontSize: "3rem"}}></i>
                    </div>
                    <h2 className="h4 mb-3">Confirmation Error</h2>
                    <p className="mb-4">{bookingStatus.errorMessage}</p>
                    <button 
                      className="btn booking-btn"
                      onClick={() => navigate('/booking')}
                    >
                      Return to Booking Page
                    </button>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <div className="confirmation-icon mb-4">
                      <i className="bi bi-check-circle-fill text-success" style={{fontSize: "4.5rem"}}></i>
                    </div>
                    <h2 className="h3 confirmation-title">
                      Booking Confirmed!
                    </h2>
                    <p className="mb-4">
                      Thank you for confirming your booking with The Gentleman's Cut. 
                      Your appointment is now confirmed and added to our schedule.
                    </p>
                    <div className="booking-info-container p-4 mb-4 bg-light rounded">
                      <table className="table table-borderless mb-0">
                        <tbody>
                          <tr>
                            <td width="30%" className="fw-bold text-end">Date:</td>
                            <td>
                              <span className="booking-info-value">{bookingStatus.confirmedDate}</span> 
                            </td>
                          </tr>
                          <tr>
                            <td width="30%" className="fw-bold text-end">Time:</td>
                            <td>
                              <span className="booking-info-value">{bookingStatus.confirmedTime}</span>
                            </td>
                          </tr>
                          <tr>
                            <td width="30%" className="fw-bold text-end">Service:</td>
                            <td>
                              <span className="booking-info-value">{bookingStatus.confirmedService}</span>
                            </td>
                          </tr>
                          {bookingStatus.confirmedBarber && bookingStatus.confirmedBarber !== "Any Available Barber" && (
                            <tr>
                              <td width="30%" className="fw-bold text-end">Barber:</td>
                              <td>
                                <span className="booking-info-value">{bookingStatus.confirmedBarber}</span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="alert alert-info mb-4">
                      <i className="bi bi-info-circle me-2"></i>
                      Your booking have been confirmed ! Now you can close this page. 
                    </div>
                    <div className="d-grid gap-2 d-md-flex justify-content-md-center">
                      <button
                        type="button"
                        className="btn booking-btn px-4"
                        onClick={() => navigate('/')}
                      >
                        <i className="bi bi-house me-2"></i>
                        Return to Home
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary booking-outline-btn px-4"
                        onClick={() => navigate('/booking')}
                      >
                        <i className="bi bi-calendar-plus me-2"></i>
                        Book Another Appointment
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmedPage;
