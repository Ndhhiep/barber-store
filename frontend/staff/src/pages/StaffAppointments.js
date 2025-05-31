import React, { useState, useEffect, useCallback, useRef } from 'react';
import staffAppointmentService from '../services/staffAppointmentService';
import staffBarberService from '../services/staffBarberService';
import staffService from '../services/staffService';
import staffTimeSlotService from '../services/staffTimeSlotService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import normalizeBookingData from '../utils/bookingDataNormalizer';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import '../css/StaffAppointments.css';

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  // State cho modal chi tiết appointment
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
    // State cho modal Edit appointment
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    services: [],
    barberId: '',
    date: null,
    time: '',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
    // State cho danh sách services và barbers
  const [availableServices, setAvailableServices] = useState([]);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  
  // State cho time slots
  const [timeSlots] = useState([
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00"
  ]);
  const [showServiceSelector, setShowServiceSelector] = useState(false);
  // State cho message hiển thị
  const [message, setMessage] = useState({ type: '', text: '' });
  const [successMessage, setSuccessMessage] = useState(''); // State for toast-style success messages
  
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // State cho time slots
  const [timeSlotStatuses, setTimeSlotStatuses] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  
  // Default time slots fallback
  const defaultTimeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00"
  ];
  
  // State phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const APPOINTMENTS_PER_PAGE = 10;
  
  // Ref cho container chính để xử lý click
  const containerRef = useRef(null);
    // Sử dụng Socket.IO context
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();
    // Sử dụng NotificationContext để xóa thông báo khi truy cập trang appointments
  const { clearBookingNotifications, newBookingIds, removeNewBookingId } = useNotifications();
  // Load available services and barbers
  const loadFormData = useCallback(async () => {
    try {
      const [servicesResponse, barbersResponse] = await Promise.all([
        staffService.getAllServices(),
        staffBarberService.getAllBarbersForStaff()
      ]);
      
      console.log('Services response:', servicesResponse);
      console.log('Barbers response:', barbersResponse);
      
      // Handle services response
      const services = servicesResponse?.services || servicesResponse?.data || servicesResponse || [];
      setAvailableServices(Array.isArray(services) ? services : []);
      
      // Handle barbers response - based on the structure in getAllBarbersForStaff
      let barbers = [];
      if (barbersResponse?.data?.barbers && Array.isArray(barbersResponse.data.barbers)) {
        barbers = barbersResponse.data.barbers;
      } else if (barbersResponse?.barbers && Array.isArray(barbersResponse.barbers)) {
        barbers = barbersResponse.barbers;
      } else if (Array.isArray(barbersResponse)) {
        barbers = barbersResponse;
      }
      
      setAvailableBarbers(barbers);
      
    } catch (err) {
      console.error('Error loading form data:', err);
      // Set empty arrays as fallback
      setAvailableServices([]);
      setAvailableBarbers([]);
    }
  }, []);
  
  // Định nghĩa hàm fetchAppointments trước khi sử dụng
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      switch(activeFilter) {
        case 'today':
          response = await staffAppointmentService.getTodayAppointments(currentPage, APPOINTMENTS_PER_PAGE);
          break;
        case 'week':
          response = await staffAppointmentService.getWeekAppointments(currentPage, APPOINTMENTS_PER_PAGE);
          break;
        case 'all':
        default:
          response = await staffAppointmentService.getAllAppointments(currentPage, APPOINTMENTS_PER_PAGE);
          break;
      }      
      // Sắp xếp appointments từ mới nhất đến cũ nhất
      const sortedAppointments = (response.bookings || []).sort((a, b) => {
        // So sánh ngày
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateB.getTime() - dateA.getTime(); // Sắp xếp theo ngày giảm dần (mới nhất trước)
        }
        
        // Nếu cùng ngày, so sánh giờ
        const timeA = new Date(`2000-01-01T${a.time}`);
        const timeB = new Date(`2000-01-01T${b.time}`);
        return timeB - timeA; // Sắp xếp theo giờ giảm dần
      });
        
      // Update the appointments state without filtering first
      setAppointments(sortedAppointments);
      
      // Let the dedicated phone search effect handle the filtering
      // This prevents duplicate filtering logic
      if (!phoneSearchQuery) {
        setFilteredAppointments(sortedAppointments);
      }
      
      // Set total pages
      if (response.totalPages) {
        setTotalPages(response.totalPages);
      } else if (response.totalCount) {
        // Calculate total pages if only total count is provided
        setTotalPages(Math.ceil(response.totalCount / APPOINTMENTS_PER_PAGE));
      } else {
        // Fallback if pagination info is not provided
        setTotalPages(Math.max(1, Math.ceil(sortedAppointments.length / APPOINTMENTS_PER_PAGE)));
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentPage, APPOINTMENTS_PER_PAGE, phoneSearchQuery]); // These are the only dependencies needed
  // Xóa thông báo đặt lịch khi component mount
  useEffect(() => {
    clearBookingNotifications();
    
    // Đăng ký event listener để xóa thông báo và date picker khi click bất kỳ đâu trên trang
    const handleClickAnywhere = (event) => {
      clearBookingNotifications();
      
      // Close date picker when clicking outside
      if (showDatePicker) {
        const datePickerElements = document.querySelectorAll('.date-picker-dropdown, .date-filter button');
        let clickedInside = false;
        datePickerElements.forEach(element => {
          if (element.contains(event.target)) {
            clickedInside = true;
          }
        });
        
        if (!clickedInside) {
          setShowDatePicker(false);
        }
      }
    };
    
    // Đăng ký event listener
    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.addEventListener('click', handleClickAnywhere);
    }
    
    // Add document-level event listener to catch all clicks
    document.addEventListener('mousedown', handleClickAnywhere);
    
    // Cleanup event listener khi component unmount
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('click', handleClickAnywhere);
      }
      document.removeEventListener('mousedown', handleClickAnywhere);
    };
  }, [clearBookingNotifications, showDatePicker]);
    // Handle phone search filter separately to avoid full data reload
  useEffect(() => {
    if (!appointments.length) {
      return; // Skip when no appointments loaded
    }
    
    // If we have a specific date filter active, that effect will handle filtering
    if (activeFilter === 'specific-date') {
      return;
    }
    
    if (!phoneSearchQuery.trim()) {
      // Apply all appointments when query is empty (no filtering needed)
      setFilteredAppointments(appointments);
      return;
    }
    
    // Filter by phone
    const filtered = appointments.filter(appointment => {
      const phone = appointment.phone || appointment.userPhone || '';
      return phone.toLowerCase().includes(phoneSearchQuery.toLowerCase());
    });
    
    setFilteredAppointments(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE)));  }, [phoneSearchQuery, appointments, activeFilter, APPOINTMENTS_PER_PAGE]);

  // Auto-hide success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
    
  // This effect handles API calls when filter changes
