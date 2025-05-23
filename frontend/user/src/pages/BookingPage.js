import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/BookingPage.css';
import timeSlotService from '../services/timeSlotService';
import barberService from '../services/barberService';
import serviceService from '../services/serviceService';
import { useLocation, useNavigate } from 'react-router-dom';
import BookingConfirmedModal from '../components/BookingConfirmedModal';

const BookingPage = () => {
  const [bookingData, setBookingData] = useState({
    service: '',
    barber_id: '', 
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    user_id: null 
  });

  // State to store the list of barbers from API
  const [barberList, setBarberList] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  
  // State to store services from API
  const [serviceList, setServiceList] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  
  const [bookingStatus, setBookingStatus] = useState({
    submitted: false,
    error: false,
    errorMessage: '',
    confirmedDate: '',
    confirmedTime: '',
    confirmedService: '',
    confirmedEmail: ''
  });

  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Add authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  
  // Add guest mode indicator
  const [isGuestMode, setIsGuestMode] = useState(true); // Default to guest mode

  // State to store time slot statuses from API
  const [timeSlotStatuses, setTimeSlotStatuses] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  // New state variables for email confirmation feature
  const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
  const [showBookingConfirmedModal, setShowBookingConfirmedModal] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  
  // For getting URL parameters and navigation
  const location = useLocation();
  const navigate = useNavigate();

  // Format date to YYYY-MM-DD for comparing with input date value
  const formatDate = useCallback((date) => {
    return date.toISOString().split('T')[0];
  }, []);

  // Fetch barbers list from API
  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoadingBarbers(true);
        const barbers = await barberService.getAllBarbers();
        setBarberList(barbers);
      } catch (error) {        // Error handled silently
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
  }, []);
  
  // Fetch services list from API
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoadingServices(true);
        const response = await serviceService.getAllServices();
        // Only use active services
        const activeServices = response.data.filter(service => service.isActive !== false);
        setServiceList(activeServices);
      } catch (error) {        // Error handled silently
        // If API fails, provide empty services list
        setServiceList([]);
      } finally {
        setLoadingServices(false);
      }
    };

    fetchServices();
  }, []);
  // Check if a time slot should be disabled - wrapped in useCallback
  const isTimeSlotDisabled = useCallback((timeSlot) => {
    // If we have statuses from the backend, use those
    if (timeSlotStatuses.length > 0) {
      const slotStatus = timeSlotStatuses.find(slot => slot.start_time === timeSlot);
      if (slotStatus) {
        return slotStatus.isPast || !slotStatus.isAvailable;
      }
    }
    
    // If we don't have status data yet, assume the slot is available
    return false;
  }, [timeSlotStatuses]);
  // Check if a time slot is in the past or booked - for future use in showing specific messages
  // eslint-disable-next-line no-unused-vars
  
  // Update current time every minute for time slot validation
  useEffect(() => {
    const updateCurrentTime = () => {
      setBookingData(prev => {
        if (prev.date && prev.time) {
          if (isTimeSlotDisabled(prev.time)) {
            return { ...prev, time: '' };
          }
        }
        return prev;
      });
    };
    
    const timer = setInterval(updateCurrentTime, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeSlotDisabled]);
  
  // Check user authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoggedIn(false);
          setIsGuestMode(true); // Set guest mode when no token is found
          return;
        }
        
        // Fetch user data using the token
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setIsLoggedIn(true);
        setIsGuestMode(false); // Turn off guest mode when logged in
        setUserData(response.data.data.user);
        
        // Autofill user data in the booking form
        setBookingData(prevData => ({
          ...prevData,
          name: response.data.data.user.name || '',
          email: response.data.data.user.email || '',
          phone: response.data.data.user.phone || '',
          user_id: response.data.data.user._id
        }));
      } catch (error) {
        // Clear token if invalid
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setIsGuestMode(true); // Set guest mode if token validation fails
      }
    };
    
    checkAuthStatus();
  }, []);  // Fetch time slot statuses when barber or date changes (not on time selection)
  useEffect(() => {
    const fetchTimeSlotStatuses = async () => {
      if (bookingData.barber_id && bookingData.date) {
        try {
          setIsLoadingTimeSlots(true);
          // Call the service to get time slot statuses
          const statuses = await timeSlotService.getTimeSlotStatus(bookingData.barber_id, bookingData.date);
          setTimeSlotStatuses(statuses);
          
          // Get the current selected time from the latest bookingData
          // This way we don't need to add bookingData.time to dependencies
          const currentSelectedTime = bookingData.time;
          
          // If currently selected time is not available, reset it
          if (currentSelectedTime) {
            const isCurrentTimeAvailable = statuses.some(
              slot => slot.start_time === currentSelectedTime && slot.isAvailable && !slot.isPast
            );
            
            if (!isCurrentTimeAvailable) {
              setBookingData(prev => ({
                ...prev,
                time: ''
              }));
            }
          }
        } catch (error) {
          // Error handled silently
          setTimeSlotStatuses([]);
        } finally {
          setIsLoadingTimeSlots(false);
        }
      }
    };
    fetchTimeSlotStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.barber_id, bookingData.date]);

  // Wrap `validateBookingToken` in a `useCallback` hook
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
          submitted: false, // Changed to false since we're using modal instead
          error: false,
          errorMessage: '',
          confirmedDate: booking.date,
          confirmedTime: booking.time,
          confirmedService: booking.service,
          confirmedEmail: booking.email
        });
  
        // Clear pending booking data
        localStorage.removeItem('pendingBooking');
  
        // Reset form data - works for both guest and logged-in users
        setBookingData({
          service: '',
          barber_id: '',
          date: '',
          time: '',
          name: isLoggedIn ? userData?.name : '',
          email: isLoggedIn ? userData?.email : '',
          phone: isLoggedIn ? userData?.phone : '',
          notes: '',
          user_id: isLoggedIn ? userData?._id : null
        });
  
        // Remove token from URL to prevent reprocessing
        navigate('/booking', { replace: true });
  
        // Show confirmation modal instead of inline confirmation
        setShowBookingConfirmedModal(true);
  
        return true;
      } else {
        // Token validation failed
        setBookingStatus({
          submitted: false,
          error: true,
          errorMessage: response.data.message || 'Invalid or expired confirmation link.'
        });
        return false;
      }
    } catch (error) {
      // Error handled silently
  
      setBookingStatus({
        submitted: false,
        error: true,
        errorMessage: 'Failed to validate the confirmation link. It may have expired.'
      });
      return false;
    } finally {
      setIsValidatingToken(false);
    }
  }, [isLoggedIn, navigate, userData]);
  
  // Check for confirmation token in URL parameters on component mount
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const confirmationToken = queryParams.get('token');
      if (confirmationToken) {
      validateBookingToken(confirmationToken);
    }
    
    // Check for pending booking in localStorage (for cases when user refreshes the page)
    const pendingBookingData = localStorage.getItem('pendingBooking');
    if (pendingBookingData) {
      try {
        JSON.parse(pendingBookingData); // Removed assignment to 'parsedData'
      } catch (error) {        // Error handled silently
      }
    }
  }, [location.search, validateBookingToken]);

  // Fallback time slots if API fails
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'barber') {
      // Special handling for barber field to get barber_id
      const selectedBarber = barberList.find(barber => barber._id === value);
      if (selectedBarber) {
        setBookingData(prev => ({
          ...prev,
          barber_id: selectedBarber._id,
          time: '' // Reset time selection when barber changes
        }));
        
        // Reset time slot statuses when barber changes
        setTimeSlotStatuses([]);
      }
    } else if (name === 'date') {
      // Reset time selection and time slot statuses when date changes
      setBookingData(prev => ({
        ...prev,
        [name]: value,
        time: '' // Reset time when date changes
      }));
      // Reset time slot statuses when date changes
      setTimeSlotStatuses([]);
    } else {
      // Handle other fields normally
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  const handleTimeSelect = (time) => {
    // Check if the time is available before setting it (using already loaded time slot data)
    const isAvailable = timeSlotStatuses.some(
      slot => slot.start_time === time && !slot.isPast && slot.isAvailable
    );
    
    if (isAvailable || timeSlotStatuses.length === 0) {
      setBookingData(prev => ({
        ...prev,
        time
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Include authentication token if user is logged in
      const headers = {};
      const token = localStorage.getItem('token');
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }      
      // Create a copy of the booking data to preserve for confirmation display
      const confirmedBookingData = {...bookingData};
      
      // Get service name for display in confirmation
      const serviceName = getServiceNameById(bookingData.service);
      
      // Create the request data with service name instead of ID
      const requestData = {
        ...bookingData,
        service: serviceName, // Convert service ID to service name as required by the backend
        requireEmailConfirmation: true, // New flag to indicate email confirmation is needed
        // For guest bookings, ensure user_id is null to avoid FK constraint errors
        user_id: isGuestMode ? null : bookingData.user_id
      };
      
      // Submit booking
      const response = await axios.post(
        'http://localhost:5000/api/bookings',
        requestData,
        { headers }
      );
      
      // Show email confirmation modal instead of setting submitted state
      setShowEmailConfirmModal(true);
      
      // Store booking data for later use
      localStorage.setItem('pendingBooking', JSON.stringify({
        id: response.data.bookingId,
        serviceName,
        date: confirmedBookingData.date,
        time: confirmedBookingData.time,
        email: confirmedBookingData.email
      }));
      
      // Don't reset the form data yet - we'll do that after confirmation
    } catch (error) {
      // Handle API error
      setBookingStatus({
        submitted: false,
        error: true,
        errorMessage: error.response?.data?.message || 'Failed to submit booking. Please try again.'
      });
      
      // Reset pending booking state
      localStorage.removeItem('pendingBooking');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get minimum date (today) for the date picker
  const getMinDate = () => {
    return formatDate(new Date());
  };

  // Format price to display as currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Get service name by ID
  const getServiceNameById = (serviceId) => {
    const service = serviceList.find(service => service._id === serviceId);
    return service ? service.name : '';
  };

  // Email Confirmation Modal Component
  const EmailConfirmationModal = () => {
    return (
      <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title">Verify Your Email</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  navigate('/'); // Redirect to home page when modal is closed
                }}
              ></button>
            </div>
            <div className="modal-body text-center py-4">
              <div className="mb-4">
                <i className="bi bi-envelope-check text-primary" style={{fontSize: "3rem"}}></i>
              </div>
              <h2 className="h4 mb-3">Almost there!</h2>
              <p className="mb-4">
                We've sent a confirmation email to <strong>{bookingData.email}</strong>. 
                Please check your inbox and click the confirmation link to finalize your appointment.
              </p>
              <div className="alert alert-warning">
                <i className="bi bi-info-circle me-2"></i>
                The confirmation link will expire in 24 hours.
              </div>
            </div>
            <div className="modal-footer border-0 justify-content-center">
              <button 
                type="button" 
                className="btn btn-primary px-4"
                onClick={() => {
                  setShowEmailConfirmModal(false);
                  navigate('/');
                }}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="booking-page">
      {/* Page Title Section */}
      <div className="page-title-section py-5">
        <div className="container text-center">
          <h1 className="display-4 mb-3 page-title">Book Your Appointment</h1>
          <hr/>
          <p className="page-subtitle">Schedule your visit to The Gentleman's Cut for a premium grooming experience.</p>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailConfirmModal && <EmailConfirmationModal />}

      {/* Booking Confirmed Modal */}
      {showBookingConfirmedModal && <BookingConfirmedModal
        bookingStatus={bookingStatus}
        setShowBookingConfirmedModal={setShowBookingConfirmedModal}
        setBookingStatus={setBookingStatus}
        setBookingData={setBookingData}
        isLoggedIn={isLoggedIn}
        userData={userData}
      />}
      
      <div className="container booking-page-container" style={{ marginTop: '50px' }}>
        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card booking-card" style={{borderRadius: '5px' }}>
              <div className="card-body p-4 p-md-5">
                {isValidatingToken && (
                  <div className="py-5 text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Validating your booking confirmation...</p>
                  </div>
                )}
                
                
                  <form onSubmit={handleSubmit}>
                    {bookingStatus.error && (
                      <div className="alert alert-danger mb-4" role="alert">
                        {bookingStatus.errorMessage}
                      </div>
                    )}

                    {isGuestMode && (
                      <div className="alert alert-info mb-4" role="alert">
                        <div className="d-flex align-items-center">
                          <i className="bi bi-info-circle-fill me-2 fs-4"></i>
                          <div>
                            <strong>Guest Booking</strong> - You're booking as a guest. 
                            <div>You'll receive a confirmation email to verify your appointment.</div>
                            <div className="mt-1">
                              <span>Already have an account? </span>
                              <a href="/login?redirect=booking" className="alert-link">Log in</a>
                              <span> or </span>
                              <a href="/register?redirect=booking" className="alert-link">Sign up</a>
                              <span> to manage your appointments.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="row">                      {/* Service Details Section */}
                      <div className="col-12 mb-4">                        <h3 className="h5 mb-3 booking-section-title">
                          <i className="bi bi-calendar2-check me-2"></i>Service Details
                        </h3>
                        <div className="card p-4 booking-section-card no-hover-effect">
                          <div className="row">                            <div className="col-12 mb-4">
                              <label htmlFor="service" className="form-label fw-bold">
                                <i className="bi bi-scissors me-2"></i>Select Service*
                              </label>                              
                              <select
                                id="service"
                                name="service"
                                value={bookingData.service || ''}
                                onChange={handleChange}
                                required
                                className="form-select booking-form-control no-hover-effect"
                                style={{outline: 'none', boxShadow: 'none'}}
                                disabled={loadingServices}
                              >                                
                              <option value="">-- Select a service --</option>
                                {loadingServices ? (
                                  <option value="" disabled>Loading services...</option>
                                ) : serviceList.length > 0 ? (serviceList.map((service) => (
                                    <option key={service._id} value={service._id}>
                                      {service.name} - {formatPrice(service.price)}
                                    </option>
                                  ))
                                ) : (
                                  <option value="" disabled>No services available</option>
                                )}
                              </select>
                              <small className="text-muted mt-1 d-block">
                                Choose the service you'd like to book
                              </small>
                            </div>
                              <div className="col-12 mb-4">
                              <label htmlFor="barber" className="form-label fw-bold">
                                <i className="bi bi-person-badge me-2"></i>Select Barber*
                              </label>                              
                              <div className="input-group no-hover-effect">
                                                               
                                <select
                                  id="barber"
                                  name="barber"
                                  value={bookingData.barber_id || ''}
                                  onChange={handleChange}
                                  required
                                  className="form-select booking-form-control border-start-0 no-hover-effect"
                                  style={{outline: 'none', boxShadow: 'none'}}
                                >
                                  <option value="">-- Select a barber --</option>
                                  {loadingBarbers ? (
                                    <option value="" disabled>Loading barbers...</option>
                                  ) : (
                                    <>
                                      {barberList.map((barber) => (
                                        <option key={barber._id} value={barber._id}>
                                          {barber.name}
                                        </option>
                                      ))}
                                      
                                    </>
                                  )}
                                </select>
                              </div>
                              <small className="text-muted mt-1 d-block">
                                Choose your preferred barber
                              </small>
                            </div>
                              <div className="col-12 mb-4">
                              <label htmlFor="date" className="form-label fw-bold">
                                <i className="bi bi-calendar3 me-2"></i>Preferred Date*
                              </label>
                              <div className="input-group shadow-sm">
                                                              
                                <input
                                  type="date"
                                  id="date"
                                  name="date"
                                  value={bookingData.date}
                                  onChange={handleChange}
                                  required
                                  min={getMinDate()}
                                  className="form-control booking-form-control border-start-0 no-hover-effect"
                                  style={{outline: 'none', boxShadow: 'none'}}
                                />
                              </div>
                              <small className="text-muted mt-1 d-block">
                                Select your preferred appointment date
                              </small>
                            </div>
                              <div className="col-12 mb-4">
                              <label htmlFor="time" className="form-label fw-bold">
                                <i className="bi bi-clock me-2"></i>Available Time Slots*
                              </label>
                              <input 
                                type="hidden" 
                                id="time" 
                                name="time" 
                                value={bookingData.time} 
                                required
                              />
                              <div className="card time-slots-card border-0 no-hover-effect">
                                <div className="card-body py-3">
                                  <div className="time-slots-grid">
                                    {!bookingData.barber_id ? (
                                      <div className="text-center my-3">
                                        <i className="bi bi-person-badge text-muted me-2"></i>
                                        <span className="text-muted fw-medium">Please select a barber first</span>
                                      </div>
                                    ) : !bookingData.date ? (
                                      <div className="text-center my-3">
                                        <i className="bi bi-calendar3 text-muted me-2"></i>
                                        <span className="text-muted fw-medium">Please select a date first</span>
                                      </div>
                                    ) : isLoadingTimeSlots ? (
                                      <div className="text-center my-3">
                                        <div className="spinner-grow spinner-grow-sm text-primary me-2" role="status">
                                          <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <span className="text-primary fw-medium">Loading available time slots...</span>
                                      </div>
                                    ) : (
                                      <div className="row g-2">
                                        {(timeSlotStatuses.length > 0 ? timeSlotStatuses.map(slot => slot.start_time) : timeSlots).map((time, index) => {
                                          const disabled = isTimeSlotDisabled(time);
                                          return (
                                            <div key={index} className="col-6 col-md-3">
                                              <button
                                                type="button"
                                                className={`btn time-slot-btn w-100 ${bookingData.time === time ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                                                onClick={() => !disabled && handleTimeSelect(time)}
                                                disabled={disabled}
                                              >
                                                <i className={`bi bi-${disabled ? 'lock-fill' : 'clock'} me-1 small`}></i>
                                                {time}
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="d-flex mt-2 align-items-center">
                                <i className="bi bi-info-circle text-primary me-2"></i>
                                <div>
                                  {bookingData.date === formatDate(new Date()) && (
                                    <small className="text-muted d-block">
                                      <i className="bi bi-clock-history me-1"></i> Past time slots or slots within 30 minutes are disabled
                                    </small>
                                  )}
                                  {bookingData.barber_id && bookingData.date && timeSlotStatuses.length > 0 && (
                                    <small className="text-muted d-block">
                                      <i className="bi bi-lock me-1"></i> Grayed out time slots are already booked
                                    </small>
                                  )}
                                  {(!bookingData.barber_id || !bookingData.date) && (
                                    <small className="text-muted d-block">
                                      <i className="bi bi-info-circle me-1"></i> Select both a barber and date to see available time slots
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                        {/* Personal Information Section */}
                      <div className="col-12 mb-4">
                        <h3 className="h5 mb-3 booking-section-title">
                          <i className="bi bi-person-circle me-2"></i>Your Information
                        </h3>
                        <div className="card p-4 booking-section-card shadow-sm">
                          <div className="row">
                            <div className="col-12 mb-3">
                              <label htmlFor="name" className="form-label fw-bold">Full Name*</label>
                              <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0">
                                  <i className="bi bi-person"></i>
                                </span>                                <input
                                  type="text"
                                  id="name"
                                  name="name"
                                  value={bookingData.name}
                                  onChange={handleChange}
                                  required
                                  placeholder="Your full name"
                                  className="form-control booking-form-control border-start-0 no-hover-effect"
                                  style={{outline: 'none', boxShadow: 'none'}}
                                />
                              </div>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="phone" className="form-label fw-bold">Phone Number*</label>
                              <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0">
                                  <i className="bi bi-telephone"></i>
                                </span>                                <input
                                  type="tel"
                                  id="phone"
                                  name="phone"
                                  value={bookingData.phone}
                                  onChange={handleChange}
                                  required
                                  placeholder="(123) 456-7890"
                                  className="form-control booking-form-control border-start-0 no-hover-effect"
                                  style={{outline: 'none', boxShadow: 'none'}}
                                />
                              </div>
                            </div>
                            
                            <div className="col-md-6 mb-3">
                              <label htmlFor="email" className="form-label fw-bold">Email Address*</label>
                              <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0">
                                  <i className="bi bi-envelope"></i>
                                </span>                                <input
                                  type="email"
                                  id="email"
                                  name="email"
                                  value={bookingData.email}
                                  onChange={handleChange}
                                  required
                                  placeholder="your@email.com"
                                  className="form-control booking-form-control border-start-0 no-hover-effect"
                                  style={{outline: 'none', boxShadow: 'none'}}
                                />
                              </div>
                            </div>
                              <div className="col-12 mb-3">
                              <label htmlFor="notes" className="form-label fw-bold">
                                <i className="bi bi-chat-left-text me-1"></i> Special Requests
                              </label>
                              <div className="input-group shadow-sm">
                                <span className="input-group-text bg-white border-end-0">
                                  <i className="bi bi-pencil"></i>
                                </span>                                <textarea
                                  id="notes"
                                  name="notes"
                                  value={bookingData.notes}
                                  onChange={handleChange}
                                  placeholder="Any specific requests or requirements"
                                  className="form-control booking-form-control border-start-0 no-hover-effect"
                                  style={{outline: 'none', boxShadow: 'none'}}
                                  rows="3"
                                />
                              </div>
                              <small className="text-muted mt-1 d-block">
                                Tell us about any special requests or preferences you may have
                              </small>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12 mb-3">
                        <div className="card p-3 border-warning bg-light no-hover-effect">
                          <div className="form-check">
                            <input 
                              className="form-check-input booking-checkbox" 
                              type="checkbox" 
                              id="policyCheck" 
                              required
                            />
                            <label className="form-check-label fw-medium" htmlFor="policyCheck">
                              <i className="bi bi-exclamation-circle-fill text-warning me-2"></i>
                              I understand that a 24-hour cancellation notice is required to avoid a cancellation fee.
                            </label>
                          </div>
                        </div>
                      </div>
                        <div className="col-12 mt-4">
                        <button
                          type="submit"
                          className="btn btn-lg w-100 booking-btn no-hover-effect"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : (
                            <>
                              <i className="bi bi-calendar-check-fill me-2"></i>
                              Book Appointment
                            </>
                          )}
                        </button>
                        <div className="text-center mt-2">
                          <small className="text-muted">
                            <i className="bi bi-shield-check me-1"></i>
                            Your booking information is secure and will only be used for appointment purposes
                          </small>
                        </div>
                      </div>
                    </div>                  </form>
                
                
                {/* Display Booking Policies only when form is not submitted */}
                {!bookingStatus.submitted && (
                  <div className="mt-5 pt-3">
                    <div className="card policy-card">
                      <div className="card-body p-4">
                        <h3 className="h5 mb-3 policy-title">Booking Policies</h3>
                        <ul className="mb-0 policy-list">
                          <li className="mb-2">Please arrive 5-10 minutes before your appointment time.</li>
                          <li className="mb-2">24-hour notice is required for cancellations to avoid a fee.</li>
                          <li className="mb-2">If you're running late, please call us so we can adjust accordingly.</li>
                          <li className="mb-2">Appointments are confirmed via email and text message.</li>
                          <li>For group bookings (3+ people), please call us directly.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
