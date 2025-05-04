import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../css/user/MyBookingsPage.css';
import { getMyBookings, cancelBooking } from '../../services/user_services/bookingService';
import { checkServerStatus } from '../../utils/serverCheck';

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serverOnline, setServerOnline] = useState(true);
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
        const isServerRunning = await checkServerStatus();
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

  const retryConnection = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isServerRunning = await checkServerStatus();
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
  };

  // Handle booking cancellation
  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        await cancelBooking(bookingId);
        
        // Update the booking status in the UI
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { ...booking, status: 'cancelled' }
              : booking
          )
        );
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your bookings...</p>
      </div>
    );
  }

  if (!serverOnline) {
    return (
      <div className="container py-5">
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
      <div className="container py-5">
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
          <h3 className="mb-4">You don't have any bookings yet.</h3>
          <Link to="/booking" className="btn btn-primary">Book an Appointment</Link>
        </div>
      ) : (
        <div className="row">
          {bookings.map((booking) => (
            <div className="col-md-6 col-lg-4 mb-4" key={booking._id}>
              <div className="card booking-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{booking.service}</h5>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="card-body">
                  <p className="mb-2"><strong>Date:</strong> {formatDate(booking.date)} at {booking.time}</p>
                  <p className="mb-2"><strong>Barber:</strong> {booking.barber}</p>
                  {booking.notes && (
                    <p className="mb-2"><strong>Notes:</strong> {booking.notes}</p>
                  )}
                  <p className="text-muted small mb-0">
                    Booked on {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="card-footer">
                  {(booking.status === 'pending' || booking.status === 'confirmed') && (
                    <button
                      className="btn btn-outline-danger btn-sm w-100"
                      onClick={() => handleCancelBooking(booking._id)}
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
    </div>
  );
};

export default MyBookingsPage;