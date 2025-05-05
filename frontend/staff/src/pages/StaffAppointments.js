import React, { useState, useEffect } from 'react';
import staffAppointmentService from '../services/staffAppointmentService';

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  
  useEffect(() => {
    fetchAppointments();
  }, [activeFilter]);
  
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
                        <tr key={appointment._id}>
                          <td>#{appointment._id.slice(-6).toUpperCase()}</td>
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