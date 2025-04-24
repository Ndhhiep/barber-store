import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../css/CartPage.css';

const CartPage = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    totalCost 
  } = useCart();
  
  const navigate = useNavigate();
  
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [checkoutInfo, setCheckoutInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'credit',
    notes: ''
  });

  // Check server connectivity when component mounts
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // First try to connect to the root API endpoint
        const response = await fetch('http://localhost:5000/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          console.log('Successfully connected to API server');
          setServerStatus('connected');
        } else {
          console.error('Server responded with status:', response.status);
          setServerStatus('error');
        }
      } catch (error) {
        console.error('Server connection error:', error);
        setServerStatus('error');
      }
    };
    
    checkServerStatus();
  }, []);

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckoutInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckout = () => {
    // Only show modal if server is connected
    if (serverStatus === 'error') {
      alert('Cannot connect to the server. Please try again later.');
      return;
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setOrderError(null);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Prepare order data
      const orderData = {
        customerInfo: {
          name: checkoutInfo.name,
          email: checkoutInfo.email,
          phone: checkoutInfo.phone
        },
        items: cartItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          priceAtPurchase: item.product.price
        })),
        totalAmount: totalCost,
        shippingAddress: checkoutInfo.address,
        paymentMethod: checkoutInfo.paymentMethod,
        notes: checkoutInfo.notes
      };

      // Use a hardcoded URL for testing
      const apiUrl = 'http://localhost:5000/api/orders';
      
      console.log('Sending order to:', apiUrl);
      console.log('Order data:', JSON.stringify(orderData));

      // Send order data to backend API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(orderData),
          credentials: 'include',
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
  
        // Log the raw response for debugging
        console.log('Response status:', response.status);
  
        // Check content type before trying to parse JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          // If not JSON, try to get the text to display a better error
          const textResponse = await response.text();
          console.error('Non-JSON response:', textResponse);
          throw new Error(`Server responded with ${response.status}. Make sure the API endpoint exists and the server is running correctly.`);
        }
  
        const result = await response.json();
  
        if (!response.ok) {
          throw new Error(result.error || 'Failed to create order');
        }
  
        // Show success message
        alert('Order submitted successfully! Your order ID is: ' + result.orderId);
        
        // Clear cart and close modal
        clearCart();
        setShowModal(false);
        
        // Reset checkout info
        setCheckoutInfo({
          name: '',
          phone: '',
          email: '',
          address: '',
          paymentMethod: 'credit',
          notes: ''
        });
  
        // Redirect to a thank you page or back to products
        navigate('/products', { state: { orderSuccess: true, orderId: result.orderId } });
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The server might be down or overloaded.');
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      console.error('Error submitting order:', error);
      setOrderError(error.message || 'An error occurred while processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of the component remains unchanged
  return (
    <div className="container py-5 cart-container">
      <h1 className="mb-4 cart-title">Your Cart</h1>
      
      {serverStatus === 'error' && (
        <div className="alert alert-warning mb-4" role="alert">
          <strong>Warning:</strong> Unable to connect to the server. Some features may not work.
        </div>
      )}
      
      {cartItems.length === 0 ? (
        // ... existing empty cart code ...
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="bi bi-cart3 empty-cart-icon"></i>
          </div>
          <h3 className="mb-4">Your cart is empty</h3>
          <p className="text-muted mb-4">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        // ... existing cart items code ...
        <div className="row" id="cart-container">
          {/* Left side - Cart Items */}
          <div className="col-lg-8 mb-4">
            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-borderless align-middle mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th scope="col" className="ps-4 py-3"></th>
                        <th scope="col" className="py-3">Product</th>
                        <th scope="col" className="py-3">Price</th>
                        <th scope="col" className="py-3">Quantity</th>
                        <th scope="col" className="py-3">Total</th>
                        <th scope="col" className="py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.product._id}>
                          <td className="ps-4">
                            <img 
                              src={item.product.imgURL || '/assets/placeholder.png'} 
                              alt={item.product.name}
                              className="rounded product-image"
                            />
                          </td>
                          <td>
                            <Link to={`/products/${item.product._id}`} className="text-decoration-none">
                              <h6 className="mb-1 product-name">{item.product.name}</h6>
                            </Link>
                            <small className="text-muted">{item.product.category}</small>
                          </td>
                          <td>${item.product.price?.toFixed(2)}</td>
                          <td>
                            <div className="quantity-controls">
                              <button 
                                className="btn btn-sm btn-outline-secondary quantity-btn" 
                                onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <div className="quantity-display">
                                {item.quantity}
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-secondary quantity-btn" 
                                onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                disabled={item.quantity >= (item.product.quantity || 99)}
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="fw-bold">
                            ${(item.product.price * item.quantity).toFixed(2)}
                          </td>
                          <td>
                            <button 
                              className="btn text-danger remove-item-btn" 
                              onClick={() => removeFromCart(item.product._id)}
                              title="Remove item"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Link to="/products" className="text-decoration-none continue-shopping">
                ← Continue Shopping
              </Link>
            </div>
          </div>
          
          {/* Right side - Order Summary with position: sticky */}
          <div className="col-lg-4">
            <div id="order-summary">
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="card-title mb-3">Order Summary</h5>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Shipping:</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between mb-4">
                    <span className="fw-bold">Total:</span>
                    <span className="fw-bold fs-5">${totalCost.toFixed(2)}</span>
                  </div>
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-block checkout-btn" 
                      onClick={handleCheckout}
                      disabled={serverStatus === 'checking' || serverStatus === 'error'}
                    >
                      {serverStatus === 'checking' ? 'Connecting...' : 'PROCEED TO CHECKOUT'}
                    </button>
                    <button 
                      className="btn btn-block btn-outline-secondary clear-cart-btn" 
                      onClick={clearCart}
                    >
                      CLEAR CART
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Checkout Modal */}
      <div className={`checkout-modal ${showModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5>Complete Your Order</h5>
            <button className="close-btn" onClick={handleCloseModal}>&times;</button>
          </div>
          {orderError && (
            <div className="alert alert-danger" role="alert">
              {orderError}
            </div>
          )}
          <form onSubmit={handleSubmitOrder}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={checkoutInfo.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                className="form-control"
                id="phone"
                name="phone"
                value={checkoutInfo.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={checkoutInfo.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <textarea
                className="form-control"
                id="address"
                name="address"
                rows="3"
                value={checkoutInfo.address}
                onChange={handleInputChange}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label htmlFor="notes">Order Notes (Optional)</label>
              <textarea
                className="form-control"
                id="notes"
                name="notes"
                rows="2"
                value={checkoutInfo.notes}
                onChange={handleInputChange}
              ></textarea>
            </div>
            <div className="form-group">
              <label>Payment Method</label>
              <div className="payment-option">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="credit"
                    value="credit"
                    checked={checkoutInfo.paymentMethod === 'credit'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="credit">
                    Credit Card
                  </label>
                </div>
              </div>
              <div className="payment-option">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="paypal"
                    value="paypal"
                    checked={checkoutInfo.paymentMethod === 'paypal'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="paypal">
                    PayPal
                  </label>
                </div>
              </div>
              <div className="payment-option">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="paymentMethod"
                    id="cod"
                    value="cod"
                    checked={checkoutInfo.paymentMethod === 'cod'}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="cod">
                    Cash on Delivery
                  </label>
                </div>
              </div>
            </div>
            <div className="d-grid mt-4">
              <button 
                type="submit" 
                className="btn checkout-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'CONFIRM ORDER'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CartPage;