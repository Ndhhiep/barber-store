import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard'; // Assuming ProductCard is in the same directory
import { getProductsByCategoryShowcase } from '../services/productService'; // Import the service

const CategoryProductShowcase = () => {
  const [showcaseData, setShowcaseData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchShowcaseData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the product service to fetch showcase data
        const data = await getProductsByCategoryShowcase();
        console.log('Showcase data received:', data?.length || 0, 'categories');
        setShowcaseData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        
        // If in development, use fallback sample data for easier testing
        if (process.env.NODE_ENV === 'development') {
          console.log('Using fallback sample data for development');
          const sampleData = [
            {
              category: "Hair Care",
              products: [
                {
                  _id: "sample1",
                  name: "Shampoo Sample",
                  price: 12.99,
                  description: "Sample shampoo description",
                  imgURL: "/assets/product-default.jpg"
                },
                {
                  _id: "sample2",
                  name: "Conditioner Sample",
                  price: 14.99,
                  description: "Sample conditioner description",
                  imgURL: "/assets/product-default.jpg"
                }
              ]
            },
            {
              category: "Beard Care",
              products: [
                {
                  _id: "sample3",
                  name: "Beard Oil Sample",
                  price: 16.99,
                  description: "Sample beard oil description",
                  imgURL: "/assets/product-default.jpg"
                }
              ]
            }
          ];
          setShowcaseData(sampleData);
        } else {
          setError(err.message || 'Failed to fetch showcase products.');
          setShowcaseData([]); // Clear data on error
        }
      } finally {
        setLoading(false);
      }
    };
    
    // Log the API URL being used
    console.log('Backend API URL:', process.env.REACT_APP_BACKEND_API_URL);
    
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
        <div className="text-center mb-4 mb-md-5">
          <h1 className="display-4 display-md-3" style={{ fontFamily: 'Playfair Display, serif' }}>Our Products</h1>
          <p className="lead">Discover our premium collection of professional hair and beard care products</p>
        </div>
        
        {showcaseData.map((categoryData) => (
          <div key={categoryData.category} className="mb-5">
            <h2 className="text-start mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              {categoryData.category} {/* Assuming category is the name string */}
            </h2>
            <hr className="mb-4" />
            <div className="row g-3 g-md-4 justify-content-center">
              {categoryData.products.map((product) => (
                // Use Bootstrap columns for responsiveness
                <div key={product._id} className="col-12 col-sm-6 col-lg-4 d-flex justify-content-center">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <Link to={'/products'} className="btn btn-outline-dark px-4">
                More Products
              </Link>
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