useEffect(() => {
    // Only fetch from server when not using specific date filter
    if (activeFilter !== 'specific-date') {
      fetchAppointments();
    }
  }, [activeFilter, currentPage, fetchAppointments, APPOINTMENTS_PER_PAGE]);

  // This separate effect handles client-side date filtering
  useEffect(() => {
    // Only run this effect when we have a specific date filter
    if (activeFilter === 'specific-date' && selectedDate && appointments.length > 0) {
      const filtered = appointments.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        const selectedDateObj = new Date(selectedDate);
        
        return (
          appointmentDate.getFullYear() === selectedDateObj.getFullYear() &&
          appointmentDate.getMonth() === selectedDateObj.getMonth() &&
          appointmentDate.getDate() === selectedDateObj.getDate()
        );
      });
      
      setFilteredAppointments(filtered);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE)));
    }
  }, [activeFilter, selectedDate, appointments, APPOINTMENTS_PER_PAGE]); // Include appointments as dependency in this specific effect
  
  // Xử lý sự kiện cập nhật booking từ Socket.IO
  const handleNewBooking = useCallback(async (data) => {
    try {
      console.log('Received new booking event:', data);      
      // Kiểm tra nếu là sự kiện thêm mới booking
      if (data.operationType === 'insert' && data.fullDocument) {
        // Kiểm tra xem booking mới có phù hợp với bộ lọc hiện tại không
        const rawBooking = data.fullDocument;
        
        // Log the full document structure to help with debugging
        console.log('Full booking document structure:', JSON.stringify(rawBooking, null, 2));
        
        // Normalize booking data to ensure consistent field access
        const newBooking = normalizeBookingData(rawBooking);
        console.log('Normalized booking data:', newBooking);
        
        // Use function to get current filter value at execution time rather than 
        // depending on the activeFilter state variable in the dependency array
        const shouldAddBasedOnFilter = () => {
          // Get current filter value at execution time
          const currentFilter = activeFilter;
          
          if (currentFilter === 'all') {
            return true;
          } else if (currentFilter === 'today') {
            const today = new Date().toISOString().split('T')[0];
            const bookingDate = new Date(newBooking.date).toISOString().split('T')[0];
            return bookingDate === today;
          } else if (currentFilter === 'week') {
            const now = new Date();
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(now);
            weekEnd.setDate(now.getDate() + (6 - now.getDay()));
            weekEnd.setHours(23, 59, 59, 999);
            
            const bookingDate = new Date(newBooking.date);
            return bookingDate >= weekStart && bookingDate <= weekEnd;
          }
          return false;
        };
        
        const shouldAdd = shouldAddBasedOnFilter();
        
        if (shouldAdd) {
          // Lấy chi tiết booking đầy đủ từ server
          try {
            const response = await staffAppointmentService.getAppointmentById(newBooking._id);
            
            // Normalize both data sources
            const normalizedResponse = normalizeBookingData(response);
            
            // Merge both normalized data sources with preference to API data
            const completeBooking = {
              ...newBooking,  // Start with socket data
              ...normalizedResponse,  // Override with API data when available
            };
            
            console.log('Complete booking with user info:', completeBooking);
            
            // Thêm booking mới và sắp xếp lại các appointments theo thời gian
            setAppointments(prev => {
              const updatedAppointments = [...prev, completeBooking];
              
              // Sắp xếp lại từ mới nhất đến cũ nhất
              return updatedAppointments.sort((a, b) => {
                // So sánh ngày
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                
                if (dateA.getTime() !== dateB.getTime()) {
                  return dateB.getTime() - dateA.getTime(); // Sắp xếp theo ngày giảm dần
                }
                
                // Nếu cùng ngày, so sánh giờ
                const timeA = new Date(`2000-01-01T${a.time}`);
                const timeB = new Date(`2000-01-01T${b.time}`);
                return timeB - timeA; // Sắp xếp theo giờ giảm dần
              });
            });
              // Badge management is now handled by NotificationContext
          } catch (err) {
            console.error('Error fetching complete booking data:', err);
            // Nếu không lấy được thông tin đầy đủ, vẫn hiển thị dữ liệu có sẵn
            // Extract user data from fullDocument
            const userData = newBooking.user || {};
            
            // Process userData from fullDocument to extract nested fields
            let extractedUserName = '';
            let extractedEmail = '';
            let extractedPhone = '';
            
            if (userData && typeof userData === 'object') {
              extractedUserName = userData.name || '';
              extractedEmail = userData.email || '';
              extractedPhone = userData.phone || '';
            }
            
            // Xử lý dữ liệu người dùng một cách tốt nhất từ dữ liệu hiện có
            const fallbackBooking = {
              ...newBooking,
              userName: extractedUserName || newBooking.userName || newBooking.name || 
                      (newBooking.user && typeof newBooking.user === 'object' ? newBooking.user.name : null) || 'N/A',
              userEmail: extractedEmail || newBooking.userEmail || newBooking.email || 
                       (newBooking.user && typeof newBooking.user === 'object' ? newBooking.user.email : null) || 'N/A',
              userPhone: extractedPhone || newBooking.userPhone || newBooking.phone || 
                       (newBooking.user && typeof newBooking.user === 'object' ? newBooking.user.phone : null) || 'N/A',
              barberName: newBooking.barberName || (newBooking.barber_id && typeof newBooking.barber_id === 'object' ? newBooking.barber_id.name : 'Any Available')
            };
            
            console.log('Using fallback booking data:', fallbackBooking);
              setAppointments(prev => {
              const updatedAppointments = [...prev, fallbackBooking];
              return updatedAppointments.sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateA.getTime() !== dateB.getTime()) {
                  return dateB.getTime() - dateA.getTime();
                }
                const timeA = new Date(`2000-01-01T${a.time}`);
                const timeB = new Date(`2000-01-01T${b.time}`);
                return timeB - timeA;
              });
            });
            
            // Badge management is now handled by NotificationContext
            // No need to manually add new booking IDs here as it's done in the context
          }
        }
      }      // Nếu là sự kiện cập nhật
      else if (data.operationType === 'update' && data.documentId) {
        // Nếu là sự kiện cập nhật, cập nhật booking trong state
        setAppointments(prevAppointments => {
          const updatedAppointments = prevAppointments.map(appointment => 
            appointment._id === data.documentId 
              ? { ...appointment, ...(data.updateDescription?.updatedFields || {}) } 
              : appointment
          );
          return updatedAppointments;
        });
        
        // Apply the same update to filteredAppointments
        setFilteredAppointments(prev => 
          prev.map(appointment => 
            appointment._id === data.documentId 
              ? { ...appointment, ...(data.updateDescription?.updatedFields || {}) } 
              : appointment
          )
        );
      }    } catch (err) {
      console.error('Error processing booking data:', err);
      // Chỉ ghi log lỗi, không cập nhật state
    }
  }, [activeFilter]); // State setter functions are stable and don't need to be in dependencies
  
  // Lắng nghe sự kiện booking mới từ Socket.IO
  useEffect(() => {
    if (!isConnected) return;
    
    console.log('Setting up socket listeners in StaffAppointments');
    
    // Đăng ký handler cho sự kiện 'newBooking'
    registerHandler('newBooking', handleNewBooking);
    
    // Cleanup khi component unmount
    return () => {
      console.log('Cleaning up socket listeners in StaffAppointments');
      unregisterHandler('newBooking', handleNewBooking);
    };
  }, [isConnected, registerHandler, unregisterHandler, handleNewBooking]);
  
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await staffAppointmentService.updateAppointmentStatus(id, newStatus);
      
      // Update the local state to reflect the change
      const updatedAppointments = appointments.map(appointment => 
        appointment._id === id ? { ...appointment, status: newStatus } : appointment
      );
      setAppointments(updatedAppointments);
      
      // Also update filtered appointments if needed
      setFilteredAppointments(
        filteredAppointments.map(appointment => 
          appointment._id === id ? { ...appointment, status: newStatus } : appointment
        )
      );
      
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Failed to update appointment status. Please try again.');
    }
  };
    // These functions have been removed as they were unused
  
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
    const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
    // Handle page change for pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  // Handle date selection
  const handleDateSelect = (date) => {
    // First change state that will trigger effect
    setSelectedDate(date);
    setActiveFilter('specific-date');
    setCurrentPage(1); // Reset to first page
    setShowDatePicker(false);
    
    // Filter will be done by the useEffect - don't duplicate state updates
    // Let the useEffect handle filtering to avoid multiple renders
  };// Toggle date picker functionality incorporated directly where needed
    // Handle filter change with page reset
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when changing filters
    
    // If switching to a preset filter from specific date, clear the selected date
    if (filter !== 'specific-date') {
      setSelectedDate(null);
    }
    
    // The useEffect will handle filtering based on the changed state
    // Don't manually update filteredAppointments here to avoid multiple renders
  };    // Handle phone search
  const handlePhoneSearch = (query) => {
    setPhoneSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
    
    // Let fetchAppointments handle the filtering based on phoneSearchQuery
    // This will be picked up by useEffect through the fetchAppointments dependency
  };
  // Hiển thị modal chi tiết appointment
  const handleViewAppointment = async (appointment) => {
    try {
      // Fetch complete appointment details with populated services
      let fullAppointment = appointment;
      try {
        const appointmentDetails = await staffAppointmentService.getAppointmentById(appointment._id);
        fullAppointment = appointmentDetails.booking || appointmentDetails;
        console.log('Fetched full appointment details for view:', fullAppointment);
      } catch (err) {
        console.log('Could not fetch full appointment details for view, using existing data:', err);
      }
      
      // Chuẩn hóa dữ liệu appointment trước khi hiển thị
      const normalizedAppointment = normalizeBookingData(fullAppointment);
      
      // Xóa đánh dấu 'NEW' nếu có
      if (newBookingIds.has(appointment._id)) {
        removeNewBookingId(appointment._id);
      }
      
      // Ensure availableServices is loaded
      if (availableServices.length === 0) {
        await loadFormData();
      }
      
      setSelectedAppointment(normalizedAppointment);
      // Add body class for modal open state
      document.body.classList.add('modal-open');
      setShowAppointmentModal(true);
    } catch (error) {
      console.error('Error opening appointment details:', error);
      showMessage('error', 'Failed to load appointment details');
    }
  };// Đóng modal chi tiết appointment
  const closeAppointmentModal = () => {
    // Add animation class for smooth exit
    document.body.classList.remove('modal-open');
    setShowAppointmentModal(false);
    
    // Đặt timeout để đợi animation đóng modal hoàn tất
    setTimeout(() => {
      setSelectedAppointment(null);
    }, 300);
  };
  // Show message to user
  const showMessage = (type, text) => {
    if (type === 'success') {
      setSuccessMessage(text);
    } else {
      setMessage({ type, text });
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    }
  };
  // Handle open edit appointment modal
  const handleEditAppointment = async (appointment) => {
    try {
      // Ensure form data is loaded before opening edit modal
      if (availableServices.length === 0 || availableBarbers.length === 0) {
        console.log('Loading form data first...');
        await loadFormData();
        // Wait for state to properly update
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // Double-check that services are loaded
      let retryCount = 0;
      while (availableServices.length === 0 && retryCount < 3) {
        console.log(`Retry ${retryCount + 1}: Services not loaded yet, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 200));
        retryCount++;
      }
      
      if (availableServices.length === 0) {
        console.warn('Services not loaded after retries, proceeding anyway...');
      }
      
      // Fetch full appointment details to ensure we have populated data
      let fullAppointment = appointment;
      try {
        const appointmentDetails = await staffAppointmentService.getAppointmentById(appointment._id);
        fullAppointment = appointmentDetails.booking || appointmentDetails;
        console.log('Fetched full appointment details:', fullAppointment);
      } catch (err) {
        console.log('Could not fetch full appointment details, using existing data:', err);
      }
        const normalizedAppointment = normalizeBookingData(fullAppointment);
      setSelectedAppointment(normalizedAppointment);
      
      // Pre-fill form with existing data
      console.log('Original appointment:', appointment);
      console.log('Full appointment:', fullAppointment);
      console.log('Normalized appointment:', normalizedAppointment);
      console.log('Available services at edit time:', availableServices);
      console.log('Available barbers at edit time:', availableBarbers);
      
      // Process the data immediately since we've ensured services are loaded
      const processedData = processAppointmentData(normalizedAppointment);
      
      setFormData(processedData);
      setFormErrors({});
      setShowAddEditModal(true);
      document.body.classList.add('modal-open');
      
    } catch (err) {
      console.error('Error opening edit modal:', err);
      showMessage('error', 'Failed to load appointment data for editing');
    }
  };
  // Helper function to process appointment data for editing
  const processAppointmentData = (normalizedAppointment) => {
    console.log('=== PROCESSING APPOINTMENT DATA ===');
    console.log('normalizedAppointment:', normalizedAppointment);
    console.log('availableServices at processing time:', availableServices);
    
    // Map services - handle different service data formats
    let selectedServices = [];
    
    // Check for service_id field first (direct ID reference)
    if (normalizedAppointment.service_id) {
      console.log('Found service_id field:', normalizedAppointment.service_id);
      selectedServices = Array.isArray(normalizedAppointment.service_id) 
        ? normalizedAppointment.service_id 
        : [normalizedAppointment.service_id];
    }
    // Check for services array
    else if (normalizedAppointment.services && Array.isArray(normalizedAppointment.services)) {
      console.log('Found services array:', normalizedAppointment.services);
      selectedServices = normalizedAppointment.services.map(service => {
        console.log('Processing service:', service, 'type:', typeof service);
        
        // Handle service objects with _id property
        if (typeof service === 'object' && service !== null && service._id) {
          console.log('Service object with _id:', service._id);
          return service._id;
        } 
        // Handle plain object IDs (MongoDB ObjectIds as strings)
        else if (typeof service === 'string' && service.match(/^[0-9a-fA-F]{24}$/)) {
          console.log('Valid ObjectId string:', service);
          return service;
        }
        // Handle service names - try to find matching service by name
        else if (typeof service === 'string') {
          console.log('String service name, searching for:', service);
          const foundService = availableServices.find(s => 
            s._id === service || s.name === service
          );
          console.log('Found service by name search:', foundService);
          return foundService ? foundService._id : service;
        }
        return service;
      }).filter(Boolean);
    }
    // Try to find by service name
    else if (normalizedAppointment.serviceName && normalizedAppointment.serviceName !== 'N/A') {
      console.log('Found serviceName field:', normalizedAppointment.serviceName);
      const serviceNames = normalizedAppointment.serviceName.split(', ');
      selectedServices = serviceNames.map(serviceName => {
        const foundService = availableServices.find(s => s.name === serviceName.trim());
        console.log(`Service name "${serviceName}" -> found:`, foundService);
        return foundService ? foundService._id : null;
      }).filter(Boolean);
    }
    
    console.log('Selected services after processing:', selectedServices);
    
    // Map barber ID
    let selectedBarberId = '';
    if (normalizedAppointment.barber_id) {
      if (typeof normalizedAppointment.barber_id === 'object' && normalizedAppointment.barber_id._id) {
        selectedBarberId = normalizedAppointment.barber_id._id;
      } else if (typeof normalizedAppointment.barber_id === 'string') {
        selectedBarberId = normalizedAppointment.barber_id;
      }
    } else if (normalizedAppointment.barberId) {
      selectedBarberId = normalizedAppointment.barberId;
    }
    
    console.log('Selected barber ID after processing:', selectedBarberId);
    
    return {
      customerName: normalizedAppointment.userName || normalizedAppointment.name || '',
      customerPhone: normalizedAppointment.userPhone || normalizedAppointment.phone || '',
      customerEmail: normalizedAppointment.userEmail || normalizedAppointment.email || '',
      services: selectedServices,
      barberId: selectedBarberId,
      date: normalizedAppointment.date ? new Date(normalizedAppointment.date) : null,
      time: normalizedAppointment.time || '',
      notes: normalizedAppointment.notes || ''
    };
  };

  // Close add/edit modal
  const closeAddEditModal = () => {
    document.body.classList.remove('modal-open');
    setShowAddEditModal(false);
    setTimeout(() => {
      setSelectedAppointment(null);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        services: [],
        barberId: '',
        date: null,
        time: '',
        notes: ''
      });
      setFormErrors({});
    }, 300);
  };

  // Validate form data
  const validateForm = () => {
    const errors = {};
    
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }
    
    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Customer phone is required';
    } else if (!/^\d{10,11}$/.test(formData.customerPhone.replace(/\D/g, ''))) {
      errors.customerPhone = 'Phone number must be 10-11 digits';
    }
    
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }
    
    if (formData.services.length === 0) {
      errors.services = 'At least one service must be selected';
    }
    
    if (!formData.date) {
      errors.date = 'Date is required';
    }
    
    if (!formData.time) {
      errors.time = 'Time is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      // Ensure services are properly formatted as string IDs
      const formattedServices = formData.services.map(service => {
        if (typeof service === 'object' && service._id) {
          return service._id;
        }
        return service;
      });
      
      const appointmentData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        services: formattedServices,
        barberId: formData.barberId || undefined,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time,
        notes: formData.notes || undefined
      };
        // Update appointment
      const response = await staffAppointmentService.updateAppointment(selectedAppointment._id, appointmentData);
      
      // Update appointment in local state
      const updatedAppointment = normalizeBookingData(response.booking || response);
      setAppointments(prev => 
        prev.map(appointment => 
          appointment._id === selectedAppointment._id ? updatedAppointment : appointment
        )
      );
      
      setFilteredAppointments(prev => 
        prev.map(appointment => 
          appointment._id === selectedAppointment._id ? updatedAppointment : appointment
        )
      );
      
      showMessage('success', 'Appointment updated successfully!');
      closeAddEditModal();
      
    } catch (err) {
      console.error('Error saving appointment:', err);
      const errorMessage = err.message || 'Failed to save appointment. Please try again.';
      showMessage('error', errorMessage);
    }
  };
  // Handle service selection
  const handleServiceChange = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  // Add service to selection
  const addService = (serviceId) => {
    if (!formData.services.includes(serviceId)) {
      setFormData(prev => ({
        ...prev,
        services: [...prev.services, serviceId]
      }));
    }
    setShowServiceSelector(false);
  };

  // Remove service from selection
  const removeService = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter(id => id !== serviceId)
    }));
  };

  // Get service name by ID
  const getServiceNameById = (serviceId) => {
    const service = availableServices.find(s => s._id === serviceId);
    return service ? service.name : 'Unknown Service';
  };

  // Get service details by ID
  const getServiceById = (serviceId) => {
    // Add debugging to understand the issue
    console.log('getServiceById called with:', serviceId);
    console.log('Available services:', availableServices);
    console.log('Available service IDs:', availableServices.map(s => s._id));
    
    const found = availableServices.find(s => s._id === serviceId);
    console.log('Found service:', found);
    
    return found;
  };
  // Time slot selection is handled below
  // Calculate total duration of all selected services
  const calculateTotalDuration = (serviceIds) => {
    if (!serviceIds || serviceIds.length === 0 || !Array.isArray(availableServices)) return 0;
    
    return serviceIds.reduce((total, serviceId) => {
      const service = availableServices.find(s => s._id === serviceId);
      return total + (service?.duration || 30); // Default to 30 minutes if duration not specified
    }, 0);
  };
  
  // Calculate end time given start time and duration
  const calculateEndTime = (startTime, durationMinutes) => {
    if (!startTime) return '';
    
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTotalMinutes = hours * 60 + minutes;
    const endTotalMinutes = startTotalMinutes + durationMinutes;
    
    const endHours = Math.floor(endTotalMinutes / 60);
    const endMinutes = endTotalMinutes % 60;
    
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };
    // Check if a time slot should be disabled
  const isTimeSlotDisabled = (timeSlot) => {
    // Add debugging for the problematic 12:00 slot
    const isDebugging = timeSlot === '12:00';
    
    if (isDebugging) {
      console.log(`=== DEBUGGING ${timeSlot} SLOT ===`);
      console.log('Form data:', formData);
      console.log('Time slot statuses length:', timeSlotStatuses.length);
    }
    
    // For today, disable past time slots
    if (formData.date && new Date(formData.date).toDateString() === new Date().toDateString()) {
      const now = new Date();
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute);
      
      // Disable if time slot is in the past (with a 30-minute buffer)
      if (slotTime <= new Date(now.getTime() + 30 * 60000)) {
        if (isDebugging) console.log('Disabled due to past time');
        return true;
      }
    }
    
    // If no time slot statuses, consider slot as available
    if (timeSlotStatuses.length === 0) {
      if (isDebugging) console.log('No time slot statuses, considering available');
      return false;
    }
    
    const slotStatus = timeSlotStatuses.find(slot => slot.start_time === timeSlot);
    
    if (isDebugging) {
      console.log('Found slot status:', slotStatus);
      console.log('Slot status checks:');
      console.log('- !slotStatus:', !slotStatus);
      console.log('- !slotStatus.isAvailable:', slotStatus ? !slotStatus.isAvailable : 'N/A');
      console.log('- slotStatus.isOccupied:', slotStatus ? slotStatus.isOccupied : 'N/A');
      console.log('- slotStatus.isPast:', slotStatus ? slotStatus.isPast : 'N/A');
    }
    
    // If no status found, or if specifically marked as not available, occupied or past
    if (!slotStatus || !slotStatus.isAvailable || slotStatus.isOccupied || slotStatus.isPast) {
      if (isDebugging) console.log('Disabled due to status check');
      return true;
    }
    
    // Get total duration of selected services
    const totalDuration = calculateTotalDuration(formData.services);
    
    if (isDebugging) {
      console.log('Total duration:', totalDuration);
    }
    
    if (totalDuration === 0) {
      if (isDebugging) console.log('No services selected, considering available');
      return false; // No services selected
    }
    
    // Calculate how many consecutive slots are needed
    const slotsNeeded = Math.ceil(totalDuration / 30);
    const startIndex = timeSlotStatuses.findIndex(slot => slot.start_time === timeSlot);
    
    if (isDebugging) {
      console.log('Slots needed:', slotsNeeded);
      console.log('Start index:', startIndex);
    }
    
    // Check if we have enough slots to check
    if (startIndex === -1 || startIndex + slotsNeeded > timeSlotStatuses.length) {
      if (isDebugging) console.log('Disabled due to insufficient slots');
      return true;
    }
    
    // Check if all required slots are available
    for (let i = 0; i < slotsNeeded; i++) {
      const currentSlot = timeSlotStatuses[startIndex + i];
      if (isDebugging) {
        console.log(`Checking slot ${i+1}/${slotsNeeded}:`, currentSlot);
      }
      if (!currentSlot || !currentSlot.isAvailable || currentSlot.isPast) {
        if (isDebugging) console.log(`Disabled due to slot ${i+1} being unavailable`);
        return true;
      }
    }
    
    if (isDebugging) console.log('All checks passed, slot is available');
    return false;
  };
  
  // Get reason why a time slot is disabled
  const getTimeSlotDisabledReason = (timeSlot) => {
    // Check if the time slot is in the past
    if (formData.date && new Date(formData.date).toDateString() === new Date().toDateString()) {
      const now = new Date();
      const [slotHour, slotMinute] = timeSlot.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMinute);
      
      if (slotTime <= new Date(now.getTime() + 30 * 60000)) {
        return 'This time slot is in the past or too soon to book';
      }
    }
    
    // If no time slot statuses loaded, provide a generic reason
    if (timeSlotStatuses.length === 0) return 'Time slot data not available';
    
    const slotStatus = timeSlotStatuses.find(slot => slot.start_time === timeSlot);
    if (!slotStatus) return 'Time slot not found';
    if (slotStatus.isPast) return 'This time slot is in the past';
    if (!slotStatus.isAvailable) return 'This time slot is already booked';
    
    const totalDuration = calculateTotalDuration(formData.services);
    if (totalDuration === 0) return ''; // Not disabled
    
    const slotsNeeded = Math.ceil(totalDuration / 30);
    const startIndex = timeSlotStatuses.findIndex(slot => slot.start_time === timeSlot);
    
    if (startIndex === -1) return 'Time slot not found';
    if (startIndex + slotsNeeded > timeSlotStatuses.length) return 'Not enough remaining time in the day';
    
    // Check which specific slot is unavailable
    for (let i = 0; i < slotsNeeded; i++) {
      const currentSlot = timeSlotStatuses[startIndex + i];
      if (!currentSlot) return `Required time slot at ${calculateEndTime(timeSlot, i * 30)} is not available`;
      if (currentSlot.isPast) return `Required time slot at ${currentSlot.start_time} is in the past`;
      if (!currentSlot.isAvailable) return `Required time slot at ${currentSlot.start_time} is already booked`;
    }
    
    return ''; // Not disabled
  };
    // Handle time slot selection
  const handleTimeSelect = (time) => {
    // Check if the time slot is available for the entire duration needed
    const totalDuration = calculateTotalDuration(formData.services);
    
    if (totalDuration === 0) {
      // No services selected yet, just set the time
      setFormData(prev => ({
        ...prev,
        time
      }));
      return;
    }
    
    // Check if the time is disabled before setting it
    const isDisabled = isTimeSlotDisabled(time);
    
    if (!isDisabled) {
      setFormData(prev => ({
        ...prev,
        time
      }));
      
      // Calculate and log end time for information
      const endTime = calculateEndTime(time, totalDuration);
      console.log(`Selected time slot: ${time} - ${endTime} (${totalDuration} minutes total for ${formData.services.length} service${formData.services.length > 1 ? 's' : ''})`);
    } else {
      // Calculate end time and get detailed reason
      const endTime = calculateEndTime(time, totalDuration);
      const reason = getTimeSlotDisabledReason(time);
      
      // Log the reason (could be displayed to user in future)
      console.log(`Cannot select ${time} - ${reason}`);
      
      // Show a simple alert explaining why they can't select this time
      alert(`This time slot cannot be selected: ${reason}`);
    }
  };
  
  // Fetch time slots availability when barber or date changes
  const fetchTimeSlotStatuses = async () => {
    if (formData.barberId && formData.date) {
      try {
        setIsLoadingTimeSlots(true);
        // Format date to YYYY-MM-DD
        const formattedDate = formData.date.toISOString().split('T')[0];        // When in edit mode, exclude the current appointment from occupied slots
        const excludeBookingId = selectedAppointment?._id 
          ? selectedAppointment._id 
          : undefined;

        // Call the service to get time slot status
        const statuses = await staffTimeSlotService.getTimeSlotStatus(
          formData.barberId, 
          formattedDate, 
          formData.services,
          excludeBookingId        );
        
        console.log('=== FRONTEND TIME SLOT DEBUG ===');
        console.log('Received time slot statuses:', statuses);
        console.log('Number of time slots:', statuses.length);
        
        // Log specific slots for debugging
        const slot12_00 = statuses.find(slot => slot.start_time === '12:00');
        const slot12_30 = statuses.find(slot => slot.start_time === '12:30');
        const slot13_00 = statuses.find(slot => slot.start_time === '13:00');
        
        console.log('12:00 slot:', slot12_00);
        console.log('12:30 slot:', slot12_30);
        console.log('13:00 slot:', slot13_00);
        
        setTimeSlotStatuses(statuses);
        
        // If currently selected time is not available, reset it
        if (formData.time) {
          const isCurrentTimeAvailable = !isTimeSlotDisabled(formData.time);
          if (!isCurrentTimeAvailable) {
            setFormData(prev => ({
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
  useEffect(() => {
    fetchTimeSlotStatuses();
  }, [formData.barberId, formData.date, formData.services, selectedAppointment]);
  
  // Check if selected time is still valid when services change
  useEffect(() => {
    if (formData.time && formData.barberId && formData.date) {
      const isStillAvailable = !isTimeSlotDisabled(formData.time);
      if (!isStillAvailable) {
        setFormData(prev => ({
          ...prev,
          time: ''
        }));
      }
    }
  }, [formData.services]);
  
  // Load form data on component mount
  useEffect(() => {
    loadFormData();
  }, [loadFormData]);
  
  const handleCancelAppointment = async (appointmentId) => {
    try {
      await staffAppointmentService.cancelAppointment(appointmentId);
      showMessage('success', 'Appointment canceled successfully!');

      // Refresh appointments and time slots
      fetchAppointments();
      fetchTimeSlotStatuses();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      showMessage('error', 'Failed to cancel appointment. Please try again.');
    }
  };
  
  return (
    <div className="container mt-4" ref={containerRef}>      <h2>Manage Appointments</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
        {/* Error Messages */}
      {message.text && message.type === 'error' && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {message.text}
          <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
        </div>
      )}
      
      <div className="row mb-4 mt-4">
        <div className="col">
          <div className="card">            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Appointments</span>              <div className="d-flex align-items-center">
                <div className="input-group me-2" style={{ maxWidth: '250px' }}>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by phone..."
                    id="phoneSearchInput"
                    onChange={(e) => handlePhoneSearch(e.target.value)}
                  />
                  <button className="btn btn-sm btn-outline-secondary" type="button">
                    <i className="bi bi-search"></i>
                  </button>
                </div>                <div className="date-filter position-relative">                  <button 
                    className={`btn btn-sm ${activeFilter === 'specific-date' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    title="Filter by date"
                  >
                    <i className="bi bi-calendar3"></i>
                  </button>
                    {showDatePicker && (
                    <div className="position-absolute bg-white shadow rounded p-2 mt-1 date-picker-dropdown" style={{ zIndex: 1000, right: 0 }}>
                      <DatePicker
                        selected={selectedDate}
                        onChange={handleDateSelect}
                        inline
                        calendarClassName="custom-calendar-style"
                        todayButton="Today"
                      />
                      <div className="d-flex mt-2 justify-content-between">
                        <button 
                          className="btn btn-sm btn-outline-secondary" 
                          onClick={() => {
                            setSelectedDate(null);
                            handleFilterChange('all');
                            setShowDatePicker(false);
                          }}
                          title="Clear filter"
                        >
                          Clear
                        </button>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => setShowDatePicker(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>                  )}
                  </div>
                </div>
            </div>
            <div className="card-body">{loading ? (
                <div className="text-center my-3"><div className="spinner-border" role="status"></div></div>
              ) : filteredAppointments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map(appointment => (
                        <tr key={appointment._id} className={newBookingIds.has(appointment._id) ? 'table-warning' : ''}>                          <td>{appointment._id.slice(-6).toUpperCase()}
                            {newBookingIds.has(appointment._id) && (
                              <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">NEW</span>
                            )}
                          </td>
                          <td>{appointment.userName || 'N/A'}</td>
                          <td>{appointment.phone || 'N/A'}</td>
                          <td>{formatDate(appointment.date)}</td>
                          <td>{formatTime(appointment.time)}</td>
                          <td>
                            <span className={`badge bg-${
                              appointment.status === 'pending' ? 'warning' : 
                              appointment.status === 'confirmed' ? 'success' : 
                              appointment.status === 'cancelled' ? 'danger' :
                              appointment.status === 'completed' ? 'info' : 'secondary'
                            }`}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </td>                          <td>
                            <button 
                              className="btn btn-sm btn-info me-2" 
                              onClick={() => handleViewAppointment(appointment)}
                            >
                              View
                            </button>
                            <button 
                              className={`btn btn-sm ${
                                appointment.status === 'completed' || appointment.status === 'cancelled'
                                  ? 'btn-secondary'
                                  : 'btn-primary'
                              }`}
                              onClick={() => handleEditAppointment(appointment)}
                              disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                              title={
                                appointment.status === 'completed' || appointment.status === 'cancelled'
                                  ? `Cannot edit ${appointment.status} appointment`
                                  : 'Edit appointment'
                              }
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>                </div>              ) : (                <p className="text-center">
                  {phoneSearchQuery 
                    ? `No appointments found with phone number containing "${phoneSearchQuery}".` 
                    : activeFilter === 'specific-date'
                      ? `No appointments found for ${selectedDate ? new Date(selectedDate).toLocaleDateString() : 'the selected date'}.`
                      : `No appointments found for the selected time period.`}
                </p>
              )}
            </div>
            {totalPages > 1 && (
              <div className="card-footer d-flex justify-content-center">
                <nav aria-label="Page navigation">
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                        <span aria-hidden="true">&laquo;</span> Previous
                      </button>
                    </li>
                    
                    {/* Show first page */}
                    {currentPage > 2 && (
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                      </li>
                    )}
                    
                    {/* Show ellipsis if needed */}
                    {currentPage > 3 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    
                    {/* Previous page */}
                    {currentPage > 1 && (
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                          {currentPage - 1}
                        </button>
                      </li>
                    )}
                    
                    {/* Current page */}
                    <li className="page-item active">
                      <span className="page-link">{currentPage}</span>
                    </li>
                    
                    {/* Next page */}
                    {currentPage < totalPages && (
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                          {currentPage + 1}
                        </button>
                      </li>
                    )}
                    
                    {/* Show ellipsis if needed */}
                    {currentPage < totalPages - 2 && (
                      <li className="page-item disabled">
                        <span className="page-link">...</span>
                      </li>
                    )}
                    
                    {/* Show last page */}
                    {currentPage < totalPages - 1 && (
                      <li className="page-item">
                        <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                          {totalPages}
                        </button>
                      </li>
                    )}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                        Next <span aria-hidden="true">&raquo;</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
        {/* Modal Chi tiết Appointment */}
      {showAppointmentModal && selectedAppointment && (
        <>          {/* Modal Backdrop */}
          <div 
            className="modal-backdrop fade show" 
            style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={closeAppointmentModal}
          ></div>
            {/* Modal Dialog */}          <div 
            className="modal fade show" 
            style={{ 
              display: 'block', 
              paddingRight: '15px',
              paddingLeft: '15px',
              zIndex: 1050,
              overflow: 'hidden'
            }} 
            tabIndex="-1"          >            <div className="modal-dialog modal-lg" style={{ 
                margin: '5rem auto 1.75rem',
                display: 'flex',
                alignItems: 'flex-start',
                height: '80vh'
              }}>              <div className="modal-content" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '80vh'
              }}>
                <div className="modal-header" style={{ flex: '0 0 auto' }}>
                  <h5 className="modal-title">Appointment Details</h5>
                </div>
                <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
                  {/* Customer Information Section */}
                  <h5 className="mb-3">
                    <i className="bi bi-person-circle me-2"></i>Customer Information
                  </h5>
                  <div className="card mb-4">
                    <div className="card-body">                      <div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Name:</div>
                        <div className="col-9">{selectedAppointment.userName || selectedAppointment.name || 'N/A'}</div>
                      </div>
                      <div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Email:</div>
                        <div className="col-9">{selectedAppointment.userEmail || selectedAppointment.email || 'N/A'}</div>
                      </div>
                      <div className="row">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Phone:</div>
                        <div className="col-9">{selectedAppointment.userPhone || selectedAppointment.phone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Information Section */}
                  <h5 className="mb-3">
                    <i className="bi bi-calendar-event me-2"></i>Appointment Information
                  </h5>                  <div className="card mb-4">
                    <div className="card-body">
                      <div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Service:</div>
                        <div className="col-9">
                          {(() => {                            if (selectedAppointment.services && Array.isArray(selectedAppointment.services) && selectedAppointment.services.length > 0) {
                              // Resolve service names with better handling for different service object formats
                              const resolvedServices = selectedAppointment.services.map(service => {
                                // Case 1: Full service object with name
                                if (typeof service === 'object' && service !== null) {
                                  if (service.name) {
                                    return service.name;
                                  }
                                  // Case 2: Object with _id but no name
                                  if (service._id) {
                                    const foundService = availableServices.find(s => s._id === service._id);
                                    if (foundService) return foundService.name;
                                    return getServiceNameById(service._id);
                                  }
                                } 
                                // Case 3: String ID
                                else if (typeof service === 'string') {
                                  const foundService = availableServices.find(s => s._id === service);
                                  if (foundService) return foundService.name;
                                  return getServiceNameById(service);
                                }
                                // Fallback
                                return 'Service Information Unavailable';
                              });

                              // Display each service with icon
                              return (
                                <ul className="list-unstyled mb-0">
                                  {resolvedServices.map((name, idx) => (
                                    <li key={idx} className="mb-1">
                                      <i className="bi bi-scissors me-2"></i>{name}
                                    </li>
                                  ))}
                                </ul>
                              );
                            } else if (selectedAppointment.serviceName && selectedAppointment.serviceName !== 'N/A') {
                              return <span><i className="bi bi-scissors me-2"></i>{selectedAppointment.serviceName}</span>;
                            } else if (selectedAppointment.service && selectedAppointment.service !== 'N/A') {
                              // Handle case where service is an object
                              if (typeof selectedAppointment.service === 'object' && selectedAppointment.service !== null) {
                                const serviceName = selectedAppointment.service.name || 'Service Information Unavailable';
                                return <span><i className="bi bi-scissors me-2"></i>{serviceName}</span>;
                              }
                              return <span><i className="bi bi-scissors me-2"></i>{selectedAppointment.service}</span>;
                            }
                            return <span className="text-muted">No service information available</span>;
                          })()}
                        </div>
                      </div><div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Barber:</div>
                        <div className="col-9">{selectedAppointment.barberName || 'Any Available'}</div>
                      </div>
                      <div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Date:</div>
                        <div className="col-9">{formatDate(selectedAppointment.date)}</div>
                      </div>
                      <div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Time:</div>
                        <div className="col-9">{formatTime(selectedAppointment.time)}</div>
                      </div>
                      <div className="row">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Status:</div>
                        <div className="col-9">
                          <span className={`badge bg-${
                            selectedAppointment.status === 'pending' ? 'warning' :
                            selectedAppointment.status === 'confirmed' ? 'success' :
                            selectedAppointment.status === 'cancelled' ? 'danger' :
                            selectedAppointment.status === 'completed' ? 'primary' : 'secondary'
                          }`}>
                            {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <h5 className="mb-3">
                    <i className="bi bi-card-text me-2"></i>Notes
                  </h5>
                  <div className="card mb-4">
                    <div className="card-body">
                      <p className="p-3 bg-light rounded">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                </div>
                <div className="row mb-4"> {/* Added mt-4 for spacing */}
                    <div className="col-12">
                      <div className="d-flex flex-wrap gap-2 justify-content-center"> {/* Added justify-content-center */}
                        {selectedAppointment.status === 'pending' && (
                          <button 
                            className="btn btn-success"
                            onClick={() => {
                              handleStatusUpdate(selectedAppointment._id, 'confirmed');
                              // Update the selected appointment status locally
                              setSelectedAppointment({...selectedAppointment, status: 'confirmed'});
                            }}
                          >
                            <i className="bi bi-check-circle me-2"></i>Confirm Appointment
                          </button>
                        )}
                        
                        {selectedAppointment.status === 'confirmed' && (
                          <button 
                            className="btn btn-primary"
                            onClick={() => {
                              handleStatusUpdate(selectedAppointment._id, 'completed');
                              // Update the selected appointment status locally
                              setSelectedAppointment({...selectedAppointment, status: 'completed'});
                            }}
                          >
                            <i className="bi bi-check-square me-2"></i>Mark as Completed
                          </button>
                        )}
                        
                        {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                          <button 
                            className="btn btn-danger"
                            onClick={() => {
                              handleStatusUpdate(selectedAppointment._id, 'cancelled');
                              // Update the selected appointment status locally
                              setSelectedAppointment({...selectedAppointment, status: 'cancelled'});
                            }}
                          >
                            <i className="bi bi-x-circle me-2"></i>Cancel Appointment
                          </button>
                        )}
                        
                        {(selectedAppointment.status === 'cancelled' || selectedAppointment.status === 'completed') && (
                          <div className="alert alert-info mb-0">
                            <i className="bi bi-info-circle me-2"></i>
                            This appointment is {selectedAppointment.status} and cannot be modified further.
                          </div>
                        )}                      </div>
                    </div>
                  </div>                <div className="modal-footer" style={{ flex: '0 0 auto', backgroundColor: 'white' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeAppointmentModal}>Close</button>
                </div>
              </div>
            </div>          </div>
        </>
      )}

      {/* Edit Appointment Modal */}
      {showAddEditModal && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="modal-backdrop fade show" 
            style={{ zIndex: 1040, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={closeAddEditModal}
          ></div>
          
          {/* Modal Dialog */}          <div 
            className="modal fade show" 
            style={{ 
              display: 'block', 
              paddingRight: '15px',
              paddingLeft: '15px',
              zIndex: 1050,
              overflow: 'hidden'
            }} 
            tabIndex="-1"
          >            <div className="modal-dialog modal-lg" style={{ 
              margin: '5rem auto 1.75rem',
              display: 'flex',
              alignItems: 'flex-start',
              height: '80vh'
            }}>              <div className="modal-content" style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: '80vh'
              }}>
                <div className="modal-header" style={{ flex: '0 0 auto' }}>                  <h5 className="modal-title">
                    Edit Appointment
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={closeAddEditModal}
                    aria-label="Close"
                  ></button>
                </div>
                
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div className="modal-body" style={{ overflowY: 'auto', flex: '1 1 auto' }}>
                    {/* Customer Information Section */}
                    <h6 className="mb-3">
                      <i className="bi bi-person-circle me-2"></i>Customer Information
                    </h6>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="customerName" className="form-label">
                          Customer Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${formErrors.customerName ? 'is-invalid' : ''}`}
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          placeholder="Enter customer name"
                        />
                        {formErrors.customerName && (
                          <div className="invalid-feedback">{formErrors.customerName}</div>
                        )}
                      </div>
                      
                      <div className="col-md-6">
                        <label htmlFor="customerPhone" className="form-label">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          className={`form-control ${formErrors.customerPhone ? 'is-invalid' : ''}`}
                          id="customerPhone"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          placeholder="Enter phone number"
                        />
                        {formErrors.customerPhone && (
                          <div className="invalid-feedback">{formErrors.customerPhone}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="row mb-4">
                      <div className="col-12">
                        <label htmlFor="customerEmail" className="form-label">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          className={`form-control ${formErrors.customerEmail ? 'is-invalid' : ''}`}
                          id="customerEmail"
                          value={formData.customerEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                          placeholder="Enter email address"
                        />
                        {formErrors.customerEmail && (
                          <div className="invalid-feedback">{formErrors.customerEmail}</div>
                        )}
                      </div>
                    </div>

                    {/* Appointment Details Section */}
                    <h6 className="mb-3">
                      <i className="bi bi-calendar-event me-2"></i>Appointment Details
                    </h6>
                      <div className="row mb-3">
                      <div className="col-12">
                        <label className="form-label">
                          Services <span className="text-danger">*</span>
                        </label>
                        
                        {/* Selected Services Display */}                        <div className={`border rounded p-3 mb-3 ${formErrors.services ? 'border-danger' : ''}`}>
                          {formData.services.length > 0 ? (
                            <div className="selected-services">
                              <h6 className="mb-3">Selected Services:</h6>
                              <div className="service-list">
                                {formData.services.map(serviceId => {
                                  const service = getServiceById(serviceId);
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
                                          type="button"
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => removeService(serviceId)}
                                          title="Remove service"
                                        >
                                          <i className="bi bi-trash"></i>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-3">
                              <i className="bi bi-scissors text-muted" style={{ fontSize: '2rem' }}></i>
                              <p className="text-muted mb-0 mt-2">No services selected</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Add Service Button */}
                        <div className="d-flex align-items-center gap-2 mb-3">
                          <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => setShowServiceSelector(!showServiceSelector)}
                          >
                            <i className="bi bi-plus-circle me-2"></i>
                            Add Service
                          </button>
                        </div>
                          {/* Service Selector Dropdown */}
                        {showServiceSelector && (
                          <div className="border rounded p-3 mb-3 bg-light">
                            <h6 className="mb-3">Available Services:</h6>
                            {Array.isArray(availableServices) && availableServices.length > 0 ? (
                              <div className="available-services-list">
                                {availableServices
                                  .filter(service => !formData.services.includes(service._id))
                                  .map(service => (
                                    <div key={service._id} className="mb-2">
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary w-100 text-start p-3"
                                        onClick={() => addService(service._id)}
                                      >
                                        <div>
                                          <strong>{service.name}</strong>
                                          <div className="text-muted small mt-1">
                                            ${service.price} - {service.duration || 30}min
                                          </div>
                                        </div>
                                      </button>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p className="text-muted mb-0">No services available</p>
                            )}
                            {availableServices.filter(service => !formData.services.includes(service._id)).length === 0 && formData.services.length > 0 && (
                              <p className="text-muted mb-0">All available services have been selected</p>
                            )}
                          </div>
                        )}
                        
                        {formErrors.services && (
                          <div className="text-danger mt-1">{formErrors.services}</div>
                        )}
                      </div>
                    </div>
                      <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="barberId" className="form-label">
                          Preferred Barber
                        </label>                        <select
                          className="form-select"
                          id="barberId"
                          value={formData.barberId}
                          onChange={(e) => setFormData(prev => ({ ...prev, barberId: e.target.value }))}
                        >
                          {Array.isArray(availableBarbers) && availableBarbers.map(barber => (
                            <option key={barber._id} value={barber._id}>
                              {barber.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-6">
                        <label htmlFor="appointmentDate" className="form-label">
                          Date <span className="text-danger">*</span>
                        </label>
                        <DatePicker
                          selected={formData.date}
                          onChange={(date) => setFormData(prev => ({ ...prev, date }))}
                          className={`form-control ${formErrors.date ? 'is-invalid' : ''}`}
                          placeholderText="Select date"
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          id="appointmentDate"
                        />
                        {formErrors.date && (
                          <div className="text-danger mt-1">{formErrors.date}</div>
                        )}
                      </div>
                    </div>                    <div className="row mb-3">                      <div className="col-12 px-0">
                        <label htmlFor="appointmentTime" className="form-label fw-bold">
                          <i className="bi bi-clock me-2"></i>Available Time Slots <span className="text-danger">*</span>
                        </label><input 
                          type="hidden" 
                          id="appointmentTime" 
                          name="time" 
                          value={formData.time} 
                          required
                        />                        <div className="card time-slots-card border-0 no-hover-effect w-100">
                          <div className="card-body py-3 px-2">
                            <div className="time-slots-grid w-100">{!formData.barberId ? (
                                <div className="text-center my-3">
                                  <i className="bi bi-person-badge text-muted me-2"></i>
                                  <span className="text-muted fw-medium">Please select a barber first</span>
                                </div>
                              ) : !formData.date ? (
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
                                    const isSelected = formData.time === time;
                                    const totalDuration = calculateTotalDuration(formData.services);
                                    
                                    // Check if this slot is part of the selected time range
                                    let isInSelectedRange = false;
                                    let isEndOfRange = false;
                                    
                                    if (formData.time && totalDuration > 0) {
                                      const allTimeSlots = timeSlotStatuses.length > 0 ? timeSlotStatuses.map(slot => slot.start_time) : timeSlots;
                                      
                                      if (formData.time) {
                                        // Calculate appointment end time
                                        const appointmentEndTime = calculateEndTime(formData.time, totalDuration);
                                        
                                        // Convert times to minutes for comparison
                                        const [currentHour, currentMinute] = time.split(':').map(Number);
                                        const currentTimeMinutes = currentHour * 60 + currentMinute;
                                        
                                        const [selectedHour, selectedMinute] = formData.time.split(':').map(Number);
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
                                          }
                                        }
                                      }
                                    }                                      return (
                                      <div key={index} className="col-4 col-sm-3 col-md-2">
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
                                                ? `Part of this ${totalDuration}-minute appointment (${formData.time} - ${calculateEndTime(formData.time, totalDuration)})`                                                : totalDuration > 0
                                                  ? `Click to book ${totalDuration}-minute appointment (${time} - ${calculateEndTime(time, totalDuration)})`
                                                  : 'Available time slot'
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
                        </div>                        {formErrors.time && (
                          <div className="text-danger mt-1">{formErrors.time}</div>
                        )}                        <div className="mt-2">
                          <div className="help-text">
                            {formData.services.length > 0 && formData.time && (
                              <small className="text-success d-block mb-1">
                                <i className="bi bi-check-circle me-1"></i>
                                Selected time: {formData.time} - {calculateEndTime(formData.time, calculateTotalDuration(formData.services))} 
                                ({calculateTotalDuration(formData.services)} minutes total)
                              </small>
                            )}
                            <small className="d-flex align-items-center mb-1 text-muted">
                              <i className="bi bi-clock-history me-1"></i> Past time slots or slots within 30 minutes are disabled
                            </small>
                            <small className="d-flex align-items-center mb-1 text-muted">
                              <i className="bi bi-info-circle me-1"></i> Grayed out time slots are unavailable
                            </small>
                            {formData.services.length === 0 && (
                              <small className="d-flex align-items-center text-info">
                                <i className="bi bi-lightbulb me-1"></i> Select services first to see available time slots
                              </small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-12">
                        <label htmlFor="notes" className="form-label">
                          Notes (Optional)
                        </label>
                        <textarea
                          className="form-control"
                          id="notes"
                          rows="3"
                          value={formData.notes}
                          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Any additional notes or special requests..."
                        ></textarea>
                      </div>
                    </div>                  </div>
                    <div className="modal-footer" style={{ flex: '0 0 auto', backgroundColor: 'white' }}>
                    <button type="button" className="btn btn-secondary" onClick={closeAddEditModal}>
                      Cancel
                    </button>                    <button type="submit" className="btn btn-primary">
                      <i className="bi bi-check-circle me-2"></i>
                      Update Appointment
                    </button>
                  </div>
                </form>
              </div>
            </div>          </div>
        </>
      )}

      {/* Toast-style Success Message */}
      {successMessage && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 9999,
            maxWidth: '300px'
          }}
          className="toast show bg-success text-white"
        >
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">Success</strong>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setSuccessMessage('')}
            ></button>
          </div>
          <div className="toast-body">
            {successMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAppointments;