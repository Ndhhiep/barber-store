import React, { useState, useEffect } from 'react';
import staffOrderService from '../services/staffOrderService';

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All Orders');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewOrder, setViewOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Status options for filtering orders
  const statusOptions = ['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  
  useEffect(() => {
    fetchOrders();
  }, [selectedFilter, currentPage]);
  
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const status = selectedFilter === 'All Orders' ? '' : selectedFilter.toLowerCase();
      const response = await staffOrderService.getAllOrders(status, currentPage, 10);
      setOrders(response.data || []); // Changed from response.orders to response.data
      setTotalPages(response.totalPages || response.total_pages || Math.ceil(response.total / 10) || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
    setCurrentPage(1); // Reset to first page when changing filter
  };
  
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await staffOrderService.updateOrderStatus(id, newStatus);
      
      // Update local state to reflect the change
      setOrders(orders.map(order => 
        order._id === id ? { ...order, status: newStatus } : order
      ));
      
      // If viewing order details, update that too
      if (viewOrder && viewOrder._id === id) {
        setViewOrder({ ...viewOrder, status: newStatus });
      }
      
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    }
  };
  
  const handleViewOrder = async (id) => {
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
      alert('Failed to load order details. Please try again.');
    }
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setViewOrder(null);
  };
  
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="container mt-4">
      <h2>Manage Orders</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
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
                    <option key={index} value={option}>{option}</option>
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
                        <tr key={order._id}>
                          <td>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
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