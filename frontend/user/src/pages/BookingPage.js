import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../css/BookingPage.css';
import timeSlotService from '../services/timeSlotService';
import barberService from '../services/barberService';

const BookingPage = () => {
  const [bookingData, setBookingData] = useState({
    service: '',
    barber_id: '', // ID của barber (MongoDB ObjectId)
    date: '',
    time: '',
    name: '',
    email: '',
    phone: '',
    notes: '',
    user_id: null 
  });

  // State để lưu trữ danh sách barber từ API
  const [barberList, setBarberList] = useState([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  
  // State để lưu trữ tên của barber đã chọn (chỉ dùng để hiển thị UI)
  const [selectedBarberName, setSelectedBarberName] = useState('');

  const [bookingStatus, setBookingStatus] = useState({
    submitted: false,
    error: false,
    errorMessage: ''
  });

  // Loading state for form submission
  const [isLoading, setIsLoading] = useState(false);
  
  // Add authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // State to store time slot statuses from API
  const [timeSlotStatuses, setTimeSlotStatuses] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

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
      } catch (error) {
        console.error('Error fetching barbers:', error);
      } finally {
        setLoadingBarbers(false);
      }
    };

    fetchBarbers();
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
    
    return false;
  }, [timeSlotStatuses]);

  // Check if a time slot is in the past or booked - for future use in showing specific messages
  // eslint-disable-next-line no-unused-vars
  const getTimeSlotDisabledReason = useCallback((timeSlot) => {
    if (timeSlotStatuses.length > 0) {
      const slotStatus = timeSlotStatuses.find(slot => slot.start_time === timeSlot);
      if (slotStatus) {
        if (slotStatus.isPast) return 'past';
        if (!slotStatus.isAvailable) return 'booked';
      }
    }
    return null;
  }, [timeSlotStatuses]);

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
  }, [isTimeSlotDisabled, bookingData.time]);
  
  // Check user authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsLoggedIn(false);
          return;
        }
        
        // Fetch user data using the token
        const response = await axios.get('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setIsLoggedIn(true);
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
        console.error('Authentication check failed:', error);
        // Clear token if invalid
        localStorage.removeItem('token');
        setIsLoggedIn(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Fetch time slot statuses when barber or date changes
  useEffect(() => {
    const fetchTimeSlotStatuses = async () => {
      if (bookingData.barber_id && bookingData.date) {
        try {
          setIsLoadingTimeSlots(true);
          
          console.log("Fetching time slot statuses for barber ID:", bookingData.barber_id, "on date:", bookingData.date);
          
          // Call the service to get time slot statuses
          const statuses = await timeSlotService.getTimeSlotStatus(bookingData.barber_id, bookingData.date);
          console.log("Time slot statuses received:", statuses);
          setTimeSlotStatuses(statuses);
          
          // If currently selected time is not available, reset it
          if (bookingData.time) {
            const isCurrentTimeAvailable = statuses.some(
              slot => slot.start_time === bookingData.time && slot.isAvailable && !slot.isPast
            );
            
            if (!isCurrentTimeAvailable) {
              setBookingData(prev => ({
                ...prev,
                time: ''
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching time slot statuses:', error);
          setTimeSlotStatuses([]);
        } finally {
          setIsLoadingTimeSlots(false);
        }
      }
    };
    
    fetchTimeSlotStatuses();
  }, [bookingData.barber_id, bookingData.date]);

  // Services data
  const services = [
    "Classic Haircut",
    "Traditional Hot Towel Shave",
    "Beard Trim & Style",
    "The Gentleman's Package",
    "Executive Cut & Style",
    "Father & Son Cut",
    "Grey Blending",
    "Buzz Cut"
  ];

  // Được thay thế bằng API call để lấy danh sách barber thực tế
  // const barbers = [
  //   "James Wilson (Master Barber)",
  //   "Robert Davis (Senior Barber)",
  //   "Michael Thompson (Beard Specialist)",
  //   "Any Available Barber"
  // ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'barber') {
      // Xử lý đặc biệt cho trường barber để lấy barber_id
      if (value === 'any') {
        // Trường hợp "Any Available Barber"
        setBookingData(prev => ({
          ...prev,
          barber_id: 'any' // Giá trị đặc biệt cho "bất kỳ barber nào"
        }));
        setSelectedBarberName('Any Available Barber');
      } else {
        // Tìm barber tương ứng trong danh sách để lấy ID
        const selectedBarber = barberList.find(barber => barber._id === value);
        if (selectedBarber) {
          setBookingData(prev => ({
            ...prev,
            barber_id: selectedBarber._id
          }));
          setSelectedBarberName(selectedBarber.name + (selectedBarber.specialization ? ` (${selectedBarber.specialization})` : ''));
        }
      }
    } else {
      // Xử lý các trường khác bình thường
      setBookingData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // If date changes, reset the time selection if the previously selected time is now invalid
    if (name === 'date') {
      setBookingData(prev => {
        if (prev.time && isTimeSlotDisabled(prev.time)) {
          return { ...prev, [name]: value, time: '' };
        }
        return { ...prev, [name]: value };
      });
    }
  };

  const handleTimeSelect = (time) => {
    setBookingData(prev => ({
      ...prev,
      time
    }));
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

      // Submit booking
      const response = await axios.post(
        'http://localhost:5000/api/bookings',
        bookingData,
        { headers }
      );
      
      console.log('Booking submitted:', response.data);
      
      setBookingStatus({
        submitted: true,
        error: false,
        errorMessage: ''
      });
      
      // Reset form after successful submission
      setBookingData({
        service: '',
        barber_id: '',
        date: '',
        time: '',
        name: isLoggedIn ? userData.name : '',
        email: isLoggedIn ? userData.email : '',
        phone: isLoggedIn ? userData.phone : '',
        notes: '',
        user_id: isLoggedIn ? userData._id : null
      });
      setSelectedBarberName('');
    } catch (error) {
      console.error('Error submitting booking:', error);
      
      setBookingStatus({
        submitted: false,
        error: true,
        errorMessage: error.response?.data?.message || 'Failed to submit booking. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today) for the date picker
  const getMinDate = () => {
    return formatDate(new Date());
  };

  return (
    <div className="py-5 booking-page-bg">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4 mb-3 booking-title">Book Your Appointment</h1>
          <p className="lead mx-auto booking-lead-text">
            Schedule your visit to The Gentleman's Cut for a premium grooming experience.
          </p>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="card booking-card">
              <div className="card-body p-4 p-md-5">
                {bookingStatus.submitted ? (
                  <div className="py-5 text-center">
                    <div className="confirmation-icon">
                      <i className="bi bi-check-circle"></i>
                    </div>
                    <h2 className="h3 mb-3 confirmation-title">
                      Booking Confirmed!
                    </h2>
                    <p className="mb-4">
                      Thank you for booking with The Gentleman's Cut. We've sent a confirmation email to {bookingData.email} with your appointment details.
                    </p>
                    <p className="mb-5">
                      <strong>Date:</strong> {bookingData.date} at {bookingData.time}<br/>
                      <strong>Service:</strong> {bookingData.service}<br/>
                      {selectedBarberName !== "Any Available Barber" && selectedBarberName && (
                        <><strong>Barber:</strong> {selectedBarberName}<br/></>
                      )}
                    </p>
                    <div>
                      <button 
                        className="btn btn-outline-secondary px-4 booking-outline-btn"
                        onClick={() => {
                          setBookingData({
                            service: '',
                            barber_id: '',
                            date: '',
                            time: '',
                            name: isLoggedIn ? userData.name : '',
                            email: isLoggedIn ? userData.email : '',
                            phone: isLoggedIn ? userData.phone : '',
                            notes: '',
                            user_id: isLoggedIn ? userData._id : null
                          });
                          setSelectedBarberName('');
                          setBookingStatus({ submitted: false, error: false, errorMessage: '' });
                        }}
                      >
                        Book Another Appointment
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {bookingStatus.error && (
                      <div className="alert alert-danger mb-4" role="alert">
                        {bookingStatus.errorMessage}
                      </div>
                    )}
                    <div className="row">
                      {/* Service Details Section */}
                      <div className="col-12 mb-4">
                        <h3 className="h5 mb-3 booking-section-title">Service Details</h3>
                        <div className="card p-3 booking-section-card">
                          <div className="row">
                            <div className="col-12 mb-3">
                              <label htmlFor="service" className="form-label">Select Service*</label>
                              <select
                                id="service"
                                name="service"
                                value={bookingData.service}
                                onChange={handleChange}
                                required
                                className="form-select booking-form-control"
                              >
                                <option value="">-- Select a service --</option>
                                {services.map((service, index) => (
                                  <option key={index} value={service}>{service}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div className="col-12 mb-3">
                              <label htmlFor="barber" className="form-label">Select Barber*</label>
                              <select
                                id="barber"
                                name="barber"
                                value={bookingData.barber_id || ''}
                                onChange={handleChange}
                                required
                                className="form-select booking-form-control"
                              >
                                <option value="">-- Select a barber --</option>
                                {loadingBarbers ? (
                                  <option value="" disabled>Loading barbers...</option>
                                ) : (
                                  <>
                                    {barberList.map((barber) => (
                                      <option key={barber._id} value={barber._id}>
                                        {barber.name} {barber.specialization ? `(${barber.specialization})` : ''}
                                      </option>
                                    ))}
                                    <option value="any">Any Available Barber</option>
                                  </>
                                )}
                              </select>
                            </div>
                            
                            <div className="col-12 mb-3">
                              <label htmlFor="date" className="form-label">Preferred Date*</label>
                              <input
                                type="date"
                                id="date"
                                name="date"
                                value={bookingData.date}
                                onChange={handleChange}
                                required
                                min={getMinDate()}
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-12 mb-3">
                              <label htmlFor="time" className="form-label">Chọn khung giờ dịch vụ*</label>
                              <input 
                                type="hidden" 
                                id="time" 
                                name="time" 
                                value={bookingData.time} 
                                required
                              />
                              <div className="time-slots-grid">
                                {isLoadingTimeSlots ? (
                                  <div className="text-center my-3">
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Đang tải các khung giờ...
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
                                            {time}
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                              {bookingData.date === formatDate(new Date()) && (
                                <small className="text-muted d-block mt-2">
                                  Time slots that have already passed or are within 30 minutes from now are disabled.
                                </small>
                              )}
                              {bookingData.barber_id && bookingData.date && timeSlotStatuses.length > 0 && (
                                <small className="text-muted d-block mt-2">
                                  Khung giờ được tô mờ đã có người đặt trước.
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Personal Information Section */}
                      <div className="col-12 mb-4">
                        <h3 className="h5 mb-3 booking-section-title">Your Information</h3>
                        <div className="card p-3 booking-section-card">
                          <div className="row">
                            <div className="col-12 mb-3">
                              <label htmlFor="name" className="form-label">Full Name*</label>
                              <input
                                type="text"
                                id="name"
                                name="name"
                                value={bookingData.name}
                                onChange={handleChange}
                                required
                                placeholder="Your full name"
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-12 mb-3">
                              <label htmlFor="phone" className="form-label">Phone Number*</label>
                              <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={bookingData.phone}
                                onChange={handleChange}
                                required
                                placeholder="(123) 456-7890"
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-12 mb-3">
                              <label htmlFor="email" className="form-label">Email Address*</label>
                              <input
                                type="email"
                                id="email"
                                name="email"
                                value={bookingData.email}
                                onChange={handleChange}
                                required
                                placeholder="your@email.com"
                                className="form-control booking-form-control"
                              />
                            </div>
                            
                            <div className="col-12 mb-3">
                              <label htmlFor="notes" className="form-label">Special Requests</label>
                              <textarea
                                id="notes"
                                name="notes"
                                value={bookingData.notes}
                                onChange={handleChange}
                                placeholder="Any specific requests or requirements"
                                className="form-control booking-form-control"
                                rows="3"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="col-12 mb-3">
                        <div className="form-check">
                          <input 
                            className="form-check-input booking-checkbox" 
                            type="checkbox" 
                            id="policyCheck" 
                            required
                          />
                          <label className="form-check-label" htmlFor="policyCheck">
                            I understand that a 24-hour cancellation notice is required to avoid a cancellation fee.
                          </label>
                        </div>
                      </div>
                      
                      <div className="col-12 mt-4">
                        <button
                          type="submit"
                          className="btn btn-lg w-100 booking-btn"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processing...
                            </>
                          ) : 'Book Appointment'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            {!bookingStatus.submitted && (
              <div className="card mt-4 policy-card">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;