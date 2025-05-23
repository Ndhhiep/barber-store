import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import staffDashboardService from '../services/staffDashboardService';
import staffAppointmentService from '../services/staffAppointmentService';
import staffOrderService from '../services/staffOrderService';
import { useSocketContext } from '../context/SocketContext';
import '../css/StaffDashboard.css';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
  const [chartData, setChartData] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({
    appointmentRevenue: 0,
    orderRevenue: 0,
    totalRevenue: 0,
    month: '',
    year: new Date().getFullYear()
  });
  const [selectedChart, setSelectedChart] = useState('appointments');
  
  // Sử dụng Socket.IO context
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();

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
  
  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await staffDashboardService.getChartData();
        if (response.status === 'success') {
          setChartData(response.data);
        } else {
          throw new Error('Failed to fetch chart data');
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchChartData();
  }, []);    useEffect(() => {
    const fetchMonthlyRevenue = async () => {
      try {
        const response = await staffDashboardService.getMonthlyRevenue();
        if (response.status === 'success' && response.data) {
          // Kiểm tra và truy cập đúng cấu trúc dữ liệu
          console.log('Monthly revenue response:', response.data);
          
          // Calculate total revenue if it's not provided
          const appointmentRevenue = response.data.appointmentRevenue || 0;
          const orderRevenue = response.data.orderRevenue || 0;
          const totalRevenue = response.data.totalRevenue || (appointmentRevenue + orderRevenue);
          
          setMonthlyRevenue({
            appointmentRevenue: appointmentRevenue,
            orderRevenue: orderRevenue,
            totalRevenue: totalRevenue,
            month: new Date().toLocaleString('default', { month: 'long' }),
            year: new Date().getFullYear()
          });
        } else {
          throw new Error('Failed to fetch monthly revenue');
        }
      } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        // Thiết lập giá trị mặc định để tránh lỗi undefined
        setMonthlyRevenue({
          appointmentRevenue: 0,
          orderRevenue: 0,
          totalRevenue: 0,
          month: new Date().toLocaleString('default', { month: 'long' }),
          year: new Date().getFullYear()
        });
      }
    };

    fetchMonthlyRevenue();
  }, []);
  
  // Thiết lập lắng nghe sự kiện Socket.IO khi component được mount
  useEffect(() => {
    if (!isConnected) return;
    
    console.log('Setting up socket listeners for dashboard');
    
  // Xử lý sự kiện đơn hàng mới
    const handleNewOrder = (data) => {
      console.log('Received new order event:', data);
      
      // Cập nhật danh sách đơn hàng gần đây nếu là đơn hàng mới
      if (data.operationType === 'insert') {
        if (data.fullDocument) {
          const newOrder = data.fullDocument;
          setDashboardData(prev => ({
            ...prev,
            recentOrders: [newOrder, ...prev.recentOrders.slice(0, 4)], // Giữ chỉ 5 đơn hàng gần nhất
            orders: prev.orders + 1 // Tăng số lượng đơn hàng
          }));
        }
      }
    };
      // Xử lý sự kiện lịch hẹn mới
    const handleNewBooking = (data) => {
      console.log('Received new booking event:', data);
      
      // Cập nhật danh sách lịch hẹn hôm nay nếu là lịch hẹn mới cho ngày hôm nay
      if (data.operationType === 'insert') {
        if (data.fullDocument) {
          const today = new Date().toISOString().split('T')[0];
          const bookingDate = new Date(data.fullDocument.date).toISOString().split('T')[0];
          
          if (bookingDate === today) {
            setDashboardData(prev => ({
              ...prev,
              todayBookings: [data.fullDocument, ...prev.todayBookings],
              appointments: prev.appointments + 1 // Tăng số lượng lịch hẹn
            }));
          } else {
            // Nếu không phải lịch hẹn cho ngày hôm nay, chỉ tăng tổng số
            setDashboardData(prev => ({
              ...prev,
              appointments: prev.appointments + 1
            }));
          }
        }
      }
    };
    
    // Đăng ký các xử lý sự kiện
    registerHandler('newOrder', handleNewOrder);
    registerHandler('newBooking', handleNewBooking);
    
    // Dọn dẹp khi component unmount
    return () => {
      console.log('Cleaning up socket listeners');
      unregisterHandler('newOrder', handleNewOrder);
      unregisterHandler('newBooking', handleNewBooking);
    };
  }, [isConnected, registerHandler, unregisterHandler]);  // Định dạng thời gian để hiển thị dễ đọc
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <div className="text-center my-5"><div className="spinner-border" role="status"></div></div>;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Staff Dashboard</h2>
        <span><b>Today's date:</b> {new Date().toLocaleDateString('en-GB')}</span>
      </div>
      {error && (
        <div className="alert alert-warning alert-dismissible fade show" role="alert">
          <strong>Note:</strong> {error}
          <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      )}
      
      
      <div className="row mt-4">
        <div className="col-md-3 mb-4">
          <div className="card border-top border-primary border-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar2-event fs-3 text-primary me-2"></i>
                  <h6 className="mb-0">Appointments</h6>
                </div>
                
              </div>
              <h3 className="fw-bold">{dashboardData.appointments}</h3>
              
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card border-top border-success border-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-bag-check fs-3 text-success me-2"></i>
                  <h6 className="mb-0">Orders</h6>
                </div>
                
              </div>
              <h3 className="fw-bold">{dashboardData.orders}</h3>
              
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-4">
          <div className="card border-top border-warning border-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-people fs-3 text-warning me-2"></i>
                  <h6 className="mb-0">Customers</h6>
                </div>
                
              </div>
              <h3 className="fw-bold">{dashboardData.customers}</h3>
              
            </div>
          </div>
        </div>        <div className="col-md-3 mb-4">
          <div className="card border-top border-info border-3 shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-currency-dollar fs-3 text-info me-2"></i>
                  <h6 className="mb-0">Total Revenue</h6>
                </div>
                <small className="text-muted">{monthlyRevenue.month} {monthlyRevenue.year}</small>
              </div>
              <h3 className="fw-bold">${monthlyRevenue.totalRevenue.toFixed(2)}</h3>
              
            </div>
          </div>
        </div>
      </div>
        <div className="row mt-4">
        <div className="col-md-6 mb-4">
          <div className="card dashboard-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center"><i className="bi bi-calendar2-event fs-4 text-primary me-2"></i><span>Today's Appointments</span></div>
              <Link to="/appointments" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData.todayBookings.length > 0 ? (
                <div className="table-responsive dashboard-table-container">
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
                </div>              ) : (
                <p className="text-center">No appointments for today</p>
              )}
            </div>
          </div>
        </div>        <div className="col-md-6 mb-4">
          <div className="card dashboard-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center"><i className="bi bi-bag-check fs-4 text-success me-2"></i><span>Recent Orders</span></div>
              <Link to="/orders" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body">
              {dashboardData.recentOrders.length > 0 ? (
                <div className="table-responsive dashboard-table-container">
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
                </div>              ) : (
                <p className="text-center">No recent orders</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-12 mb-4">
          <div className="card dashboard-card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center"><i className="bi bi-graph-up fs-4 text-primary me-2"></i><span>Performance</span></div>
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-primary ${selectedChart === 'appointments' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('appointments')}
                >
                  Appointments
                </button>
                <button
                  type="button"
                  className={`btn btn-sm btn-outline-primary ${selectedChart === 'orders' ? 'active' : ''}`}
                  onClick={() => setSelectedChart('orders')}
                >
                  Orders
                </button>
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