import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../css/ProductCard.css'; 

// Enhanced ProductCard component with hover effects
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  
  
  if (!product) {
    return null; // Or some placeholder if product is undefined
  }

  const handleAddToCart = (e) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    addToCart(product);
  };
  return (    <div 
      className="card h-100 shadow-sm product-card" 
      style={{ 
        width: '24em', 
        margin: '0.5rem',
        borderRadius: '15px',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)',
        backgroundColor: '#fff'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product._id}`}> 
        <img 
          src={product.imgURL || '/assets/placeholder.png'} // Use the correct field name imgURL
          className="card-img-top" 
          alt={product.name} 
          style={{ 
            height: '250px', 
            objectFit: 'contain',
            borderTopLeftRadius: '15px',
            borderTopRightRadius: '15px',
            transition: 'transform 0.3s ease',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
      </Link>      <div className="card-body d-flex flex-column" style={{ padding: '1.25rem' }}>        <h5 
          className="card-title" 
          style={{ 
            height: '60px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            fontSize: '1.25rem',
            fontFamily: 'sans-serif',
            background: 'transparent',
            padding: '0',
            margin: '0 0 12px 0'
          }}
        >
          <Link to={`/products/${product._id}`} className="text-dark text-decoration-none">
            {product.name}
          </Link>
        </h5>        <p 
          className="card-text text-muted" 
          style={{ 
            height: '72px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '3',
            WebkitBoxOrient: 'vertical',
            fontSize: '0.95rem',
            color: '#666',
            margin: '0 0 8px 0'
          }}
        >
          {product.description}
        </p>
        <div className="mt-auto pt-4 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold fs-4 mb-0">${product.price?.toFixed(2)}</span>            <button 
              onClick={handleAddToCart}
              className="btn btn-add-to-cart"
              style={{
                borderRadius: '8px',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;