import React, { useState, useEffect, useCallback, useRef } from 'react';
import staffAppointmentService from '../services/staffAppointmentService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import normalizeBookingData from '../utils/bookingDataNormalizer';

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');  // State cho modal chi tiết appointment
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
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
      
      setAppointments(sortedAppointments);
      
      // Set total pages from response
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
  }, [activeFilter, currentPage, APPOINTMENTS_PER_PAGE]);
  
  // Xóa thông báo đặt lịch khi component mount
  useEffect(() => {
    clearBookingNotifications();
    
    // Đăng ký event listener để xóa thông báo khi click bất kỳ đâu trên trang
    const handleClickAnywhere = () => {
      clearBookingNotifications();
    };
    
    // Đăng ký event listener
    const containerElement = containerRef.current;
    if (containerElement) {
      containerElement.addEventListener('click', handleClickAnywhere);
    }
    
    // Cleanup event listener khi component unmount
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('click', handleClickAnywhere);
      }
    };
  }, [clearBookingNotifications]);

  useEffect(() => {
    fetchAppointments();
  }, [activeFilter, currentPage, fetchAppointments]);
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
        
        let shouldAdd = false;
        
        if (activeFilter === 'all') {
          shouldAdd = true;
        } else if (activeFilter === 'today') {
          const today = new Date().toISOString().split('T')[0];
          const bookingDate = new Date(newBooking.date).toISOString().split('T')[0];
          shouldAdd = bookingDate === today;
        } else if (activeFilter === 'week') {
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() + (6 - now.getDay()));
          weekEnd.setHours(23, 59, 59, 999);
          
          const bookingDate = new Date(newBooking.date);
          shouldAdd = bookingDate >= weekStart && bookingDate <= weekEnd;
        }
        
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
      } 
      // Nếu là sự kiện cập nhật
      else if (data.operationType === 'update' && data.documentId) {
        // Nếu là sự kiện cập nhật, cập nhật booking trong state
        setAppointments(prev => 
          prev.map(appointment => 
            appointment._id === data.documentId 
              ? { ...appointment, ...(data.updateDescription?.updatedFields || {}) } 
              : appointment
          )
        );
      }
    } catch (err) {
      console.error('Error processing booking data:', err);
      // Chỉ ghi log lỗi, không cập nhật state
    }
  }, [activeFilter]);
  
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
      setAppointments(
        appointments.map(appointment => 
          appointment._id === id ? { ...appointment, status: newStatus } : appointment
        )
        // Không cần sắp xếp lại vì việc cập nhật status không ảnh hưởng đến thứ tự ngày/giờ
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
  
  // Handle filter change with page reset
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when changing filters
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
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Appointments</span>
              <div>
                <select
                  className="form-select form-select-sm w-auto"
                  value={activeFilter}
                  onChange={e => handleFilterChange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center my-3"><div className="spinner-border" role="status"></div></div>
              ) : appointments.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map(appointment => (
                        <tr key={appointment._id} className={newBookingIds.has(appointment._id) ? 'table-warning' : ''}>
                          <td>{appointment._id.slice(-6).toUpperCase()}
                            {newBookingIds.has(appointment._id) && (
                              <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">NEW</span>
                            )}
                          </td>
                          <td>{appointment.userName || 'N/A'}</td>
                          <td>{appointment.serviceName}</td>
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
                  </table>
                </div>              ) : (
                <p className="text-center">No appointments found for the selected filter.</p>
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