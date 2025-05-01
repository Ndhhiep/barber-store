import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard'; // Assuming ProductCard is in the same directory

const CategoryProductShowcase = () => {
  const [showcaseData, setShowcaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowcaseData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/products/showcase-by-category');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setShowcaseData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || 'Failed to fetch showcase products.');
        setShowcaseData([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchShowcaseData();
  }, []); // Empty dependency array ensures this runs only once on mount

  if (loading) {
    return <div className="text-center p-5">Loading products...</div>;
  }

  if (error) {
    return <div className="alert alert-danger" role="alert">Error loading products: {error}</div>;
  }

  if (showcaseData.length === 0) {
    return <div className="text-center p-5">No products to display.</div>;
  }

  return (
    <section className="py-5 category-showcase">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4" style={{ fontFamily: 'Playfair Display, serif' }}>Our Products</h1>
          <p className="lead">Discover our premium collection of professional hair and beard care products</p>
          <hr className="my-4 w-50 mx-auto" />
        </div>
        
        {showcaseData.map((categoryData) => (
          <div key={categoryData.category} className="mb-5">
            <h2 className="text-center mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {categoryData.category} {/* Assuming category is the name string */}
            </h2>
            <div className="row justify-content-center">
              {categoryData.products.map((product) => (
                // Use Bootstrap columns for responsiveness
                <div key={product._id} className="col-lg-4 col-md-6 mb-4 d-flex justify-content-center">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            {/* Optional: Add a divider or more spacing between categories */}
            {/* <hr className="my-5" /> */}
          </div>
        ))}
      </div>
    </section>
  );
};

export default CategoryProductShowcase;