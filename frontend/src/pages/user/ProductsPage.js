import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductSearch from '../../components/user/ProductSearch';
import ProductCard from '../../components/user/ProductCard';

function ProductsPage() {
  const [productsByCategory, setProductsByCategory] = useState({});
  const [filteredProductsByCategory, setFilteredProductsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategories, setActiveCategories] = useState([]);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      try {
        setLoading(true);
        // Remove cache-control headers to allow browser caching
        const { data } = await axios.get('/api/products/categories');
        setProductsByCategory(data);
        setFilteredProductsByCategory(data);
        const categoryNames = Object.keys(data);
        setActiveCategories(categoryNames);
        setLoading(false);
      } catch (err) {
        setError(err.response && err.response.data.message 
          ? err.response.data.message 
          : err.message);
        setLoading(false);
      }
    };

    fetchProductsByCategory();
  }, []);

  // Filter products when search term or category selection changes
  useEffect(() => {
    if (!productsByCategory || Object.keys(productsByCategory).length === 0) {
      return;
    }

    const lowercaseSearchTerm = searchTerm.toLowerCase();
    
    // Filter products by search term and selected categories
    const filtered = {};
    
    // If no categories are selected, show no products
    if (activeCategories.length === 0) {
      setFilteredProductsByCategory({});
      return;
    }
    
    // Only process categories that are in the active list
    activeCategories.forEach(category => {
      if (productsByCategory[category]) {
        // Filter products by name
        const filteredProducts = productsByCategory[category].filter(product => 
          product.name?.toLowerCase().includes(lowercaseSearchTerm)
        );
        
        if (filteredProducts.length > 0) {
          filtered[category] = filteredProducts;
        }
      }
    });
    
    setFilteredProductsByCategory(filtered);
  }, [searchTerm, activeCategories, productsByCategory]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategoryFilter = (categories) => {
    console.log("ProductsPage received categories:", categories);
    setActiveCategories([...categories]); // Important: create a new array
  };

  return (
    <div className="container-fluid py-5">
      <div className="row">
        <div className="col-12 text-center mb-5">
          <h1 className="display-4 mb-3">Premium Grooming Products</h1>
          <p className="lead">We offer a carefully curated selection of grooming essentials to help you maintain your look at home.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : (
        <div className="row" style={{padding: '0 30px'}}>
          {/* Left sidebar with search and filter - fixed position */}
          <div className="col-lg-3 col-md-4">
            <div className="position-sticky" style={{ top: '120px', paddingTop: '1rem' }}>
              <ProductSearch 
                categories={Object.keys(productsByCategory)}
                onSearch={handleSearch}
                onCategoryFilter={handleCategoryFilter}
              />
            </div>
          </div>
          
          {/* Product listings - main content */}
          <div className="col-lg-9 col-md-8">
            {activeCategories.length === 0 ? (
              <div className="alert alert-info text-center">
                <i className="bi bi-exclamation-circle me-2"></i>
                Please select at least one category to view products.
              </div>
            ) : Object.keys(filteredProductsByCategory).length === 0 ? (
              <div className="alert alert-info text-center">
                <i className="bi bi-search me-2"></i>
                No products match your search criteria.
              </div>
            ) : (
              Object.keys(filteredProductsByCategory).map((category) => (
                <div key={category} className="mb-5">
                  <h2 className="h3 mb-4 pb-2 border-bottom">{category}</h2>
                  <div className="row justify-content-start">
                    {filteredProductsByCategory[category].map((product) => (
                      <div className="col-xl-4 col-lg-6 col-md-12 mb-4 d-flex justify-content-center" key={product._id}>
                        <ProductCard product={{
                          ...product,
                          imageUrl: product.image // Mapping image field to imageUrl for compatibility
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductsPage;