import React, { useState, useEffect, useCallback } from 'react';
import staffAppointmentService from '../services/staffAppointmentService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [socketErrors, setSocketErrors] = useState([]);
  // Thêm state mới để theo dõi booking mới
  const [newBookingIds, setNewBookingIds] = useState(new Set());
  
  // Sử dụng Socket.IO context
  const { isConnected, isLoading, error: socketError, registerHandler, unregisterHandler, reconnect } = useSocketContext();
  
  // Sử dụng NotificationContext để xóa thông báo khi đến trang appointments
  const { clearBookingNotifications } = useNotifications();
  
  // Xóa thông báo đặt lịch khi component mount
  useEffect(() => {
    clearBookingNotifications();
  }, [clearBookingNotifications]);
  
  useEffect(() => {
    fetchAppointments();
  }, [activeFilter]);
  
  // Handler cho sự kiện newBooking - được tối ưu bằng useCallback
  const handleNewBooking = useCallback((data) => {
    try {
      console.log('Received new booking event:', data);
      
      // Kiểm tra nếu là sự kiện 'insert' (thêm mới booking)
      if (data.operationType === 'insert' && data.fullDocument) {
        // Kiểm tra xem booking mới có phù hợp với bộ lọc hiện tại không
        const newBooking = data.fullDocument;
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
          // Thêm booking mới vào đầu mảng
          setAppointments(prev => [newBooking, ...prev]);
          
          // Đánh dấu booking này là mới trong Set
          setNewBookingIds(prev => new Set(prev).add(newBooking._id));
          
          // Sau 60 giây, bỏ đánh dấu "NEW" cho booking này
          setTimeout(() => {
            setNewBookingIds(prev => {
              const updated = new Set(prev);
              updated.delete(newBooking._id);
              return updated;
            });
          }, 60000); // 60 seconds
        }
      } 
      // Nếu là sự kiện cập nhật
      else if (data.operationType === 'update' && data.documentId) {
        // Tìm và cập nhật booking trong danh sách hiện tại
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
      setSocketErrors(prev => [...prev, {
        time: new Date().toISOString(),
        message: `Lỗi xử lý dữ liệu đặt lịch: ${err.message}`,
        event: 'newBooking'
      }]);
    }
  }, [activeFilter]);
  
  // Lắng nghe sự kiện Socket.IO
  useEffect(() => {
    if (!isConnected) return;
    
    console.log('Setting up socket listeners in StaffAppointments');
    
    // Đăng ký sự kiện với Socket.IO
    registerHandler('newBooking', handleNewBooking);
    
    // Clean up khi component unmount
    return () => {
      console.log('Cleaning up socket listeners in StaffAppointments');
      unregisterHandler('newBooking', handleNewBooking);
    };
  }, [isConnected, registerHandler, unregisterHandler, handleNewBooking]);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let response;
      
      switch(activeFilter) {
        case 'today':
          response = await staffAppointmentService.getTodayAppointments();
          break;
        case 'week':
          response = await staffAppointmentService.getWeekAppointments();
          break;
        case 'all':
        default:
          response = await staffAppointmentService.getAllAppointments();
          break;
      }
      
      setAppointments(response.bookings || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await staffAppointmentService.updateAppointmentStatus(id, newStatus);
      
      // Update the local state to reflect the change
      setAppointments(appointments.map(appointment => 
        appointment._id === id ? { ...appointment, status: newStatus } : appointment
      ));
      
    } catch (err) {
      console.error('Error updating appointment status:', err);
      alert('Failed to update appointment status. Please try again.');
    }
  };
  
  // Xóa thông báo lỗi socket
  const dismissSocketError = useCallback((index) => {
    setSocketErrors(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Thử kết nối lại khi có lỗi
  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);
  
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="container mt-4">
      <h2>Manage Appointments</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Hiển thị lỗi socket nếu có */}
      {socketError && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Socket Error:</strong> {socketError}
          <button 
            type="button" 
            className="btn-close" 
            data-bs-dismiss="alert" 
            aria-label="Close"
            onClick={handleReconnect}
          ></button>
        </div>
      )}
      
      {/* Hiển thị danh sách lỗi xử lý socket events */}
      {socketErrors.length > 0 && (
        <div className="alert alert-danger">
          <h6>Lỗi xử lý dữ liệu real-time:</h6>
          <ul className="mb-0">
            {socketErrors.map((error, index) => (
              <li key={`socket-error-${index}`} className="d-flex justify-content-between align-items-center">
                <span>
                  <strong>{error.event}:</strong> {error.message}
                  <small className="ms-2 text-muted">
                    {new Date(error.time).toLocaleTimeString()}
                  </small>
                </span>
                <button 
                  className="btn btn-sm btn-close" 
                  onClick={() => dismissSocketError(index)}
                ></button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Hiển thị trạng thái kết nối Socket.IO */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          {isLoading ? (
            <span className="badge bg-warning me-2">
              Socket.IO: Connecting...
            </span>
          ) : (
            <span className={`badge ${isConnected ? 'bg-success' : 'bg-danger'} me-2`}>
              Socket.IO: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          )}
          
          {!isConnected && !isLoading && (
            <button 
              className="btn btn-sm btn-warning" 
              onClick={handleReconnect}
            >
              Reconnect
            </button>
          )}
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Appointments</span>
              <div>
                <button 
                  className={`btn btn-sm ${activeFilter === 'today' ? 'btn-primary' : 'btn-outline-secondary'} me-2`}
                  onClick={() => setActiveFilter('today')}
                >
                  Today
                </button>
                <button 
                  className={`btn btn-sm ${activeFilter === 'week' ? 'btn-primary' : 'btn-outline-secondary'} me-2`}
                  onClick={() => setActiveFilter('week')}
                >
                  This Week
                </button>
                <button 
                  className={`btn btn-sm ${activeFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => setActiveFilter('all')}
                >
                  All
                </button>
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
                          <td>#{appointment._id.slice(-6).toUpperCase()}
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
                          </td>
                          <td>
                            <div className="btn-group" role="group">
                              {appointment.status === 'pending' && (
                                <button 
                                  className="btn btn-sm btn-success me-1"
                                  onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                                >
                                  Confirm
                                </button>
                              )}
                              
                              {appointment.status === 'confirmed' && (
                                <button 
                                  className="btn btn-sm btn-primary me-1"
                                  onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                                >
                                  Complete
                                </button>
                              )}
                              
                              {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
                                <button 
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                                >
                                  Cancel
                                </button>
                              )}
                              
                              {(appointment.status === 'cancelled' || appointment.status === 'completed') && (
                                <span className="text-muted">No actions available</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No appointments found for the selected filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffAppointments;