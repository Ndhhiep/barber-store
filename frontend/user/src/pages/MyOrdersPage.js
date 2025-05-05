import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/MyOrdersPage.css';
import orderService from '../services/orderService';
import authService from '../services/authService';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
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
        
        if (result.success) {
          setOrders(result.data);
          // If we have orders, select the first one for display
          if (result.data.length > 0) {
            setSelectedOrder(result.data[0]);
          }
        } else {
          throw new Error(result.message || 'Failed to fetch orders');
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
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [navigate]);
  
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

  return (
    <div className="container my-orders-container my-5">
      <h1 className="text-center mb-4">My Orders</h1>
      
      {error && !orders.length && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      
      {orders.length === 0 && !error ? (
        <div className="text-center py-5">
          <h3 className="mb-4">You don't have any orders yet.</h3>
          <Link to="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      ) : (
        <div className="row">
          {/* Order List */}
          <div className="col-md-4 mb-4">
            <div className="card order-list-card">
              <div className="card-header">
                <h5 className="mb-0">Your Orders</h5>
              </div>
              <div className="list-group list-group-flush">
                {orders.map((order) => (
                  <button 
                    key={order._id} 
                    className={`list-group-item list-group-item-action ${selectedOrder && selectedOrder._id === order._id ? 'active' : ''}`}
                    onClick={() => fetchOrderById(order._id)}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">Order #{order._id.substring(order._id.length - 8)}</h6>
                      <span className={`badge ${getStatusBadgeColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="mb-1">${order.totalAmount.toFixed(2)} - {order.items.length} items</p>
                    <small>{formatDate(order.createdAt)}</small>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Order Details */}
          <div className="col-md-8">
            {loading && selectedOrder ? (
              <div className="order-detail-placeholder">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading order details...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : selectedOrder ? (
              <div className="card order-detail-card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">Order #{selectedOrder._id.substring(selectedOrder._id.length - 8)}</h5>
                    <small className="text-muted">Placed on {formatDate(selectedOrder.createdAt)}</small>
                  </div>
                  <span className={`badge ${getStatusBadgeColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                
                <div className="card-body">
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
                </div>
                
                {selectedOrder.status === 'pending' && (
                  <div className="card-footer">
                    <div className="alert alert-info mb-0" role="alert">
                      <i className="bi bi-info-circle me-2"></i>
                      Your order is being processed. We'll update you when it ships.
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center my-5">
                <h3>No Order Selected</h3>
                <p className="mt-3">Please select an order from the list to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;