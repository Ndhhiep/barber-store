import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/MyOrdersPage.css';
import orderService from '../services/orderService';
import authService from '../services/authService';

const MyOrdersPage = () => {  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  // Add pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  // Cancel order states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  
  const navigate = useNavigate();
  // Fetch all orders for the current user
  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          navigate('/login?redirect=my-orders');
          return;
        }
        
        // Fetch my orders using the orderService
        const result = await orderService.getMyOrders();
        console.log('Fetch order history result:', result);
        
        if (result.success) {
          // Sort orders by date (most recent first)
          const sortedOrders = result.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setOrders(sortedOrders);
          
          // If we have orders, select the first one for display
          if (sortedOrders.length > 0) {
            setSelectedOrder(sortedOrders[0]);
          }
        } else {
          console.error('Failed to fetch orders:', result.message);
          setError(result.message || 'Failed to load order history');
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || 'Failed to load order history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderHistory();
  }, [navigate]);
  
  // Function to fetch a single order by ID
  const fetchOrderById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!authService.isAuthenticated()) {
        navigate('/login?redirect=my-orders');
        return;
      }
      
      const result = await orderService.getOrderById(id);
      
      if (result.success) {
        setSelectedOrder(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch order details');
      }
    } catch (err) {
      console.error('Error fetching order:', err);
      setError(`Unable to load order details: ${err.message}`);
      
      // If we have other orders, select the first one to avoid showing empty state
      if (orders.length > 0 && selectedOrder && selectedOrder._id === id) {
        const fallbackOrder = orders.find(order => order._id !== id) || orders[0];
        setSelectedOrder(fallbackOrder);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate, orders, selectedOrder]);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning text-dark';
      case 'processing': return 'bg-info text-dark';
      case 'shipped': return 'bg-primary';
      case 'delivered': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  // Handle cancel order
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;
    
    setCancellingOrder(true);
    setCancelMessage('');
    setCancelSuccess(false);
    
    try {
      const result = await orderService.cancelOrder(selectedOrder._id);
      
      if (result.success) {
        setCancelMessage('Order cancelled successfully!');
        setCancelSuccess(true);
        
        // Update the selected order status
        const updatedOrder = { ...selectedOrder, status: 'cancelled' };
        setSelectedOrder(updatedOrder);
        
        // Update the orders list
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === selectedOrder._id 
              ? { ...order, status: 'cancelled' }
              : order
          )
        );
        
        // Close modal after delay
        setTimeout(() => {
          setShowCancelModal(false);
          setCancelMessage('');
          setCancelSuccess(false);
        }, 2000);
      } else {
        setCancelMessage(result.message || 'Failed to cancel order');
        setCancelSuccess(false);
      }
    } catch (error) {
      console.error('Cancel order error:', error);
      setCancelMessage(error.message || 'Failed to cancel order');
      setCancelSuccess(false);
    } finally {
      setCancellingOrder(false);
    }
  };

  // Check if order can be cancelled
  const canCancelOrder = (order) => {
    return order && (order.status === 'pending' || order.status === 'processing');
  };

  if (loading && orders.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your order history...</p>
      </div>
    );
  }

  // Calculate pagination indexes
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  // Change page
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Select the first order of the new page if available
    const newPageOrders = orders.slice((pageNumber - 1) * ordersPerPage, pageNumber * ordersPerPage);
    if (newPageOrders.length > 0) {
      fetchOrderById(newPageOrders[0]._id);
    }
  };
  return (
    <div className="container my-orders-container my-3 my-md-5">
      <h1 className="text-center mb-3 mb-md-4">My Orders</h1>
      
      {error && !orders.length && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {orders.length === 0 && !error ? (
        <div className="text-center py-4 py-md-5">
          <h3 className="mb-3 mb-md-4">You don't have any orders yet.</h3>
          <Link to="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="row equal-height">
          {/* Order List */}
          <div className="col-12 col-md-4 mb-3 mb-md-0">
            <div className="card order-list-card">
              <div className="card-header">
                <h5 className="mb-0">Your Orders</h5>
              </div>
              <div className="list-group list-group-flush">
                {currentOrders.map((order) => (
                  <button 
                    key={order._id} 
                    className={`list-group-item list-group-item-action ${selectedOrder && selectedOrder._id === order._id ? 'active' : ''}`}
                    onClick={() => fetchOrderById(order._id)}
                  >                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1" style={{fontFamily: 'sans-serif'}}>Order ID: {order._id.substring(order._id.length - 6)}</h6>
                      <span className={`badge ${getStatusBadgeColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="mb-1">${order.totalAmount.toFixed(2)} - {order.items.length} items</p>
                    <small>{formatDate(order.createdAt)}</small>
                  </button>
                ))}              </div>              
              {/* Pagination Controls */}
              <div className="card-footer">
                {totalPages > 1 ? (
                  <nav>
                    <ul className="pagination pagination-sm justify-content-center mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          &laquo;
                        </button>
                      </li>
                      
                      {[...Array(totalPages)].map((_, index) => (
                        <li key={index} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                          <button 
                            className="page-link"
                            onClick={() => paginate(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                ) : (
                  <small className="text-muted">Showing all orders</small>
                )}
              </div>
            </div>
          </div>          
          {/* Order Details */}
          <div className="col-12 col-md-8">
            {loading && selectedOrder ? (
              <div className="card order-detail-card">
                <div className="card-body d-flex flex-column justify-content-center align-items-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading order details...</p>
                </div>
                <div className="card-footer">
                  <small className="text-muted">Loading order information...</small>
                </div>
              </div>
            ) : error ? (
              <div className="card order-detail-card">
                <div className="card-body d-flex flex-column">
                  <div className="alert alert-danger" role="alert">
                    <div className="d-flex align-items-center mb-2">
                      <i className="bi bi-exclamation-triangle-fill me-2" style={{ fontSize: "1.5rem" }}></i>
                      <h5 className="mb-0">Error Loading Order</h5>
                    </div>
                    <p>{error}</p>
                    <p className="mb-0">
                      <button className="btn btn-outline-primary btn-sm" onClick={() => setError(null)}>
                        <i className="bi bi-arrow-left me-1"></i> Return to Orders
                      </button>
                    </p>
                  </div>
                </div>
                <div className="card-footer">
                  <small className="text-muted">An error occurred while loading order details</small>
                </div>
              </div>
            ) : selectedOrder ? (              <div className="card order-detail-card">                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0" style={{fontFamily: 'sans-serif'}}>Order ID: {selectedOrder._id.substring(selectedOrder._id.length - 6)}</h5>
                    <small className="text-muted">Placed on {formatDate(selectedOrder.createdAt)}</small>
                  </div>
                  <span className={`badge ${getStatusBadgeColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <h6>Customer Information</h6>
                      <p className="mb-1"><strong>Name:</strong> {selectedOrder.customerInfo.name}</p>
                      <p className="mb-1"><strong>Email:</strong> {selectedOrder.customerInfo.email}</p>
                      <p className="mb-0"><strong>Phone:</strong> {selectedOrder.customerInfo.phone}</p>
                    </div>
                    <div className="col-md-6">
                      <h6>Shipping Address</h6>
                      <p className="mb-2">{selectedOrder.shippingAddress}</p>
                      <h6>Payment Method</h6>
                      <p className="mb-0">{selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                        selectedOrder.paymentMethod === 'credit' ? 'Credit Card' : 'PayPal'}</p>
                    </div>
                  </div>
                  
                  <h6>Items</h6>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item._id}>
                            <td>
                              <div className="d-flex align-items-center">
                                {item.productId && item.productId.imageUrl && (
                                  <img 
                                    src={item.productId.imageUrl} 
                                    alt={item.productId.name} 
                                    className="product-thumbnail me-2" 
                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                  />
                                )}
                                <span>{item.productId ? item.productId.name : 'Product Unavailable'}</span>
                              </div>
                            </td>
                            <td>{item.quantity}</td>
                            <td>${item.priceAtPurchase.toFixed(2)}</td>
                            <td>${(item.quantity * item.priceAtPurchase).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3" className="text-end fw-bold">Total:</td>
                          <td className="fw-bold">${selectedOrder.totalAmount.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                    {selectedOrder.notes && (
                    <div className="mt-3">
                      <h6>Notes</h6>
                      <p className="mb-0">{selectedOrder.notes}</p>
                    </div>
                  )}
                  
                  {/* Order Status and Actions */}
                  <div className="mt-4">
                    {selectedOrder.status === 'pending' ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="alert alert-info mb-0 py-2 flex-grow-1 me-3" role="alert">
                          <i className="bi bi-info-circle me-1"></i>
                          Your order is being processed. We'll update you when it ships.
                        </div>
                        {canCancelOrder(selectedOrder) && (
                          <button 
                            className="btn btn-danger"
                            onClick={() => setShowCancelModal(true)}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel Order
                          </button>
                        )}
                      </div>
                    ) : selectedOrder.status === 'processing' ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="alert alert-warning mb-0 py-2 flex-grow-1 me-3" role="alert">
                          <i className="bi bi-clock me-1"></i>
                          Your order is being processed.
                        </div>
                        {canCancelOrder(selectedOrder) && (
                          <button 
                            className="btn btn-danger"
                            onClick={() => setShowCancelModal(true)}
                          >
                            <i className="bi bi-x-circle me-1"></i>
                            Cancel Order
                          </button>
                        )}
                      </div>
                    ) : selectedOrder.status === 'cancelled' ? (
                      <div className="alert alert-danger mb-0 py-2" role="alert">
                        <i className="bi bi-x-circle me-1"></i>
                        This order has been cancelled.
                      </div>
                    ) : selectedOrder.status === 'delivered' ? (
                      <div className="alert alert-success mb-0 py-2" role="alert">
                        <i className="bi bi-check-circle me-1"></i>
                        Order delivered successfully!
                      </div>
                    ) : selectedOrder.status === 'shipped' ? (
                      <div className="alert alert-primary mb-0 py-2" role="alert">
                        <i className="bi bi-truck me-1"></i>
                        Your order has been shipped and is on the way!
                      </div>
                    ) : (
                      <div className="alert alert-secondary mb-0 py-2" role="alert">
                        Order status: {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (              <div className="card order-detail-card">
                <div className="card-body d-flex flex-column justify-content-center align-items-center">
                  <h3>No Order Selected</h3>
                  <p className="mt-3">Please select an order from the list to view details.</p>
                </div>
                <div className="card-footer">
                  <small className="text-muted">Select an order to view details</small>
                </div>
              </div>
            )}
          </div>        </div>
      )}
      
      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Order</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancellingOrder}
                ></button>
              </div>
              <div className="modal-body">
                {cancelMessage && (
                  <div className={`alert ${cancelSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
                    <i className={`bi ${cancelSuccess ? 'bi-check-circle' : 'bi-exclamation-triangle'} me-2`}></i>
                    {cancelMessage}
                  </div>
                )}
                
                {!cancelSuccess && (
                  <>
                    <p>Are you sure you want to cancel this order?</p>
                    {selectedOrder && (
                      <div className="border rounded p-3 bg-light">
                        <strong>Order ID:</strong> {selectedOrder._id.substring(selectedOrder._id.length - 6)}<br/>
                        <strong>Total Amount:</strong> ${selectedOrder.totalAmount.toFixed(2)}<br/>
                        <strong>Status:</strong> {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}<br/>
                        <strong>Items:</strong> {selectedOrder.items.length} item(s)
                      </div>
                    )}
                    <div className="mt-3">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        This action cannot be undone. Once cancelled, you will need to place a new order.
                      </small>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                {!cancelSuccess && (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowCancelModal(false)}
                      disabled={cancellingOrder}
                    >
                      Keep Order
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger" 
                      onClick={handleCancelOrder}
                      disabled={cancellingOrder}
                    >
                      {cancellingOrder ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Cancelling...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-x-circle me-1"></i>
                          Yes, Cancel Order
                        </>
                      )}
                    </button>
                  </>
                )}
                {cancelSuccess && (
                  <button 
                    type="button" 
                    className="btn btn-success" 
                    onClick={() => setShowCancelModal(false)}
                  >
                    <i className="bi bi-check-lg me-1"></i>
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      
    </div>
  );
};

export default MyOrdersPage;