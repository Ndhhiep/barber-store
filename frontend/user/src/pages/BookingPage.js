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
    services: [], // Thay đổi từ service đơn lẻ thành mảng services
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
    confirmedService: [],
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
  }, []);  // Check if a time slot should be disabled - wrapped in useCallback
  const isTimeSlotDisabled = useCallback((timeSlot) => {
    // Get total duration of selected services
    const totalDuration = calculateTotalDuration(bookingData.services);
    
    // If no services selected, only check basic availability
    if (totalDuration === 0) {
      if (timeSlotStatuses.length > 0) {
        const slotStatus = timeSlotStatuses.find(slot => slot.start_time === timeSlot);
        if (slotStatus) {
          return slotStatus.isPast || !slotStatus.isAvailable;
        }
      }
      return false;
    }
    
    // Check if this time slot and subsequent slots are available for the total duration
    return !checkTimeSlotAvailability(timeSlot, totalDuration);
  }, [timeSlotStatuses, bookingData.services]);
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
    };    fetchTimeSlotStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.barber_id, bookingData.date]);

  // Check if selected time is still valid when services change
  useEffect(() => {
    if (bookingData.time && bookingData.barber_id && bookingData.date && timeSlotStatuses.length > 0) {
      const totalDuration = calculateTotalDuration(bookingData.services);
      const isStillAvailable = checkTimeSlotAvailability(bookingData.time, totalDuration);
      
      if (!isStillAvailable) {
        setBookingData(prev => ({
          ...prev,
          time: '' // Reset time if no longer available with new service selection
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingData.services, timeSlotStatuses]);

  // Wrap `validateBookingToken` in a `useCallback` hook
  const validateBookingToken = useCallback(async (token) => {
    try {
      setIsValidatingToken(true);
  
      // Call API to validate the token
      const response = await axios.post(
        'http://localhost:5000/api/bookings/confirm',
        { token }
      );
  
      if (response.data.success) {        const { booking } = response.data;
  
        // Store confirmation info in booking status;
        setBookingStatus({
          submitted: false, // Changed to false since we're using modal instead
          error: false,
          errorMessage: '',
          confirmedDate: booking.date,
          confirmedTime: booking.time,
          confirmedService: booking.services && booking.services.length > 0 
            ? booking.services 
            : (booking.service ? [booking.service] : []), // Always store as array for consistency
          confirmedEmail: booking.email
        });
  
        // Clear pending booking data
        localStorage.removeItem('pendingBooking');        // Reset form data - works for both guest and logged-in users
        setBookingData({
          services: [], // Reset to empty array for multiple services
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
  ];  // Calculate total duration of all selected services
  const calculateTotalDuration = (services) => {
    if (!services || services.length === 0) return 0;
    
    // Calculate total duration from service data
    // If a service has a duration property, use it, otherwise default to 30 minutes
    return services.reduce((total, service) => {
      // Use service.duration if available, otherwise default to 30 minutes
      const serviceDuration = service.duration || 30;
      return total + serviceDuration;
    }, 0);
  };
  // Calculate end time given start time and duration
  const calculateEndTime = (startTime, durationMinutes) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };
  // Get detailed reason why a time slot is disabled
  const getTimeSlotDisabledReason = (timeSlot) => {
    const totalDuration = calculateTotalDuration(bookingData.services);
    
    if (totalDuration === 0) {
      if (timeSlotStatuses.length > 0) {
        const slotStatus = timeSlotStatuses.find(slot => slot.start_time === timeSlot);
        if (slotStatus) {
          if (slotStatus.isPast) return 'Time slot is in the past';
          if (!slotStatus.isAvailable) return 'Time slot is already booked';
        }
      }
      return 'Available';
    }

    // Check availability for the full duration
    const slotsNeeded = Math.ceil(totalDuration / 30);
    const startIndex = timeSlotStatuses.findIndex(slot => slot.start_time === timeSlot);
    
    if (startIndex === -1) return 'Time slot not found';
    
    // Calculate the actual end time of the appointment
    const appointmentEndTime = calculateEndTime(timeSlot, totalDuration);
    
    for (let i = 0; i < slotsNeeded; i++) {
      const slotIndex = startIndex + i;
      
      if (slotIndex >= timeSlotStatuses.length) {
        return `Not enough time remaining (need ${totalDuration} minutes until ${appointmentEndTime}, only ${timeSlotStatuses.length - startIndex} slots available)`;
      }
      
      const currentSlot = timeSlotStatuses[slotIndex];
      
      // For the last slot, check if the appointment would actually overlap with it
      if (i === slotsNeeded - 1) {
        const [slotHour, slotMinute] = currentSlot.start_time.split(':').map(Number);
        const slotStartMinutes = slotHour * 60 + slotMinute;
        
        const [endHour, endMinute] = appointmentEndTime.split(':').map(Number);
        const appointmentEndMinutes = endHour * 60 + endMinute;
        
        // If the appointment ends before or exactly at the start of this slot, we don't need to check it
        if (appointmentEndMinutes <= slotStartMinutes) {
          break;
        }
      }
      
      if (currentSlot.isPast) {
        return `Appointment would extend to ${appointmentEndTime}, but slot ${currentSlot.start_time} is in the past`;
      }
      
      if (!currentSlot.isAvailable) {
        return `Appointment would extend to ${appointmentEndTime}, but slot ${currentSlot.start_time} is already booked`;
      }
    }
    
    return `Available for ${totalDuration}-minute appointment (${timeSlot} - ${appointmentEndTime})`;
  };

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
  };  // Add a service to the booking
  const addService = (serviceId) => {
    // Find the service in the serviceList
    const serviceToAdd = serviceList.find(service => service._id === serviceId);
    
    if (serviceToAdd) {
      // Check if service is already added
      const isAlreadyAdded = bookingData.services.some(service => service._id === serviceId);
      if (isAlreadyAdded) {
        alert('This service is already selected.');
        return; // Don't add duplicate services
      }
      
      // Update the booking data with the new service
      setBookingData(prev => {
        const newServices = [...prev.services, serviceToAdd];
        const newTotalDuration = calculateTotalDuration(newServices);
        
        // Check if current selected time is still valid with new duration
        let newTime = prev.time;
        const previousTime = prev.time;
        
        if (prev.time && prev.barber_id && prev.date && timeSlotStatuses.length > 0) {
          const isStillAvailable = checkTimeSlotAvailability(prev.time, newTotalDuration);
          if (!isStillAvailable) {
            newTime = ''; // Reset time if no longer available
            console.log(`Time slot ${prev.time} is no longer available with new total duration of ${newTotalDuration} minutes`);
          }
        }
        
        // Log the changes
        console.log(`Added service: ${serviceToAdd.name} (${serviceToAdd.duration || 30} min). New total duration: ${newTotalDuration} minutes`);
        
        if (newTime !== previousTime) {
          console.log(`Time slot reset due to service addition. Previous: ${previousTime}, New: ${newTime}`);
        }
        
        return {
          ...prev,
          services: newServices,
          time: newTime
        };
      });
    }
  };
    // Remove a service from the booking
  const removeService = (serviceId) => {
    setBookingData(prev => {
      const serviceToRemove = prev.services.find(service => service._id === serviceId);
      const newServices = prev.services.filter(service => service._id !== serviceId);
      const newTotalDuration = calculateTotalDuration(newServices);
      
      // Check if current selected time is still valid with new duration
      let newTime = prev.time;
      if (prev.time && prev.barber_id && prev.date && timeSlotStatuses.length > 0) {
        // After removing a service, the time might still be valid or even more valid
        // We still need to check because the logic might have changed
        const isStillAvailable = checkTimeSlotAvailability(prev.time, newTotalDuration);
        if (!isStillAvailable) {
          newTime = ''; // Reset time if somehow no longer available
        }
      }
      
      console.log(`Removed service: ${serviceToRemove?.name} (${serviceToRemove?.duration || 30} min). New total duration: ${newTotalDuration} minutes`);
      
      if (newTime !== prev.time) {
        console.log(`Time slot reset due to service removal. Previous: ${prev.time}, New: ${newTime}`);
      }
      
      return {
        ...prev,
        services: newServices,
        time: newTime
      };
    });
  };const handleTimeSelect = (time) => {
    // Get total duration of selected services
    const totalDuration = calculateTotalDuration(bookingData.services);
    
    // If no services selected, allow time selection but show warning
    if (totalDuration === 0) {
      setBookingData(prev => ({
        ...prev,
        time
      }));
      return;
    }
    
    // Check if the time is available for the entire duration needed
    const isAvailable = checkTimeSlotAvailability(time, totalDuration);
    
    if (isAvailable) {
      setBookingData(prev => ({
        ...prev,
        time
      }));
      const endTime = calculateEndTime(time, totalDuration);
      console.log(`Selected time slot: ${time} - ${endTime} (${totalDuration} minutes total for ${bookingData.services.length} service${bookingData.services.length > 1 ? 's' : ''})`);
    } else {
      // Calculate end time and get detailed reason
      const endTime = calculateEndTime(time, totalDuration);
      const reason = getTimeSlotDisabledReason(time);
      
      // Show detailed message about unavailability
      console.log(`Cannot select ${time} - ${reason}`);
      
      // Create service breakdown for user message
      const serviceBreakdown = bookingData.services.map(service => 
        `• ${service.name}: ${service.duration || 30} minutes`
      ).join('\n');
      
      // Show user-friendly message with service breakdown
      alert(`⏰ Time Slot Unavailable\n\nThe selected time (${time} - ${endTime}) cannot accommodate your ${totalDuration}-minute appointment.\n\nSelected Services:\n${serviceBreakdown}\n\nReason: ${reason}\n\nPlease select a different time slot that can accommodate your full appointment duration.`);
    }
  };// Check if a time slot and subsequent slots (based on duration) are available
  const checkTimeSlotAvailability = (startTime, durationMinutes = 30) => {
    // If no time slots loaded from backend, assume available (fallback behavior)
    if (timeSlotStatuses.length === 0) return true;
    
    // Default to 30 minutes if no duration or services selected
    const minutes = durationMinutes > 0 ? durationMinutes : 30;
    
    // Calculate how many 30-minute slots we need (time slots are always in 30-minute intervals)
    // We need to check all slots that the appointment duration would overlap
    const slotsNeeded = Math.ceil(minutes / 30);
    
    // Find the index of the start time
    const startIndex = timeSlotStatuses.findIndex(slot => slot.start_time === startTime);
    if (startIndex === -1) {
      console.log(`Start time ${startTime} not found in available slots`);
      return false;
    }
    
    // Calculate the actual end time of the appointment
    const appointmentEndTime = calculateEndTime(startTime, minutes);
    
    // Check if all time slots that the appointment would overlap are available
    for (let i = 0; i < slotsNeeded; i++) {
      const slotIndex = startIndex + i;
      
      // If we run out of slots, return false
      if (slotIndex >= timeSlotStatuses.length) {
        console.log(`Time slot ${startTime} is not available for ${durationMinutes} minutes - not enough slots remaining (need ${slotsNeeded}, only ${timeSlotStatuses.length - startIndex} available)`);
        return false;
      }
      
      const currentSlot = timeSlotStatuses[slotIndex];
      
      // For the last slot, check if the appointment would actually overlap with it
      if (i === slotsNeeded - 1) {
        // Calculate the start time of this slot in minutes
        const [slotHour, slotMinute] = currentSlot.start_time.split(':').map(Number);
        const slotStartMinutes = slotHour * 60 + slotMinute;
        
        // Calculate the appointment end time in minutes
        const [endHour, endMinute] = appointmentEndTime.split(':').map(Number);
        const appointmentEndMinutes = endHour * 60 + endMinute;
        
        // If the appointment ends before or exactly at the start of this slot, we don't need to check it
        if (appointmentEndMinutes <= slotStartMinutes) {
          console.log(`Appointment ends at ${appointmentEndTime}, slot ${currentSlot.start_time} starts at or after appointment end - no overlap`);
          break;
        }
      }
      
      // Check if the current slot is past or unavailable
      if (currentSlot.isPast || !currentSlot.isAvailable) {
        const reason = currentSlot.isPast ? 'in the past' : 'unavailable';
        console.log(`Time slot ${startTime}-${appointmentEndTime} (${durationMinutes} min) is not available - slot ${currentSlot.start_time} (${i+1} of ${slotsNeeded}) is ${reason}`);
        return false;
      }
    }
      console.log(`Time slot ${startTime}-${appointmentEndTime} (${durationMinutes} min) is available - all required time slots are available`);
    return true;
  };
    const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that at least one service is selected
    if (bookingData.services.length === 0) {
      setBookingStatus({
        submitted: false,
        error: true,
        errorMessage: 'Please select at least one service for your appointment.'
      });
      return; // Prevent form submission
    }
    
    setIsLoading(true);
    
    try {
      // Include authentication token if user is logged in
      const headers = {};
      const token = localStorage.getItem('token');
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }        // Create a copy of the booking data to preserve for confirmation display
      const confirmedBookingData = {...bookingData};
      
      // Convert service objects to names for display in confirmation
      const serviceNames = bookingData.services.map(service => service.name);
      
      // Create the request data with service names instead of IDs
      const requestData = {
        ...bookingData,
        services: bookingData.services.map(service => service.name), // Convert service objects to names as required by the backend
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
        serviceNames: serviceNames,
        date: confirmedBookingData.date,
        time: confirmedBookingData.time,
        email: confirmedBookingData.email,
        totalDuration: calculateTotalDuration(bookingData.services)
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
    <div className="booking-page">      {/* Page Title Section */}
      <div className="page-title-section py-4 py-md-5">
        <div className="container text-center">
          <h1 className="display-5 display-md-4 mb-3 page-title">Book Your Appointment</h1>
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
        <div className="container booking-page-container" style={{ marginTop: '30px' }}>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-10 col-xl-8">
            <div className="card booking-card" style={{borderRadius: '5px' }}>
              <div className="card-body p-3 p-md-4 p-lg-5">
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
                    )}                    <div className="row g-3 g-md-4">                      {/* Service Details Section */}
                      <div className="col-12 mb-3 mb-md-4">                        <h3 className="h6 h-md-5 mb-3 booking-section-title">
                          <i className="bi bi-calendar2-check me-2"></i>Service Details
                        </h3>
                        <div className="card p-3 p-md-4 booking-section-card no-hover-effect">
                          <div className="row g-3">                            <div className="col-12 mb-3 mb-md-4">
                              <label className="form-label fw-bold">
                                <i className="bi bi-scissors me-2"></i>Select Services*
                              </label>                              {/* Display Selected Services */}
                              {bookingData.services.length > 0 && (
                                <div className="selected-services mb-3">
                                  {bookingData.services.map(service => (
                                    <div key={service._id} className="selected-service-item d-flex justify-content-between align-items-center p-2 mb-2 border rounded bg-light">
                                      <div>
                                        <span className="me-2 fw-medium">{service.name}</span>
                                        <small className="text-muted">({formatPrice(service.price)} - {service.duration || 30} min)</small>
                                      </div>
                                      <button 
                                        type="button" 
                                        className="btn btn-sm btn-outline-danger" 
                                        onClick={() => removeService(service._id)}
                                      >
                                        <i className="bi bi-x"></i>
                                      </button>
                                    </div>
                                  ))}                                  {/* Enhanced Total Duration Display */}
                                  <div className="mt-3 p-3 total-duration-highlight">
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-clock-history text-primary me-2 fs-5"></i>
                                        <span className="fw-semibold text-primary">Total Duration:</span>
                                      </div>
                                      <span className="badge bg-primary fs-6 px-3 py-2">
                                        {calculateTotalDuration(bookingData.services)} minutes
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        When you select a time slot, it will reserve {calculateTotalDuration(bookingData.services)} minutes of consecutive time
                                        {bookingData.time && (
                                          <span className="text-success fw-medium">
                                            {' '}({bookingData.time} - {calculateEndTime(bookingData.time, calculateTotalDuration(bookingData.services))})
                                          </span>
                                        )}
                                      </small>
                                    </div>
                                    {bookingData.services.length > 1 && (
                                      <div className="mt-2 pt-2 border-top border-primary border-opacity-25">
                                        <small className="text-primary">
                                          <i className="bi bi-list-ul me-1"></i>
                                          <strong>Service Breakdown:</strong>
                                        </small>                                        <div className="mt-1">
                                          {bookingData.services.map((service, index) => (
                                            <div key={service._id} className="service-breakdown-item">
                                              <small className="text-muted">
                                                <span className="fw-medium text-dark">{index + 1}. {service.name}</span>
                                                <span className="text-primary ms-2">({service.duration || 30} min)</span>
                                              </small>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Service Selection Dropdown with Add Button */}
                              <div className="input-group">
                                <select
                                  id="serviceSelect"
                                  className="form-select booking-form-control no-hover-effect"
                                  disabled={loadingServices}
                                  value=""
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addService(e.target.value);
                                      e.target.value = ""; // Reset select after adding
                                    }
                                  }}
                                >
                                  <option value="">-- Add a service --</option>
                                  {loadingServices ? (
                                    <option value="" disabled>Loading services...</option>
                                  ) : serviceList.length > 0 ? (                                    serviceList.map((service) => (
                                      <option key={service._id} value={service._id}>
                                        {service.name} - {formatPrice(service.price)} ({service.duration || 30} min)
                                      </option>
                                    ))
                                  ) : (
                                    <option value="" disabled>No services available</option>
                                  )}
                                </select>
                                <button 
                                  type="button" 
                                  className="btn btn-primary"
                                  onClick={() => {
                                    const select = document.getElementById('serviceSelect');
                                    if (select.value) {
                                      addService(select.value);
                                      select.value = "";
                                    }
                                  }}
                                >
                                  <i className="bi bi-plus-lg"></i> Add
                                </button>
                              </div>                              {bookingData.services.length === 0 && (
                                <div className="alert alert-info">
                                  <i className="bi bi-info-circle me-2"></i>
                                  <strong>Select Your Services:</strong> You can choose multiple services for your appointment. The total time required will be calculated and consecutive time slots will be reserved.
                                </div>
                              )}
                              <small className="text-muted mt-1 d-block">
                                Choose the services you'd like to book
                              </small>
                            </div><div className="col-12 mb-3 mb-md-4">
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
                            </div>                              <div className="col-12 mb-3 mb-md-4">
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
                            </div>                              <div className="col-12 mb-3 mb-md-4">
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
                                    ) : (                                      <div className="row g-2">
                                        {(timeSlotStatuses.length > 0 ? timeSlotStatuses.map(slot => slot.start_time) : timeSlots).map((time, index) => {
                                          const disabled = isTimeSlotDisabled(time);
                                          const isSelected = bookingData.time === time;
                                          const totalDuration = calculateTotalDuration(bookingData.services);
                                          
                                          // Check if this slot is part of the selected time range
                                          let isInSelectedRange = false;
                                          let isEndOfRange = false;
                                          let isExactEndTime = false;
                                          
                                          if (bookingData.time && totalDuration > 0) {
                                            const allTimeSlots = timeSlotStatuses.length > 0 ? timeSlotStatuses.map(slot => slot.start_time) : timeSlots;
                                            const selectedIndex = allTimeSlots.indexOf(bookingData.time);
                                            const currentIndex = index;
                                            
                                            if (selectedIndex >= 0) {
                                              // Calculate appointment end time
                                              const appointmentEndTime = calculateEndTime(bookingData.time, totalDuration);
                                              
                                              // Convert times to minutes for comparison
                                              const [currentHour, currentMinute] = time.split(':').map(Number);
                                              const currentTimeMinutes = currentHour * 60 + currentMinute;
                                              
                                              const [selectedHour, selectedMinute] = bookingData.time.split(':').map(Number);
                                              const selectedTimeMinutes = selectedHour * 60 + selectedMinute;
                                              
                                              const [endHour, endMinute] = appointmentEndTime.split(':').map(Number);
                                              const endTimeMinutes = endHour * 60 + endMinute;
                                              
                                              // Check if this slot overlaps with the appointment duration
                                              const slotEndMinutes = currentTimeMinutes + 30; // Each slot is 30 minutes
                                              
                                              if (currentTimeMinutes >= selectedTimeMinutes && currentTimeMinutes < endTimeMinutes) {
                                                isInSelectedRange = true;
                                                
                                                // Check if this is the last slot that the appointment overlaps
                                                if (slotEndMinutes >= endTimeMinutes) {
                                                  isEndOfRange = true;
                                                  // Check if the appointment ends exactly at the start of the next slot
                                                  if (endTimeMinutes === slotEndMinutes) {
                                                    isExactEndTime = true;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                          
                                          return (
                                            <div key={index} className="col-6 col-sm-4 col-md-3 col-lg-2">
                                              <button
                                                type="button"
                                                className={`btn time-slot-btn w-100 position-relative ${
                                                  isSelected ? 'active' : ''
                                                } ${
                                                  disabled ? 'disabled' : ''
                                                } ${
                                                  isInSelectedRange && !isSelected ? 'selected-range' : ''
                                                }`}
                                                onClick={() => !disabled && handleTimeSelect(time)}
                                                disabled={disabled}
                                                title={
                                                  disabled 
                                                    ? getTimeSlotDisabledReason(time)
                                                    : isInSelectedRange 
                                                      ? `Part of your ${totalDuration}-minute appointment (${bookingData.time} - ${calculateEndTime(bookingData.time, totalDuration)})`
                                                      : totalDuration > 0
                                                        ? `Click to book ${totalDuration}-minute appointment (${time} - ${calculateEndTime(time, totalDuration)})`
                                                        : `Available time slot`
                                                }
                                              >
                                                <i className={`bi bi-${disabled ? 'lock-fill' : isInSelectedRange ? 'check-circle-fill' : 'clock'} me-1 small`}></i>
                                                {time}
                                                
                                              </button>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>                              <div className="d-flex mt-2 align-items-center">
                                <i className="bi bi-info-circle text-primary me-2"></i>
                                <div>
                                  {bookingData.services.length > 0 && (
                                    <small className="text-success d-block mb-1 fw-semibold">
                                      <i className="bi bi-check-circle me-1"></i>
                                      Services selected: {bookingData.services.length} service{bookingData.services.length > 1 ? 's' : ''} requiring {calculateTotalDuration(bookingData.services)} minutes total
                                    </small>
                                  )}
                                  {bookingData.date === formatDate(new Date()) && (
                                    <small className="text-muted d-block">
                                      <i className="bi bi-clock-history me-1"></i> Past time slots or slots within 30 minutes are disabled
                                    </small>
                                  )}
                                  {bookingData.barber_id && bookingData.date && timeSlotStatuses.length > 0 && (
                                    <small className="text-muted d-block">
                                      <i className="bi bi-lock me-1"></i> 
                                      {bookingData.services.length > 0 
                                        ? `Time slots without ${calculateTotalDuration(bookingData.services)} minutes of consecutive availability are disabled`
                                        : 'Grayed out time slots are unavailable'
                                      }
                                    </small>
                                  )}
                                  {(!bookingData.barber_id || !bookingData.date) && (
                                    <small className="text-muted d-block">
                                      <i className="bi bi-info-circle me-1"></i> Select both a barber and date to see available time slots
                                    </small>
                                  )}                                  {bookingData.services.length === 0 && (
                                    <small className="text-info d-block">
                                      <i className="bi bi-lightbulb me-1"></i> Select services first to see which time slots can accommodate your full appointment
                                    </small>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>                        {/* Personal Information Section */}
                      <div className="col-12 mb-3 mb-md-4">
                        <h3 className="h6 h-md-5 mb-3 booking-section-title">
                          <i className="bi bi-person-circle me-2"></i>Your Information
                        </h3>
                        <div className="card p-3 p-md-4 booking-section-card shadow-sm">
                          <div className="row g-3">
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
                            <div className="col-12 col-md-6 mb-3">
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
                            <div className="col-12 col-md-6 mb-3">
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
