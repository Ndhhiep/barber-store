import React, { useState, useEffect, useCallback } from 'react';
import staffOrderService from '../services/staffOrderService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

const StaffOrders = () => {
  // State cho dữ liệu và UI
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All Orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [socketErrors, setSocketErrors] = useState([]);
  // Thêm state mới để theo dõi đơn hàng mới
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  
  // Sử dụng Socket.IO context với các trạng thái mở rộng
  const { isConnected, isLoading, error: socketError, registerHandler, unregisterHandler, reconnect } = useSocketContext();
  
  // Sử dụng NotificationContext để xóa thông báo khi đến trang orders
  const { clearOrderNotifications } = useNotifications();
  
  // Xóa thông báo đơn hàng khi component mount
  useEffect(() => {
    clearOrderNotifications();
  }, [clearOrderNotifications]);
  
  // Status options cho filter
  const statusOptions = ['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  
  // Handler cho sự kiện newOrder - được tối ưu bằng useCallback
  const handleNewOrder = useCallback((data) => {
    try {
      console.log('Received new order event:', data);
      
      // Kiểm tra nếu là sự kiện 'insert' (thêm mới đơn hàng)
      if (data.operationType === 'insert' && data.fullDocument) {
        // Thêm đơn hàng mới vào đầu mảng orders
        setOrders(prevOrders => [data.fullDocument, ...prevOrders]);
        
        // Đánh dấu đơn hàng này là mới trong Set
        setNewOrderIds(prev => new Set(prev).add(data.fullDocument._id));
        
        // Hiển thị phần thông báo nếu chưa hiển thị
        setShowNotifications(true);
        
        // Sau 60 giây, bỏ đánh dấu "NEW" cho đơn hàng này
        setTimeout(() => {
          setNewOrderIds(prev => {
            const updated = new Set(prev);
            updated.delete(data.fullDocument._id);
            return updated;
          });
        }, 60000); // 60 seconds
      } 
      // Nếu là sự kiện cập nhật
      else if (data.operationType === 'update' && data.documentId) {
        // Tìm và cập nhật đơn hàng trong danh sách hiện tại
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === data.documentId 
              ? { ...order, ...(data.updateDescription?.updatedFields || {}) } 
              : order
          )
        );
      }
    } catch (err) {
      console.error('Error processing order data:', err);
      setSocketErrors(prev => [...prev, {
        time: new Date().toISOString(),
        message: `Lỗi xử lý dữ liệu đơn hàng: ${err.message}`,
        event: 'newOrder'
      }]);
    }
  }, []);
  
  // Handler cho sự kiện newBooking - được tối ưu bằng useCallback
  const handleNewBooking = useCallback((data) => {
    try {
      console.log('Received new booking event:', data);
      
      // Kiểm tra nếu là sự kiện 'insert' (thêm mới booking)
      if (data.operationType === 'insert' && data.fullDocument) {
        // Thêm booking mới vào đầu mảng bookings
        setBookings(prevBookings => [data.fullDocument, ...prevBookings]);
        
        // Hiển thị phần thông báo nếu chưa hiển thị
        setShowNotifications(true);
      }
    } catch (err) {
      console.error('Error processing booking data:', err);
      setSocketErrors(prev => [...prev, {
        time: new Date().toISOString(),
        message: `Lỗi xử lý dữ liệu đặt lịch: ${err.message}`,
        event: 'newBooking'
      }]);
    }
  }, []);
  
  // Lắng nghe sự kiện Socket.IO
  useEffect(() => {
    if (!isConnected) return;
    
    console.log('Setting up socket listeners in StaffOrders');
    
    // Đăng ký các sự kiện với Socket.IO
    registerHandler('newOrder', handleNewOrder);
    registerHandler('newBooking', handleNewBooking);
    
    // Clean up khi component unmount
    return () => {
      console.log('Cleaning up socket listeners in StaffOrders');
      unregisterHandler('newOrder', handleNewOrder);
      unregisterHandler('newBooking', handleNewBooking);
    };
  }, [isConnected, registerHandler, unregisterHandler, handleNewOrder, handleNewBooking]);
  
  // Fetch orders khi filter hoặc trang thay đổi
  useEffect(() => {
    fetchOrders();
  }, [selectedFilter, currentPage]);
  
  // Hàm fetch orders từ API - được tối ưu hóa với try-catch
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const status = selectedFilter === 'All Orders' ? '' : selectedFilter.toLowerCase();
      const response = await staffOrderService.getAllOrders(status, currentPage, 10);
      
      if (!response || (!response.data && !response.orders)) {
        throw new Error('Invalid response format from server');
      }
      
      setOrders(response.data || response.orders || []);
      setTotalPages(response.totalPages || response.total_pages || Math.ceil(response.total / 10) || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(`Failed to load orders: ${err.message}. Please try again later.`);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handler cho thay đổi filter - tối ưu hóa
  const handleFilterChange = useCallback((e) => {
    setSelectedFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  }, []);
  
  // Handler cho thay đổi trang - tối ưu hóa
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);
  
  // Handler cho cập nhật trạng thái đơn hàng - tối ưu hóa
  const handleStatusUpdate = useCallback(async (id, newStatus) => {
    try {
      await staffOrderService.updateOrderStatus(id, newStatus);
      
      // Update local state to reflect the change
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === id ? { ...order, status: newStatus } : order
        )
      );
      
      // If viewing order details, update that too
      setViewOrder(prev => prev && prev._id === id ? { ...prev, status: newStatus } : prev);
      
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(`Failed to update order status: ${err.message}. Please try again.`);
    }
  }, []);
  
  // Handler để xem chi tiết đơn hàng - tối ưu hóa
  const handleViewOrder = useCallback(async (id) => {
    try {
      const response = await staffOrderService.getOrderById(id);
      // Extract the order details from the data property if it exists, otherwise use the response directly
      const orderDetails = response.data || response;
      
      // Add a defensive check to ensure we have a valid orderDetails object
      if (!orderDetails || !orderDetails._id) {
        throw new Error('Invalid order data received');
      }
      
      setViewOrder(orderDetails);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert(`Failed to load order details: ${err.message}. Please try again.`);
    }
  }, []);
  
  // Handler để đóng modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setViewOrder(null);
  }, []);
  
  // Xóa thông báo lỗi socket
  const dismissSocketError = useCallback((index) => {
    setSocketErrors(prev => prev.filter((_, i) => i !== index));
  }, []);
  
  // Thử kết nối lại khi có lỗi
  const handleReconnect = useCallback(() => {
    reconnect();
  }, [reconnect]);
  
  // Format date helper
  const formatDate = useCallback((dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);
  
  return (
    <div className="container mt-4">
      <h2>Manage Orders</h2>
      
      {/* Hiển thị lỗi chính */}
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
          
          <button 
            className="btn btn-sm btn-primary me-2" 
            onClick={() => setShowNotifications(!showNotifications)}
            disabled={isLoading}
          >
            {showNotifications ? 'Hide' : 'Show'} Real-time Notifications
          </button>
          
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
      
      {/* Real-time Notifications Panel */}
      {showNotifications && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-primary">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">Real-time Notifications</h5>
              </div>
              <div className="card-body">
                {isLoading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Establishing connection to real-time server...</p>
                  </div>
                ) : (
                  <div className="row">
                    {/* New Orders Column */}
                    <div className="col-md-6">
                      <h6>New Orders</h6>
                      {orders.length > 0 ? (
                        <ul className="list-group">
                          {orders.slice(0, 5).map(order => (
                            <li 
                              key={`order-${order._id}`}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <span className="badge bg-success me-2">Order</span>
                                #{order._id.slice(-6).toUpperCase()} - {order.customerInfo?.name || 'N/A'}
                                <small className="ms-2 text-muted">
                                  {order.createdAt && new Date(order.createdAt).toLocaleTimeString()}
                                </small>
                              </div>
                              <button 
                                className="btn btn-sm btn-info"
                                onClick={() => handleViewOrder(order._id)}
                              >
                                View
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No new orders received.</p>
                      )}
                    </div>
                    
                    {/* New Bookings Column */}
                    <div className="col-md-6">
                      <h6>New Bookings</h6>
                      {bookings.length > 0 ? (
                        <ul className="list-group">
                          {bookings.slice(0, 5).map(booking => (
                            <li 
                              key={`booking-${booking._id}`}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div>
                                <span className="badge bg-primary me-2">Booking</span>
                                {booking.userName || 'N/A'} - {booking.serviceName || 'Service'}
                                <small className="ms-2 text-muted">
                                  {booking.date && new Date(booking.date).toLocaleDateString()} {booking.time}
                                </small>
                              </div>
                              <span className={`badge bg-${
                                booking.status === 'pending' ? 'warning' : 
                                booking.status === 'confirmed' ? 'success' : 
                                booking.status === 'cancelled' ? 'danger' : 
                                booking.status === 'completed' ? 'info' : 'secondary'
                              }`}>
                                {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No new bookings received.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Orders Table */}
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Orders</span>
              <div>
                <select 
                  className="form-select form-select-sm" 
                  style={{width: '150px'}}
                  value={selectedFilter}
                  onChange={handleFilterChange}
                >
                  {statusOptions.map((option, index) => (
                    <option key={`filter-option-${index}`} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center my-3"><div className="spinner-border" role="status"></div></div>
              ) : orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id} className={newOrderIds.has(order._id) ? 'table-warning' : ''}>
                          <td>#{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            {newOrderIds.has(order._id) && (
                              <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">NEW</span>
                            )}
                          </td>
                          <td>{order.userName || 'N/A'}</td>
                          <td>{formatDate(order.createdAt)}</td>
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
                          <td>
                            <div className="dropdown">
                              <button 
                                className="btn btn-sm btn-primary me-1" 
                                type="button" 
                                id={`updateStatus-${order._id}`} 
                                data-bs-toggle="dropdown" 
                                aria-expanded="false"
                              >
                                Update
                              </button>
                              <ul className="dropdown-menu" aria-labelledby={`updateStatus-${order._id}`}>
                                <li>
                                  <button 
                                    className="dropdown-item" 
                                    onClick={() => handleStatusUpdate(order._id, 'processing')}
                                    disabled={order.status === 'processing'}
                                  >
                                    Processing
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item" 
                                    onClick={() => handleStatusUpdate(order._id, 'shipped')}
                                    disabled={order.status === 'shipped' || order.status === 'delivered' || order.status === 'cancelled'}
                                  >
                                    Shipped
                                  </button>
                                </li>
                                <li>
                                  <button 
                                    className="dropdown-item" 
                                    onClick={() => handleStatusUpdate(order._id, 'delivered')}
                                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                                  >
                                    Delivered
                                  </button>
                                </li>
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                  <button 
                                    className="dropdown-item text-danger" 
                                    onClick={() => handleStatusUpdate(order._id, 'cancelled')}
                                    disabled={order.status === 'delivered' || order.status === 'cancelled'}
                                  >
                                    Cancel
                                  </button>
                                </li>
                              </ul>
                              <button 
                                className="btn btn-sm btn-info me-1" 
                                onClick={() => handleViewOrder(order._id)}
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">No orders found for the selected filter.</p>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <li 
                        key={i} 
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Order Details Modal */}
      {isModalOpen && viewOrder && (
        <div className="modal show d-block" tabIndex="1">
          <div className="modal-dialog modal-lg" style={{zIndex: 1050}}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order #{viewOrder.orderNumber || viewOrder._id?.slice(-6).toUpperCase()}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <h6>Customer Information</h6>
                    <p><strong>Name:</strong> {viewOrder.customerInfo?.name || 'N/A'}</p>
                    <p><strong>Email:</strong> {viewOrder.customerInfo?.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {viewOrder.customerInfo?.phone || 'N/A'}</p>
                  </div>
                  <div className="col-md-6">
                    <h6>Order Information</h6>
                    <p><strong>Date:</strong> {formatDate(viewOrder.createdAt)}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 bg-${
                        viewOrder.status === 'processing' ? 'info' : 
                        viewOrder.status === 'shipped' ? 'primary' : 
                        viewOrder.status === 'delivered' ? 'success' : 
                        viewOrder.status === 'cancelled' ? 'danger' : 'secondary'
                      }`}>
                        {viewOrder.status?.charAt(0).toUpperCase() + viewOrder.status?.slice(1)}
                      </span>
                    </p>
                    <p><strong>Payment Method:</strong> {viewOrder.paymentMethod || 'N/A'}</p>
                  </div>
                </div>
                
                <h6>Shipping Address</h6>
                <p>
                  {viewOrder.shippingAddress || 'Address not provided'}
                </p>
                
                <h6>Order Items</h6>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.items && viewOrder.items.length > 0 ? (
                        viewOrder.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.productId?.name || 'Product'}</td>
                            <td>${item.priceAtPurchase?.toFixed(2) || '0.00'}</td>
                            <td>{item.quantity || 1}</td>
                            <td>${((item.priceAtPurchase || 0) * (item.quantity || 1)).toFixed(2)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No items found</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Subtotal</strong></td>
                        <td>${viewOrder.totalAmount?.toFixed(2) || '0.00'}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Shipping</strong></td>
                        <td>${'0.00'}</td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="text-end"><strong>Total</strong></td>
                        <td><strong>${viewOrder.totalAmount?.toFixed(2) || '0.00'}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <div className="me-auto">
                  <div className="btn-group" role="group">
                    <button 
                      type="button" 
                      className="btn btn-outline-primary" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'processing')}
                      disabled={viewOrder.status === 'processing' || viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Mark as Processing
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-primary" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'shipped')}
                      disabled={viewOrder.status === 'shipped' || viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Mark as Shipped
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-success" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'delivered')}
                      disabled={viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Mark as Delivered
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-outline-danger" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'cancelled')}
                      disabled={viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Cancel Order
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" style={{zIndex: 1040}}></div>
        </div>
      )}
    </div>
  );
};

export default StaffOrders;