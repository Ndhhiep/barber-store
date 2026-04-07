import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import staffDashboardService from '../services/staffDashboardService';
import staffAppointmentService from '../services/staffAppointmentService';
import staffOrderService from '../services/staffOrderService';
import useSocketEvent from '../hooks/useSocketEvent';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import StatusBadge from '../components/common/StatusBadge';
import { formatCurrency, formatShortId, formatTimeSlot } from '../utils/formatters';
import '../css/StaffDashboard.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EMPTY_DASHBOARD = {
  appointments: 0, orders: 0, products: 0, customers: 0,
  todayBookings: [], recentOrders: []
};

const StaffDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    appointmentRevenue: 0, orderRevenue: 0, totalRevenue: 0,
    month: '', year: new Date().getFullYear()
  });
  const [selectedChart, setSelectedChart] = useState('appointments');

  // Fetch main dashboard stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await staffDashboardService.getDashboardStats();

        if (response.status === 'success') {
          console.log('Today bookings data:', response.data.todayBookings);
          console.log('Today bookings from API:', JSON.stringify(response.data.todayBookings, null, 2));
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
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Showing placeholder information.');
        // Fallback
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
          console.error('Error fetching fallback data:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Fetch chart data
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await staffDashboardService.getChartData();
        if (response.status === 'success') setChartData(response.data);
        else throw new Error('Failed to fetch chart data');
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };
    fetchChartData();
  }, []);

  // Fetch monthly revenue
  useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      try {
        const response = await staffDashboardService.getMonthlyRevenue();
        if (response.status === 'success' && response.data) {
          console.log('Monthly revenue response:', response.data);
          const { appointmentRevenue = 0, orderRevenue = 0, totalRevenue } = response.data;
          setMonthlyRevenue({
            appointmentRevenue,
            orderRevenue,
            totalRevenue: totalRevenue || (appointmentRevenue + orderRevenue),
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear()
          });
        } else throw new Error('Failed to fetch monthly revenue');
      } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        setMonthlyRevenue({
          appointmentRevenue: 0, orderRevenue: 0, totalRevenue: 0,
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear()
        });
      }
    };
    fetchMonthlyRevenue();
  }, []);

  // Socket event: new order
  useSocketEvent('newOrder', useCallback((data) => {
    console.log('Received new order event:', data);
    if (data.operationType === 'insert' && data.fullDocument) {
      setDashboardData(prev => ({
        ...prev,
        recentOrders: [data.fullDocument, ...prev.recentOrders.slice(0, 4)],
        orders: prev.orders + 1
      }));
    }
  }, []));

  // Socket event: new booking
  useSocketEvent('newBooking', useCallback((data) => {
    console.log('Received new booking event:', data);
    if (data.operationType === 'insert' && data.fullDocument) {
      const today = new Date().toISOString().split('T')[0];
      const bookingDate = new Date(data.fullDocument.date).toISOString().split('T')[0];
      if (bookingDate === today) {
        const formattedBooking = {
          ...data.fullDocument,
          services: Array.isArray(data.fullDocument.services) ? data.fullDocument.services : [],
          service: data.fullDocument.service || 'N/A',
          serviceName: Array.isArray(data.fullDocument.services) && data.fullDocument.services.length > 0
            ? data.fullDocument.services.join(', ')
            : data.fullDocument.service || 'N/A'
        };
        setDashboardData(prev => ({
          ...prev,
          todayBookings: [formattedBooking, ...prev.todayBookings],
          appointments: prev.appointments + 1
        }));
      } else {
        setDashboardData(prev => ({ ...prev, appointments: prev.appointments + 1 }));
      }
    }
  }, []));

  if (loading) return <LoadingSpinner />;

  const statCards = [
    { label: 'Appointments', value: dashboardData.appointments, icon: 'bi-calendar2-event', color: 'primary' },
    { label: 'Orders', value: dashboardData.orders, icon: 'bi-bag-check', color: 'success' },
    { label: 'Customers', value: dashboardData.customers, icon: 'bi-people', color: 'warning' },
    {
      label: 'Total Revenue', icon: 'bi-currency-dollar', color: 'info',
      value: formatCurrency(monthlyRevenue.totalRevenue),
      subtitle: `${monthlyRevenue.month} ${monthlyRevenue.year}`
    },
  ];

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Staff Dashboard</h2>
        <span><b>Today's date:</b> {new Date().toLocaleDateString('en-GB')}</span>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {/* Stat Cards */}
      <div className="row mt-4">
        {statCards.map(({ label, value, icon, color, subtitle }) => (
          <div className="col-md-3 mb-4" key={label}>
            <div className={`card border-top border-${color} border-3 shadow-sm`}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${icon} fs-3 text-${color} me-2`}></i>
                    <h6 className="mb-0">{label}</h6>
                  </div>
                  {subtitle && <small className="text-muted">{subtitle}</small>}
                </div>
                <h3 className="fw-bold">{value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Appointments & Recent Orders */}
      <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card dashboard-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="bi bi-calendar2-event fs-4 text-primary me-2"></i>
                <span>Today's Appointments</span>
              </div>
              <Link to="/appointments" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData.todayBookings.length > 0 ? (
                <div className="table-responsive dashboard-table-container">
                  <table className="table table-hover">
                    <thead>
                      <tr><th>Customer</th><th>Time</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {dashboardData.todayBookings.map(appt => (
                        <tr key={appt._id}>
                          <td>{appt.userName || 'N/A'}</td>
                          <td>{formatTimeSlot(appt.time)}</td>
                          <td><StatusBadge status={appt.status} type="booking" /></td>
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
          <div className="card dashboard-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="bi bi-bag-check fs-4 text-success me-2"></i>
                <span>Recent Orders</span>
              </div>
              <Link to="/orders" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData.recentOrders.length > 0 ? (
                <div className="table-responsive dashboard-table-container">
                  <table className="table table-hover">
                    <thead>
                      <tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentOrders.map(order => (
                        <tr key={order._id}>
                          <td>#{formatShortId(order._id)}</td>
                          <td>{order.customerInfo?.name || 'N/A'}</td>
                          <td>{formatCurrency(order.totalAmount)}</td>
                          <td><StatusBadge status={order.status} type="order" /></td>
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

      {/* Performance Chart */}
      <div className="row mt-4">
        <div className="col-12 mb-4">
          <div className="card dashboard-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="bi bi-graph-up fs-4 text-primary me-2"></i>
                <span>Performance</span>
              </div>
              <div className="btn-group" role="group">
                {['appointments', 'orders'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`btn btn-sm btn-outline-primary ${selectedChart === type ? 'active' : ''}`}
                    onClick={() => setSelectedChart(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData.length > 0 ? chartData : []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString()} />
                  <Legend />
                  {selectedChart === 'appointments' ? (
                    <Line type="monotone" dataKey="appointments" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  ) : (
                    <Line type="monotone" dataKey="orders" stroke="#8884d8" activeDot={{ r: 8 }} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;