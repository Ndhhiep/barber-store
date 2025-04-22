import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    totalCost 
  } = useCart();

  const handleQuantityChange = (productId, newQuantity) => {
    updateQuantity(productId, parseInt(newQuantity));
  };

  return (
    <div className="container py-5" style={{ backgroundColor: '#F5F2EE' }}>
      <h1 className="mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#333' }}>Your Cart</h1>
      
      {cartItems.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="bi bi-cart3" style={{ fontSize: '3.5rem', color: '#8B775C' }}></i>
          </div>
          <h3 className="mb-4">Your cart is empty</h3>
          <p className="text-muted mb-4">Looks like you haven't added any products to your cart yet.</p>
          <Link to="/products" className="btn btn-primary">
            Browse Products
          </Link>
        </div>
      ) : (
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
                              src={item.product.image || '/assets/placeholder.png'} 
                              alt={item.product.name}
                              style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                              className="rounded"
                            />
                          </td>
                          <td>
                            <Link to={`/products/${item.product._id}`} className="text-decoration-none">
                              <h6 className="mb-1" style={{ color: '#333' }}>{item.product.name}</h6>
                            </Link>
                            <small className="text-muted">{item.product.category}</small>
                          </td>
                          <td>${item.product.price?.toFixed(2)}</td>
                          <td>
                            <div className="quantity-controls d-flex align-items-center">
                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                style={{ borderRadius: '0', width: '30px', height: '30px', padding: '0' }}
                              >
                                -
                              </button>
                              <div 
                                className="px-3 py-1 mx-1 bg-white text-center" 
                                style={{ 
                                  minWidth: '40px', 
                                  border: '1px solid #ced4da',
                                  borderRadius: '0' 
                                }}
                              >
                                {item.quantity}
                              </div>
                              <button 
                                className="btn btn-sm btn-outline-secondary" 
                                onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                disabled={item.quantity >= (item.product.quantity || 99)}
                                style={{ borderRadius: '0', width: '30px', height: '30px', padding: '0' }}
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
                              className="btn text-danger" 
                              onClick={() => removeFromCart(item.product._id)}
                              title="Remove item"
                              style={{ background: 'none', border: 'none' }}
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
              <Link to="/products" className="text-decoration-none" style={{ color: '#3498db' }}>
                ← Continue Shopping
              </Link>
            </div>
          </div>
          
          {/* Right side - Order Summary with position: sticky */}
          <div className="col-lg-4">
            <div 
              id="order-summary" 
              style={{ 
                position: 'sticky',
                top: '100px', // Khoảng cách từ đỉnh trang
                width: '100%', 
                zIndex: 100,
              }}
            >
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
                      className="btn btn-block" 
                      onClick={() => alert('Checkout functionality will be implemented in the future.')}
                      style={{ 
                        backgroundColor: '#8B775C', 
                        color: '#fff', 
                        borderRadius: '0',
                        padding: '10px 0'
                      }}
                    >
                      PROCEED TO CHECKOUT
                    </button>
                    <button 
                      className="btn btn-block btn-outline-secondary" 
                      onClick={clearCart}
                      style={{ borderRadius: '0', padding: '10px 0' }}
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
    </div>
  );
};

export default CartPage;