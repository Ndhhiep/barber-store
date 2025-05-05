import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import staffDashboardService from '../services/staffDashboardService';
import staffAppointmentService from '../services/staffAppointmentService';
import staffOrderService from '../services/staffOrderService';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    appointments: 0,
    orders: 0,
    products: 0,
    customers: 0,
    todayBookings: [],
    recentOrders: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Gọi API để lấy tất cả thống kê cho dashboard
        const response = await staffDashboardService.getDashboardStats();
        
        if (response.status === 'success') {
          setDashboardData({
            appointments: response.data.counts.bookings || 0,
            orders: response.data.counts.orders || 0,
            products: response.data.counts.products || 0,
            customers: response.data.counts.users || 0,
            todayBookings: response.data.todayBookings || [],
            recentOrders: response.data.recentOrders || []
          });
        } else {
          throw new Error('Failed to fetch dashboard statistics');
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Showing placeholder information.");
        
        // Trong trường hợp lỗi, cố gắng lấy dữ liệu từ các API cũ
        try {
          const [todayAppointments, recentOrders] = await Promise.all([
            staffAppointmentService.getTodayAppointments(),
            staffOrderService.getRecentOrders(5)
          ]);
          
          setDashboardData(prev => ({
            ...prev,
            todayBookings: todayAppointments?.bookings || [],
            recentOrders: recentOrders?.data || []
          }));
        } catch (fallbackErr) {
          console.error("Error fetching fallback data:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date to display in a readable format
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format time to display in a readable format
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div className="container mt-4">
      <h2>Staff Dashboard</h2>
      
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Note:</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
      
      <div className="row mt-4">
        <div className="col-md-3 mb-4">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <h5 className="card-title">Appointments</h5>
              <p className="card-text display-4">{dashboardData.appointments}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-success text-white">
            <div className="card-body">
              <h5 className="card-title">Orders</h5>
              <p className="card-text display-4">{dashboardData.orders}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-info text-white">
            <div className="card-body">
              <h5 className="card-title">Products</h5>
              <p className="card-text display-4">{dashboardData.products}</p>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card bg-warning text-white">
            <div className="card-body">
              <h5 className="card-title">Customers</h5>
              <p className="card-text display-4">{dashboardData.customers}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Today's Appointments</span>
              <Link to="/staff/appointments" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData.todayBookings.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Service</th>
                        <th>Time</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.todayBookings.map((appointment) => (
                        <tr key={appointment._id}>
                          <td>{appointment.userName || 'N/A'}</td>
                          <td>{appointment.serviceName}</td>
                          <td>{formatTime(appointment.time)}</td>
                          <td>
                            <span className={`badge bg-${
                              appointment.status === 'pending' ? 'warning' : 
                              appointment.status === 'confirmed' ? 'success' : 
                              appointment.status === 'cancelled' ? 'danger' : 
                              appointment.status === 'completed' ? 'info' : 'secondary'
                            }`}>
                              {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No appointments for today</p>
              )}
            </div>
          </div>
        </div>
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Recent Orders</span>
              <Link to="/staff/orders" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData.recentOrders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td>#{order._id.slice(-6).toUpperCase()}</td>
                          <td>{order.customerInfo?.name || 'N/A'}</td>
                          <td>${order.totalAmount?.toFixed(2)}</td>
                          <td>
                            <span className={`badge bg-${
                              order.status === 'processing' ? 'info' : 
                              order.status === 'shipped' ? 'primary' : 
                              order.status === 'delivered' ? 'success' : 
                              order.status === 'cancelled' ? 'danger' : 
                              order.status === 'pending' ? 'warning' : 'secondary'
                            }`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No recent orders</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;