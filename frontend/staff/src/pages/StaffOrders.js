import React, { useState, useEffect, useCallback } from 'react';
import staffOrderService from '../services/staffOrderService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

const StaffOrders = () => {  // State cho dữ liệu và UI
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All Orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
    // Sử dụng Socket.IO context với các trạng thái cần thiết
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();
  
  // Sử dụng NotificationContext để xóa thông báo khi đến trang orders
  const { clearOrderNotifications, newOrderIds, removeNewOrderId } = useNotifications();
  
  // Xóa thông báo đơn hàng khi component mount
  useEffect(() => {
    clearOrderNotifications();
  }, [clearOrderNotifications]);
  
  // Status options cho filter
  const statusOptions = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    // Handler cho sự kiện newOrder - được tối ưu bằng useCallback
  const handleNewOrder = useCallback((data) => {
    try {
      console.log('Received new order event:', data);
      
      // Kiểm tra nếu là sự kiện 'insert' (thêm mới đơn hàng)
      if (data.operationType === 'insert' && data.fullDocument) {
        // Thêm đơn hàng mới vào đầu mảng orders
        setOrders(prevOrders => [data.fullDocument, ...prevOrders]);
        
        // Note: Badge management is now handled by NotificationContext
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
    }
  }, []);
  
  // Handler cho sự kiện newBooking - được tối ưu bằng useCallback
  const handleNewBooking = useCallback((data) => {
    try {
      console.log('Received new booking event:', data);
      
      // Kiểm tra nếu là sự kiện 'insert' (thêm mới booking)
      if (data.operationType === 'insert' && data.fullDocument) {
        // Không cần lưu trữ đặt lịch mới trong StaffOrders
        console.log('New booking received but not processed in StaffOrders');
      }
    } catch (err) {
      console.error('Error processing booking data:', err);
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
  
  // Hàm fetch orders từ API - được tối ưu hóa với useCallback
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Prepare status query parameter
      const statusParam = selectedFilter === 'All Orders' ? '' : selectedFilter.toLowerCase();
      const res = await staffOrderService.getAllOrders(statusParam, currentPage, 10);
      // `res` structure: { success, count, total, totalPages, currentPage, data }
      const fetched = res.data || [];
      setOrders(fetched);
      // Determine total pages from response
      const pages = res.totalPages ?? Math.ceil(res.total / 10) ?? 1;
      setTotalPages(pages);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, currentPage]);
  
  // Fetch orders khi filter hoặc trang thay đổi
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
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
      
      // Remove the 'NEW' badge for this order if it exists
      if (newOrderIds.has(id)) {
        removeNewOrderId(id);
      }
      
      setViewOrder(orderDetails);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert(`Failed to load order details: ${err.message}. Please try again.`);
    }
  }, [newOrderIds, removeNewOrderId]);
  
  // Handler để đóng modal
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setViewOrder(null);
  }, []);
  
  // Format date helper
  const formatDate = useCallback((dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }, []);
    // Search order by ID (chỉ tìm kiếm khi đúng 6 ký tự)
  const handleSearch = useCallback(async () => {
    const trimmedSearch = searchId.trim();
    
    // Nếu không đúng 6 ký tự, không thực hiện tìm kiếm
    if (trimmedSearch.length !== 6) {
      return;
    }
    
    setLoading(true);
    try {
      console.log('Tìm kiếm với ID ngắn (6 ký tự):', trimmedSearch);
      
      // Sử dụng hàm searchOrders chỉ với ID ngắn
      const response = await staffOrderService.searchOrders(trimmedSearch);
      
      if (response.success && response.data.length > 0) {
        console.log(`Tìm thấy ${response.data.length} đơn hàng`);
        setOrders(response.data);
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        console.log('Không tìm thấy đơn hàng nào với ID:', trimmedSearch);
        setOrders([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error('Error searching order by ID:', err);
      setOrders([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  return (
    <div className="container mt-4">
      <h2>Manage Orders</h2>
      
      {/* Bảng đơn hàng chính */}
      <div className="row mb-4 mt-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Orders</span>
              <div className="d-flex align-items-center">                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by Order ID"
                  value={searchId}
                  style={{ width: '200px' }}
                  onChange={e => {
                    const val = e.target.value;
                    setSearchId(val);
                    
                    // Xử lý các trường hợp input khác nhau
                    const trimmed = val.trim();
                    
                    // Nếu trống, đặt lại danh sách ban đầu
                    if (!trimmed) {
                      setSearchId('');
                      fetchOrders();
                    }
                    // Nếu đúng 6 ký tự, thực hiện tìm kiếm
                    else if (trimmed.length === 6) {
                      handleSearch();
                    }
                    // Nếu người dùng xóa ký tự và độ dài không còn 6, đặt lại danh sách ban đầu
                    else if (trimmed.length < 6 && searchId.trim().length >= 6) {
                      fetchOrders();
                    }
                    // Trong các trường hợp khác, không làm gì (không tìm kiếm trừ khi đúng 6 ký tự)
                  }}
                  onKeyDown={e => {
                    // Cũng xử lý phím Enter cho tiện lợi
                    if (e.key === 'Enter' && searchId.trim().length === 6) handleSearch();
                  }}
                />
                <select
                  className="form-select form-select-sm ms-3"
                  style={{ width: '150px' }}
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
                          <td>{order.orderNumber || order._id.slice(-6).toUpperCase()}
                            {newOrderIds.has(order._id) && (
                              <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">NEW</span>
                            )}
                          </td>
                          <td>{order.customerInfo.name || 'N/A'}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>${order.totalAmount?.toFixed(2)}</td>                          <td>
                            <span className={`badge bg-${
                              order.status === 'pending' ? 'warning' :
                              order.status === 'processing' ? 'info' : 
                              order.status === 'shipped' ? 'primary' : 
                              order.status === 'delivered' ? 'success' : 
                              order.status === 'cancelled' ? 'danger' : 'secondary'
                            }`}>
                              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-info" 
                              onClick={() => handleViewOrder(order._id)}
                            >
                              View
                            </button>
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
          <div className="modal-dialog mx-auto" style={{ zIndex: 1050, maxHeight: '70vh', marginTop: '10vh' }}>
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 20vh)' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h5 className="modal-title">Order Details</h5>
              </div>
              <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1 }}>
                <h6>Customer Information</h6>
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-4 fw-bold">Name:</div>
                      <div className="col-8 ps-3">{viewOrder.customerInfo?.name || 'N/A'}</div>
                    </div>
                    <div className="row">
                      <div className="col-4 fw-bold">Email:</div>
                      <div className="col-8 ps-3">{viewOrder.customerInfo?.email || 'N/A'}</div>
                    </div>
                    <div className="row">
                      <div className="col-4 fw-bold">Phone:</div>
                      <div className="col-8 ps-3">{viewOrder.customerInfo?.phone || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <h6>Order Information</h6>
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-4 fw-bold">Date:</div>
                      <div className="col-8 ps-3">{formatDate(viewOrder.createdAt)}</div>
                    </div>
                    
                    <div className="row">
                      <div className="col-4 fw-bold">Payment:</div>
                      <div className="col-8 ps-3">{viewOrder.paymentMethod || 'N/A'}</div>
                    </div>

                    <div className="row">
                      <div className="col-4 fw-bold">Status:</div>                        <div className="col-8 ps-3">
                        <span className={`badge bg-${
                          viewOrder.status === 'pending' ? 'warning' :
                          viewOrder.status === 'processing' ? 'info' : 
                          viewOrder.status === 'shipped' ? 'primary' : 
                          viewOrder.status === 'delivered' ? 'success' : 
                          viewOrder.status === 'cancelled' ? 'danger' : 'secondary'}`}
                        > 
                          {viewOrder.status?.charAt(0).toUpperCase() + viewOrder.status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <h6>Shipping Address</h6>
                <div className="card mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-8 ps-3">{viewOrder.shippingAddress || 'Address not provided'}</div>
                    </div>
                  </div>
                </div>

                <h6>Order Items</h6>
                <div className="card">
                  <div className="card-body">
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
                      </table>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="row">
                    <div className="col-8 text-end fw-bold">Subtotal:</div>
                    <div className="col-4 text-end" style={{ paddingLeft: '0.5rem' }}>${viewOrder.totalAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                  <div className="row">
                    <div className="col-8 text-end fw-bold">Shipping:</div>
                    <div className="col-4 text-end" style={{ paddingLeft: '0.5rem' }}>${'0.00'}</div>
                  </div>
                  <div className="row">
                    <div className="col-8 text-end fw-bold">Total:</div>
                    <div className="col-4 text-end" style={{ paddingLeft: '0.5rem' }}><strong>${viewOrder.totalAmount?.toFixed(2) || '0.00'}</strong></div>
                  </div>
                </div>

                {['delivered', 'cancelled'].includes(viewOrder.status) ? (
                  <div 
                    className={`alert ${viewOrder.status === 'delivered' ? 'alert-success' : 'alert-danger'} mt-4`}
                    role="alert"
                  >
                    This order has been {viewOrder.status}.
                  </div>
                ) : (
                  <div className="mt-4 d-flex justify-content-around">
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'processing')}
                      disabled={viewOrder.status === 'processing' || viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Mark as Processing
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-success" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'delivered')}
                      disabled={viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Mark as Delivered
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={() => handleStatusUpdate(viewOrder._id, 'cancelled')}
                      disabled={viewOrder.status === 'delivered' || viewOrder.status === 'cancelled'}
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Close</button>
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