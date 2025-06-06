import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/MyBookingsPage.css';
import { getMyBookings, cancelBooking } from '../services/bookingService';
import { isServerOnline } from '../utils/serverCheck';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [bookingsPerPage] = useState(6);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          navigate('/login?redirect=my-bookings');
          return;
        }

        // Check server status first
        const isServerRunning = await isServerOnline();
        if (!isServerRunning) {
          setServerOnline(false);
          setError('Cannot connect to server. Please check if the backend server is running.');
          setIsLoading(false);
          return;
        }
        
        const response = await getMyBookings();
        setBookings(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        
        if (error.code === 'ERR_NETWORK') {
          setServerOnline(false);
          setError('Network error: Cannot connect to the server. Please check your internet connection or make sure the server is running.');
        } else {
          setError('Failed to load your booking history. Please try again later.');
        }
        
        setIsLoading(false);
        
        // If unauthorized (401), redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login?redirect=my-bookings');
        }
      }
    };
    
    fetchBookings();
  }, [navigate]);

  // Pagination functionality
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = bookings.slice(indexOfFirstBooking, indexOfLastBooking);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Go to next page
  const nextPage = () => {
    if(currentPage < Math.ceil(bookings.length / bookingsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Go to previous page
  const prevPage = () => {
    if(currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  // Reset to page 1 when bookings change
  useEffect(() => {
    setCurrentPage(1);
  }, [bookings.length]);

  const retryConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isServerRunning = await isServerOnline();
      if (isServerRunning) {
        setServerOnline(true);
        // Retry fetching the bookings
        const token = localStorage.getItem('token');
        if (token) {
          const response = await getMyBookings();
          setBookings(response.data);
        }
      } else {
        setServerOnline(false);
        setError('Server is still not responding. Please make sure the backend server is running.');
      }
    } catch (error) {
      setError('Failed to check server status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get status badge with appropriate color
  const getStatusBadge = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      confirmed: 'badge-primary',
      completed: 'badge-success',
      cancelled: 'badge-danger'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'badge-secondary'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };  // Open confirmation modal
  const openCancelModal = (bookingId) => {
    // Find the booking in our state to show details in the modal
    const selectedBooking = bookings.find(booking => booking._id === bookingId);
    if (selectedBooking) {
      setBookingToCancel(bookingId);
      setShowConfirmModal(true);
    } else {
      console.error('Booking not found:', bookingId);
    }
  };
  
  // Close confirmation modal
  const closeCancelModal = () => {
    setShowConfirmModal(false);
    setBookingToCancel(null);
  };
  
  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    try {
      await cancelBooking(bookingToCancel);
      
      // Update the booking status in the UI
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking._id === bookingToCancel
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      );
      
      // Close the modal
      closeCancelModal();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
      closeCancelModal();
    }
  };
  if (isLoading) {
    return (
      <div className="container py-3 py-md-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your bookings...</p>
      </div>
    );
  }

  if (!serverOnline) {
    return (
      <div className="container py-3 py-md-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Connection Error!</h4>
          <p>{error || 'Cannot connect to the server. Please check if the backend server is running.'}</p>
          <hr />
          <div className="mt-3">
            <button 
              className="btn btn-primary me-3" 
              onClick={retryConnection}
            >
              Retry Connection
            </button>
            <Link to="/" className="btn btn-outline-secondary">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="container py-3 py-md-5">
        <div className="alert alert-danger" role="alert">
          {error}
          <div className="mt-3">
            <button 
              className="btn btn-primary" 
              onClick={retryConnection}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-container">
      <h1 className="my-bookings-title">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="empty-bookings-message">
          <h3 className="mb-3 mb-md-4">You don't have any bookings yet.</h3>
          <Link to="/booking" className="btn btn-primary">Book an Appointment</Link>
        </div>
      ) : (
        <div className="row">
          {currentBookings.map((booking) => (
            <div className="col-12 col-md-6 col-lg-4 mb-3 mb-md-4" key={booking._id}>              <div className="card booking-card">                <div className="card-header">
                  <div>
                    <h5 className="mb-0" style={{ fontFamily: 'sans-serif' }}>
                      <strong>Booking ID:</strong> {booking._id.slice(-6)}
                    </h5>
                  </div>
                </div>                
                <div className="card-body">
                  <p className="mb-2"><strong>Date:</strong> {formatDate(booking.date)} at {booking.time}</p>
                  
                  {/* Services list */}                  <div className="mb-2">
                    <strong>Services:</strong>
                    {booking.services && Array.isArray(booking.services) && booking.services.length > 0 ? (
                      <ul className="list-unstyled mb-0 mt-1">
                        {booking.services.map((service, index) => (
                          <li key={index} className="ms-3">• {typeof service === 'object' ? service.name : service}</li>
                        ))}
                      </ul>
                    ) : booking.serviceNames ? (
                      <ul className="list-unstyled mb-0 mt-1">
                        {booking.serviceNames.map((name, index) => (
                          <li key={index} className="ms-3">• {name}</li>
                        ))}
                      </ul>
                    ) : booking.serviceName ? (
                      <span className="ms-2">{booking.serviceName}</span>
                    ) : (
                      <span className="ms-2">{booking.service || 'No service specified'}</span>
                    )}
                  </div>
                  
                  <p className="mb-2">
                    <strong>Barber:</strong> {
                      booking.barber?.name || 
                      (booking.barber_id?.name ? booking.barber_id.name : 
                       (typeof booking.barber === 'string' ? booking.barber : 'Not specified'))
                    }
                  </p>
                  
                  {/* Status moved here */}
                  <div className="mb-2">
                    <strong>Status:</strong> {getStatusBadge(booking.status)}
                  </div>
                  
                  {booking.notes && (
                    <p className="mb-2"><strong>Notes:</strong> {booking.notes}</p>
                  )}
                  <p className="text-muted small mb-0">
                    Booked on {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="card-footer">                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => openCancelModal(booking._id)}
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination controls */}
      {bookings.length > bookingsPerPage && (
        <div className="pagination-container mt-4 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={prevPage} 
                disabled={currentPage === 1}
                aria-label="Previous"
              >
                <span aria-hidden="true">&laquo;</span>
              </button>
            </li>
            
            {Array(Math.ceil(bookings.length / bookingsPerPage)).fill().map((_, index) => (
              <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => paginate(index + 1)}
                >
                  {index + 1}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${currentPage === Math.ceil(bookings.length / bookingsPerPage) ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={nextPage} 
                disabled={currentPage === Math.ceil(bookings.length / bookingsPerPage)}
                aria-label="Next"
              >
                <span aria-hidden="true">&raquo;</span>
              </button>
            </li>
          </ul>
        </div>
      )}
        {/* Confirmation Modal */}
      {showConfirmModal && bookingToCancel && (
        <div className="modal-backdrop">
          <div className="confirmation-modal">
            <div className="confirmation-modal-content">              <h4>Cancel Booking</h4>
              
              {/* Booking details section */}
              <div className="booking-details mb-3">
                {(() => {
                  // Find the booking to display its details
                  const bookingDetails = bookings.find(b => b._id === bookingToCancel);
                  if (bookingDetails) {
                    return (
                      <div className="card booking-summary">
                        <div className="card-body">
                          <h6 className="booking-service">Order ID: #{bookingDetails._id.slice(-6)}</h6>
                          <hr />
                          <div className="booking-info">
                            <p><strong>Date:</strong> {formatDate(bookingDetails.date)} at {bookingDetails.time}</p>
                            
                            {/* Services list */}
                            <div className="mb-2">
                              <strong>Services:</strong>
                              {bookingDetails.services && Array.isArray(bookingDetails.services) && bookingDetails.services.length > 0 ? (
                                <ul className="list-unstyled mb-0 mt-1">
                                  {bookingDetails.services.map((service, index) => (
                                    <li key={index} className="ms-3">• {service}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="ms-2">{bookingDetails.service || 'No service specified'}</span>
                              )}
                            </div>
                            
                            <p>
                              <strong>Barber:</strong> {
                                bookingDetails.barber?.name || 
                                (bookingDetails.barber_id?.name ? bookingDetails.barber_id.name : 
                                (typeof bookingDetails.barber === 'string' ? bookingDetails.barber : 'Not specified'))
                              }
                            </p>
                            {bookingDetails.notes && (
                              <p className="booking-notes"><strong>Notes:</strong> {bookingDetails.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return <p>Loading booking details...</p>;
                })()}
              </div>
              
              <p>Are you sure you want to cancel this booking?</p>
              <p className="text-muted small">This action cannot be undone.</p>
              
              <div className="confirmation-modal-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={closeCancelModal}
                >
                  Keep Booking
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleCancelBooking}
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;