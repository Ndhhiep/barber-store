import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProductSearch from '../components/ProductSearch';
import ProductCard from '../components/ProductCard';
import '../css/ProductsPage.css';

const ProductsPage = () => {
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
        
        // Use the API service or configured base URL
        const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const { data } = await axios.get(`${baseUrl}/products/categories`);
        
        console.log("Products API Response:", data);
        
        if (!data || Object.keys(data).length === 0) {
          console.log("No products received from API");
          setError("No products found. The products database may be empty.");
          setLoading(false);
          return;
        }

        setProductsByCategory(data);
        setFilteredProductsByCategory(data);
        const categoryNames = Object.keys(data);
        setActiveCategories(categoryNames);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
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
      if (productsByCategory[category] && Array.isArray(productsByCategory[category])) {
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
    <div className="products-page">      {/* Page Title Section */}      <section className="page-title-section">
        <div className="container py-3 py-md-4">
          <h1 className="display-5 display-md-4 mb-3 page-title">Premium Grooming Products</h1>
          <hr />
          <p className="page-subtitle">Quality grooming essentials for the modern gentleman's daily routine</p>
        </div>
      </section>
      
      <div className="container-fluid py-4 py-md-5">
      
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
      ) : (        <div className="row px-2 px-md-4">
          {/* Left sidebar with search and filter - responsive */}
          <div className="col-12 col-lg-3 col-xl-2 mb-4 mb-lg-0">
            <div className="position-sticky" style={{ top: '120px', paddingTop: '2rem' }}>
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
            ) : (              Object.keys(filteredProductsByCategory).map((category) => (
                <div key={category} className="mb-4 mb-md-5">
                  <h2 className="h4 h-md-3 mb-3 mb-md-4 pb-2 border-bottom">{category}</h2>                  <div className="row g-3 g-md-4 justify-content-start">
                    {Array.isArray(filteredProductsByCategory[category]) ? 
                      filteredProductsByCategory[category].map((product) => (
                        <div className="col-12 col-sm-6 col-lg-4 col-xl-3 d-flex justify-content-center" key={product._id}>
                          <ProductCard product={{
                            ...product,
                            imageUrl: product.image // Mapping image field to imageUrl for compatibility
                          }} />
                        </div>
                      ))
                      : 
                      <div className="col-12 text-center">
                        <p>No products available in this category.</p>                      </div>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      </div>
    </div>  );
};

export default ProductsPage;