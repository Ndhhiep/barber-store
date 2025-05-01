import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import staffAppointmentService from '../../services/staff_services/staffAppointmentService';
import staffOrderService from '../../services/staff_services/staffOrderService';
import staffProductService from '../../services/staff_services/staffProductService';
import staffCustomerService from '../../services/staff_services/staffCustomerService';

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    appointments: 0,
    orders: 0,
    products: 0,
    customers: 0,
    recentAppointments: [],
    recentOrders: []
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all stats in parallel
        // Using Promise.allSettled instead of Promise.all to handle partial failures
        const results = await Promise.allSettled([
          staffAppointmentService.getAppointmentStats(),
          staffOrderService.getOrderStats(),
          staffProductService.getProductStats(),
          staffCustomerService.getCustomerStats(),
          staffAppointmentService.getTodayAppointments(),
          staffOrderService.getRecentOrders(5)
        ]);

        // Extract successful results, use fallbacks for failed ones
        const [
          appointmentStatsResult, 
          orderStatsResult, 
          productStatsResult, 
          customerStatsResult,
          recentAppointmentsResult,
          recentOrdersResult
        ] = results;

        // Set dashboard data with fallbacks for any failed requests
        setDashboardData({
          appointments: appointmentStatsResult.status === 'fulfilled' ? appointmentStatsResult.value.total || 0 : 0,
          orders: orderStatsResult.status === 'fulfilled' ? orderStatsResult.value.total || 0 : 0,
          products: productStatsResult.status === 'fulfilled' ? productStatsResult.value.total || 0 : 0,
          customers: customerStatsResult.status === 'fulfilled' ? customerStatsResult.value.total || 0 : 0,
          recentAppointments: recentAppointmentsResult.status === 'fulfilled' ? recentAppointmentsResult.value.bookings || [] : [],
          recentOrders: recentOrdersResult.status === 'fulfilled' ? recentOrdersResult.value || [] : []
        });
        
        // Check if any requests failed
        const anyFailures = results.some(result => result.status === 'rejected');
        if (anyFailures) {
          console.warn("Some dashboard data failed to load.");
          setError("Some data could not be loaded. Showing available information.");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Showing placeholder information.");
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
              {dashboardData.recentAppointments.length > 0 ? (
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
                      {dashboardData.recentAppointments.slice(0, 5).map((appointment) => (
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
                          <td>#{order.orderNumber}</td>
                          <td>{order.userName || 'N/A'}</td>
                          <td>${order.totalAmount?.toFixed(2)}</td>
                          <td>
                            <span className={`badge bg-${
                              order.status === 'processing' ? 'info' : 
                              order.status === 'shipped' ? 'primary' : 
                              order.status === 'delivered' ? 'success' : 
                              order.status === 'cancelled' ? 'danger' : 'secondary'
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