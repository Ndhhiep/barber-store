import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../css/ProductsPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (err) {
        console.error(`Product fetch failed: ${err.message}`);
        setError('Failed to load product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading product details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-5">
        <div className="alert alert-warning" role="alert">
          Product not found. It may have been removed or is temporarily unavailable.
        </div>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/products">Products</Link></li>
          <li className="breadcrumb-item active" aria-current="page">{product?.name}</li>
        </ol>
      </nav>

      <div className="card border-0 shadow-sm">
        <div className="row g-0">
          <div className="col-md-6" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src={product?.imgURL || '/assets/placeholder.png'} 
              alt={product?.name}
              className="img-fluid rounded-start product-detail-image" 
              style={{ maxHeight: '500px', objectFit: 'contain', width: '70%' }}
            />
          </div>
          <div className="col-md-6">
            <div className="card-body p-4">
              <h1 className="card-title mb-3" style={{ fontFamily: 'roboto' }}>{product?.name}</h1>
              <div className="mb-3">
                <span className="badge bg-secondary">{product?.category}</span>
              </div>
              <h3 className="text-primary mb-4" style={{fontFamily: 'roboto'}}>${product?.price?.toFixed(2)}</h3>
              
              <div className="mb-4">
                <h5 className="text-muted mb-2">Description</h5>
                <p className="card-text">{product?.description}</p>
              </div>
              
              <div className="mb-4">
                {product?.quantity > 0 ? (
                  <div className="d-flex align-items-center mb-2">
                    <span className="badge bg-success me-2">In Stock</span>
                    <small className="text-muted">{product?.quantity} units available</small>
                  </div>
                ) : (
                  <span className="badge bg-danger">Out of Stock</span>
                )}
              </div>
              
              <div className="d-flex gap-3">
                <button 
                  className="btn btn-primary"
                  disabled={!product?.quantity || product?.quantity <= 0}
                  onClick={handleAddToCart}
                >
                  <i className="bi bi-cart-plus me-2"></i>Add to Cart
                </button>
                
                <Link to="/products" className="btn btn-outline-secondary">
                  Back to Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;