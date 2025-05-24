import React, { useState, useEffect, useCallback, useRef } from 'react';
import staffAppointmentService from '../services/staffAppointmentService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import normalizeBookingData from '../utils/bookingDataNormalizer';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');  // State cho modal chi tiết appointment
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
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
    setTotalPages(Math.max(1, Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE)));
  }, [phoneSearchQuery, appointments, activeFilter, APPOINTMENTS_PER_PAGE]);
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
  const handleViewAppointment = (appointment) => {
    // Chuẩn hóa dữ liệu appointment trước khi hiển thị
    const normalizedAppointment = normalizeBookingData(appointment);
      // Xóa đánh dấu 'NEW' nếu có
    if (newBookingIds.has(appointment._id)) {
      removeNewBookingId(appointment._id);
    }
    
    setSelectedAppointment(normalizedAppointment);
    // Add body class for modal open state
    document.body.classList.add('modal-open');
    setShowAppointmentModal(true);
  };
  // Đóng modal chi tiết appointment
  const closeAppointmentModal = () => {
    // Add animation class for smooth exit
    document.body.classList.remove('modal-open');
    setShowAppointmentModal(false);
    
    // Đặt timeout để đợi animation đóng modal hoàn tất
    setTimeout(() => {
      setSelectedAppointment(null);
    }, 300);
  };
  
  return (
    <div className="container mt-4" ref={containerRef}>
      <h2>Manage Appointments</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="row mb-4 mt-4">
        <div className="col">
          <div className="card">            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Appointments</span>
              <div className="d-flex align-items-center">
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
                              className="btn btn-sm btn-info" 
                              onClick={() => handleViewAppointment(appointment)}
                            >
                              View
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
            {/* Modal Dialog */}
          <div 
            className="modal fade show" 
            style={{ 
              display: 'block', 
              paddingRight: '15px',
              paddingLeft: '15px',
              zIndex: 1050,
              overflow: 'auto'
            }} 
            tabIndex="-1"
          >            <div className="modal-dialog modal-lg" style={{ 
                margin: '1.75rem auto',
                display: 'flex',
                alignItems: 'center',
                minHeight: 'calc(100% - 3.5rem)'
              }}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Appointment Details</h5>
                </div>
                <div className="modal-body">
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
                  </h5>
                  <div className="card mb-4">
                    <div className="card-body">
                      <div className="row mb-1">
                        <div className="col-3" style={{ fontWeight: 'bold' }}>Service:</div>
                        <div className="col-9">{selectedAppointment.serviceName}</div>
                      </div>                      <div className="row mb-1">
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
                        )}
                      </div>
                    </div>
                  </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeAppointmentModal}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffAppointments;