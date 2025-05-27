import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import PayPalCheckoutButton from '../components/PayPalCheckoutButton';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [checkoutInfo, setCheckoutInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: '',
    notes: ''
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
  
  // Function removed - payment buttons are now displayed directly
  const handleCheckout = () => {
    // Only show modal if server is connected
    if (serverStatus === 'error') {
      alert('Cannot connect to the server. Please try again later.');
      return;
    }
    
    // Try to prefill the form with user data
    const fetchUserData = async () => {
      try {
        // First try to get data from localStorage for basic fields
        const userDataStr = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          
          // Prefill with basic data from localStorage
          setCheckoutInfo(prev => ({
            ...prev,
            name: userData.name || prev.name,
            email: userData.email || prev.email,
            phone: userData.phone || prev.phone
          }));
          
          // Try to get more detailed user info from the API
          if (token) {
            // Fetch user profile data
            try {
              const profileResponse = await fetch('http://localhost:5000/api/auth/me', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (profileResponse.ok) {
                const { data } = await profileResponse.json();
                
                // Update with the most recent user data from API
                setCheckoutInfo(prev => ({
                  ...prev,
                  name: data.user.name || prev.name,
                  email: data.user.email || prev.email,
                  phone: data.user.phone || prev.phone
                }));
              }
            } catch (profileError) {
              console.warn('Error fetching user profile:', profileError);
            }
            
            // Try to fetch most recent order for address info
            try {
              const ordersResponse = await fetch('http://localhost:5000/api/orders/user/my-orders', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                
                if (orders && orders.data && orders.data.length > 0) {
                  // Get the most recent order
                  const latestOrder = orders.data[0];
                  
                  // Use address from most recent order if available
                  setCheckoutInfo(prev => ({
                    ...prev,
                    address: latestOrder.shippingAddress || prev.address
                  }));
                }
              }
            } catch (ordersError) {
              console.warn('Error fetching order history:', ordersError);
            }
          }
        }
      } catch (error) {
        console.warn('Error fetching user data:', error);
      }
    };
      // Execute the user data fetch
    fetchUserData();
    
    // Show modal immediately (the data will populate as it loads)
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setOrderError(null);
  };
  
  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    // Redirect to products page after closing success modal
    navigate('/products', { state: { orderSuccess: true, orderId: successOrderId } });
  };
  
  const handleSubmitOrder = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Validate required fields
    const { name, email, phone, address } = checkoutInfo;
    if (!name || !email || !phone || !address) {
      setOrderError('Please fill in all required fields (Name, Email, Phone, and Address).');
      return;
    }
    
    // Make sure we have an up-to-date checkout info object to work with
    let currentCheckoutInfo = {...checkoutInfo};
    
    // Set payment method to COD if submitting the form directly
    if (!paymentProcessing) {
      currentCheckoutInfo = {
        ...currentCheckoutInfo,
        paymentMethod: 'cod'
      };
      
      setCheckoutInfo(currentCheckoutInfo);
    } else {
      // Ensure payment method is set to paypal if processing PayPal payment
      currentCheckoutInfo = {
        ...currentCheckoutInfo,
        paymentMethod: 'paypal'
      };
      
      setCheckoutInfo(currentCheckoutInfo);
    }
    
    setIsSubmitting(true);
    setOrderError(null);

    try {
      // Lấy userId từ localStorage nếu người dùng đã đăng nhập
      const userData = localStorage.getItem('user');
      let userId = null;
      
      // Parse userData để lấy userId nếu có
      if (userData) {
        try {
          const parsedUserData = JSON.parse(userData);
          userId = parsedUserData._id;
        } catch (error) {
          console.warn('Error parsing user data:', error);
        }
      }      // Use the updated current checkout info
      // For debugging
      console.log("Processing order with payment method:", currentCheckoutInfo.paymentMethod);
      
      // Prepare order data with userId if available
      const orderData = {
        customerInfo: {
          name: currentCheckoutInfo.name,
          email: currentCheckoutInfo.email,
          phone: currentCheckoutInfo.phone
        },
        items: cartItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          priceAtPurchase: item.product.price
        })),
        totalAmount: totalCost,
        shippingAddress: currentCheckoutInfo.address,
        paymentMethod: currentCheckoutInfo.paymentMethod || (paymentProcessing ? 'paypal' : 'cod'), // Fallback
        notes: currentCheckoutInfo.notes
      };

      // Thêm userId vào dữ liệu đơn hàng nếu có
      if (userId) {
        orderData.userId = userId;
      }
      
      // If payment was processed by PayPal, add transaction details
      if (paymentProcessing) {
        orderData.paymentStatus = 'paid';
        orderData.transactionId = paymentProcessing.id;
        orderData.paymentDetails = paymentProcessing;
      }

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
        }        // Show success modal instead of alert
        setSuccessOrderId(result.orderId);
        setShowSuccessModal(true);
        
        // Clear cart and close checkout modal
        clearCart();
        setShowModal(false);
        
        // Reset checkout info
        setCheckoutInfo({
          name: '',
          phone: '',
          email: '',
          address: '',
          paymentMethod: '',
          notes: ''
        });
        
        // No immediate redirect - will redirect after user closes the success modal
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
    }  };

  return (
    <div className="container py-3 py-md-5 cart-container">
      {serverStatus === 'error' && (
        <div className="alert alert-warning mb-3 mb-md-4" role="alert">
          <strong>Warning:</strong> Unable to connect to the server. Some features may not work.
        </div>
      )}
      
      {cartItems.length === 0 ? (
        // ... existing empty cart code ...
        <div className="text-center py-4 py-md-5">
          <div className="mb-3 mb-md-4">
            <i className="bi bi-cart3 empty-cart-icon"></i>
          </div>
          <h3 className="mb-3 mb-md-4">Your cart is empty</h3>
          <p className="text-muted mb-3 mb-md-4">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
        // ... existing cart items code ...
        <div className="row g-3 g-md-4" id="cart-container">
          {/* Left side - Cart Items */}
          <div className="col-12 col-lg-8 mb-3 mb-md-4">
            <div className="card border-0 shadow-sm mb-3 mb-md-4">
              <div className="card-body p-0">
                {/* Mobile view - stack items vertically */}
                <div className="d-lg-none">
                  {cartItems.map((item) => (
                    <div key={item.product._id} className="border-bottom p-3">
                      <div className="row align-items-center">
                        <div className="col-3">
                          <img 
                            src={item.product.imgURL || '/assets/placeholder.png'} 
                            alt={item.product.name}
                            className="img-fluid rounded product-image"
                          />
                        </div>
                        <div className="col-9">
                          <h6 className="mb-1">{item.product.name}</h6>
                          <p className="text-muted small mb-2">{item.product.category}</p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-bold">${item.product.price}</span>
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                -
                              </button>
                              <span className="btn btn-outline-secondary disabled">{item.quantity}</span>
                              <button 
                                className="btn btn-outline-secondary"
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="fw-bold">Total: ${(item.product.price * item.quantity).toFixed(2)}</span>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeFromCart(item.product._id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Desktop view - table layout */}
                <div className="table-responsive d-none d-lg-block">
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
                        <tr key={item.product._id} className="cart-item-row">
                          <td className="ps-4">
                            <img 
                              src={item.product.imgURL || '/assets/placeholder.png'} 
                              alt={item.product.name}
                              className="rounded product-image"
                            />
                          </td>
                          <td>
                            <div className="product-info">
                              <Link to={`/products/${item.product._id}`} className="text-decoration-none">
                                <h6 className="mb-1 product-name">{item.product.name}</h6>
                              </Link>
                              <small className="text-muted">{item.product.category}</small>
                            </div>
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
          </div>            {/* Right side - Order Summary with position: sticky */}
          <div className="col-12 col-lg-4">
            <div id="order-summary">
              <div className="card border-0 shadow-sm mb-3 mb-md-4 order-summary-card">
                <div className="card-body d-flex flex-column p-3 p-md-4">
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
                  <div className="d-flex justify-content-between mb-3 mb-md-4">
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
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Complete Your Order</h5>
            <button className="close-btn btn" onClick={handleCloseModal}>&times;</button>
          </div>
          {orderError && (
            <div className="alert alert-danger mx-3" role="alert">
              {orderError}
            </div>
          )}
          <form onSubmit={handleSubmitOrder} className="p-3">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label htmlFor="name" className="form-label">Full Name:</label>
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
              <div className="col-12 col-md-6">
                <label htmlFor="phone" className="form-label">Phone Number:</label>
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
              <div className="col-12">
                <label htmlFor="email" className="form-label">Email:</label>
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
              <div className="col-12">
                <label htmlFor="address" className="form-label">Delivery Address:</label>
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
            </div>            
            {/* Payment section */}
            <div className="mt-4">
              <h6 className="mb-3">Payment Method</h6>
              
              {/* Form validation message */}
              {(!checkoutInfo.name || !checkoutInfo.email || !checkoutInfo.phone || !checkoutInfo.address) && (
                <div className="alert alert-warning mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Please fill in all required fields above before selecting a payment method.
                </div>
              )}
              
              {/* PayPal Button - only enabled when form is valid */}
              <div className="paypal-section mb-3">
                <div className="paypal-button-container" 
                    style={{ opacity: (!checkoutInfo.name || !checkoutInfo.email || !checkoutInfo.phone || !checkoutInfo.address) ? 0.5 : 1 }}>
                  <PayPalCheckoutButton
                    totalAmount={totalCost}
                    onSuccess={(details) => {
                      console.log('PayPal payment successful:', details);
                        // Check if the form is filled correctly
                      const { name, email, phone, address } = checkoutInfo;
                      if (!name || !email || !phone || !address) {
                        setOrderError('Please fill in all required fields (Name, Email, Phone, and Address) before completing payment.');
                        return;
                      }
                      
                      // Set payment processing details
                      setPaymentProcessing(details);
                      
                      // Create a complete checkout info object with payment method
                      const updatedCheckoutInfo = {
                        ...checkoutInfo,
                        paymentMethod: 'paypal'
                      };
                      
                      // Update the state
                      setCheckoutInfo(updatedCheckoutInfo);
                      
                      // Wait for state updates to complete before submitting
                      setTimeout(() => {
                        // After successful PayPal payment, submit the order with payment details
                        handleSubmitOrder({preventDefault: () => {}});
                      }, 300);
                    }}
                    onError={(error) => {
                      console.error('PayPal payment error:', error);
                      setOrderError('Error ! Please try again.');
                    }}
                    onCancel={() => {
                      console.log('PayPal payment cancelled');
                    }}
                  />
                </div>
              </div>
              
              {/* Divider with "or" text */}
              <div className="text-center my-3">
                <span className="text-muted">OR</span>
                <hr className="my-2" />
              </div>
              
              {/* Cash on Delivery Button */}
              <div className="d-grid">
                <button 
                  type="submit" 
                  className="btn btn-outline-primary"
                  disabled={isSubmitting || !checkoutInfo.name || !checkoutInfo.email || !checkoutInfo.phone || !checkoutInfo.address}
                  onClick={() => {
                    setCheckoutInfo(prev => ({
                      ...prev,
                      paymentMethod: 'cod'
                    }));
                  }}
                >
                  {isSubmitting ? 'Processing...' : 'CASH ON DELIVERY'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
      <div className={`checkout-modal ${showSuccessModal ? 'show' : ''}`}>
        <div className="modal-content success-modal">
          <div className="modal-header">
            <h5>Order Confirmation</h5>
            <button className="close-btn" onClick={handleCloseSuccessModal}>&times;</button>
          </div>
          <div className="modal-body text-center py-4">            <div className="success-icon mb-3">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '3rem' }}></i>
            </div>
            <h4 className="mb-3">Thank You For Your Order!</h4>
            <p className="mb-4">Your order has been submitted successfully.</p>
            <p className="mb-4"><strong>Order ID:</strong> {successOrderId && successOrderId.slice(-6)}</p>
            <div className="d-grid">
              <button className="btn checkout-btn" onClick={handleCloseSuccessModal}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;