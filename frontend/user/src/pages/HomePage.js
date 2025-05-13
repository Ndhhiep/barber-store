import React from 'react';
import { Link } from 'react-router-dom';
import CategoryProductShowcase from '../components/CategoryProductShowcase';
import '../css/HomePage.css';

const HomePage = () => {
  return (
    <div>      {/* Hero Section */}      <section 
        className="py-5 text-center text-white home-hero-section" 
        style={{
          backgroundImage: 'url(/assets/home01.jpg)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backgroundBlendMode: 'multiply'
        }}
      >
        <div className="hero-overlay" style={{backgroundColor: 'rgba(0,0,0,0.4)'}}></div>
        <div className="container px-4 hero-content">
          <div className="row justify-content-center">
            <div className="col-lg-10">              
              <h1 className="display-2 fw-bold mb-4 hero-title" >
                Timeless Style, Modern Craftsmanship
              </h1>
              <p className="lead mb-5 hero-description">
                Experience the art of traditional barbering in a classic environment where expertise meets exceptional service.
              </p>
              <Link to="/booking" className="btn btn-lg px-5 py-3 mb-2 btn-book">
                Book Your Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Snippet */}
      <section className="py-5 bg-light home-about-snippet">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="about-image-container">
                <img 
                  src="/assets/home02.avif" 
                  alt="Traditional Barbershop" 
                  className="img-fluid shadow about-image"
                />
                <div className="image-border-decoration"></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4">
                The Gentleman's Cut Experience
              </h2>
              <p className="lead mb-4">
                Since 2015, we've been dedicated to the art of men's grooming, providing exceptional haircuts and beard services in a sophisticated environment.
              </p>
              <p className="mb-4">
                Our skilled barbers combine traditional techniques with modern styles, ensuring you leave looking and feeling your best.
              </p>
              <Link to="/about" className="btn btn-outline-dark btn-learn-more">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-5 home-services-overview">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 mb-3">Our Services</h2>
            <p className="lead text-muted">Premium grooming services for the discerning gentleman</p>
          </div>
          
          <div className="row">
            {/* Service 1 */}
            <div className="col-md-4 mb-4">
              <div className="card h-100 service-card">
                <div className="card-body p-4 text-center d-flex flex-column">
                  <div className="service-icon-wrapper">
                    {/* Replaced img with div using mask */}
                    <div 
                      className="service-icon" 
                      style={{
                        maskImage: 'url(/assets/services_icon/haircut.png)',
                        WebkitMaskImage: 'url(/assets/services_icon/haircut.png)'
                      }}
                    ></div>
                  </div>
                  <h3 className="h4 mb-3">
                    Classic Haircut
                  </h3>
                  <p className="card-text mb-3">Precision cut tailored to your preferences, includes consultation, shampoo, and styling.</p>
                  <div className="mt-auto">
                    <hr className="my-3" />
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold service-price">$32</span>
                      <span className="text-muted">45 min</span>
                    </div>
                    <Link to="/services" className="btn btn-sm btn-outline-dark service-book-btn">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Service 2 */}
            <div className="col-md-4 mb-4">
              <div className="card h-100 service-card">
                <div className="card-body p-4 text-center d-flex flex-column">
                  <div className="service-icon-wrapper">
                    {/* Replaced img with div using mask */}
                    <div 
                      className="service-icon" 
                      style={{
                        maskImage: 'url(/assets/services_icon/beard-trim.png)',
                        WebkitMaskImage: 'url(/assets/services_icon/beard-trim.png)'
                      }}
                    ></div>
                  </div>
                  <h3 className="h4 mb-3">
                    Beard Trim & Style
                  </h3>
                  <p className="card-text mb-3">Expert beard shaping and styling with hot towel and premium beard oils for a perfect finish.</p>
                  <div className="mt-auto">
                    <hr className="my-3" />
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold service-price">$25</span>
                      <span className="text-muted">30 min</span>
                    </div>
                    <Link to="/services" className="btn btn-sm btn-outline-dark service-book-btn">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Service 3 */}
            <div className="col-md-4 mb-4">
              <div className="card h-100 service-card">
                <div className="card-body p-4 text-center d-flex flex-column">
                  <div className="service-icon-wrapper">
                    {/* Replaced img with div using mask */}
                    <div 
                      className="service-icon" 
                      style={{
                        maskImage: 'url(/assets/services_icon/shave.png)',
                        WebkitMaskImage: 'url(/assets/services_icon/shave.png)'
                      }}
                    ></div>
                  </div>
                  <h3 className="h4 mb-3">
                    Traditional Shave
                  </h3>
                  <p className="card-text mb-3">Luxurious straight razor shave with hot towel treatment and soothing aftershave care.</p>
                  <div className="mt-auto">
                    <hr className="my-3" />
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="fw-bold service-price">$40</span>
                      <span className="text-muted">45 min</span>
                    </div>
                    <Link to="/services" className="btn btn-sm btn-add-to-cart service-book-btn">
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-4">
            <Link to="/services" className="btn btn-outline-dark px-4 btn-view-all">
              View All Services
            </Link>
          </div>
        </div>
      </section>  
      <CategoryProductShowcase />
      
    </div>
  );
};

export default HomePage;