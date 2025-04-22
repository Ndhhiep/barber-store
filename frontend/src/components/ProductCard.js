import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

// Basic placeholder ProductCard component
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

  return (
    <div className="card h-100 shadow-sm product-card" style={{ width: '24em', margin: '0.5rem' }}>
      <Link to={`/products/${product._id}`}> 
        <img 
          src={product.imageUrl || '/assets/placeholder.png'} // Use placeholder if no image
          className="card-img-top" 
          alt={product.name} 
          style={{ height: '250px', objectFit: 'cover' }}
        />
      </Link>
      <div className="card-body d-flex flex-column">
        <h5 
          className="card-title" 
          style={{ 
            height: '60px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            fontSize: '1.25rem'
          }}
        >
          <Link to={`/products/${product._id}`} className="text-dark text-decoration-none">
            {product.name}
          </Link>
        </h5>
        <p 
          className="card-text text-muted" 
          style={{ 
            height: '72px', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '3',
            WebkitBoxOrient: 'vertical',
            fontSize: '1rem'
          }}
        >
          {product.description}
        </p>
        <div className="mt-auto pt-4 border-top">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-bold fs-4 mb-0">${product.price?.toFixed(2)}</span>
            <button 
              onClick={handleAddToCart}
              className="btn btn-add-to-cart"
              style={{
                transition: 'all 0.3s ease',
                backgroundColor: isHovered ? '#8B775C' : '#2B2A2A',
                color: 'white',
                borderColor: isHovered ? '#8B775C' : '#2B2A2A',
                padding: '0.5rem 1.2rem',
                fontSize: '1.1rem'
              }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
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