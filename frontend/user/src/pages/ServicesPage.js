import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/ServicesPage.css';
import serviceService from '../services/serviceService';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch services from API when component mounts
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const response = await serviceService.getAllServices();
        // Only show active services
        const activeServices = response.data.filter(service => service.isActive !== false);
        setServices(activeServices);
        setError(null);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Unable to load services at this time. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);
  return (
    <div className="services-page">      {/* Page Title Section */}      <section className="page-title-section">
        <div className="container py-3 py-md-4">
          <h1 className="display-5 display-md-4 mb-3 page-title">Our Services</h1>
          <hr />
          <p className="page-subtitle">Discover premium grooming services designed for the modern gentleman</p>
        </div>
      </section>
      
      <div className="container py-4 py-md-5">
        
        {/* Services Section */}
        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading services...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center" role="alert">
            {error}
          </div>
        ) : services.length === 0 ? (
          <div className="alert alert-info text-center" role="alert">
            No services available at this time. Please check back later.
          </div>        ) : (
          <div className="row g-3 g-md-4">
            {services.map(service => (
              <div key={service._id} className="col-12 col-md-6 col-lg-6">
                <div className="card h-100 shadow-sm service-card">
                  <div className="card-body p-3 p-md-4">
                    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-start mb-3">
                      <h3 className="h5 h-md-4 service-name mb-2 mb-sm-0">{service.name}</h3>                      <div className="d-flex flex-column align-items-start align-sm-end">
                        <span className="service-price mb-1">${service.price}</span>
                        <span className="text-muted service-duration">
                          {service.duration || 30} min
                        </span>
                      </div>
                    </div>
                    <p className="card-text mb-3 service-description">{service.description}</p>
                    <div className="d-flex justify-content-end justify-sm-end">
                      <Link to="/booking" className="btn btn-sm book-btn">
                        BOOK NOW
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Additional Information Section */}
        <div className="row mt-4 mt-md-5 pt-3 pt-md-4">
          <div className="col-12 col-lg-6 mb-3 mb-md-4">
            <div className="card border-0 shadow-sm h-100 what-to-expect">              <div className="card-body p-3 p-md-4">
                <h3 className="h5 h-md-4 mb-3 mb-md-4 text-white">What to Expect</h3>
                <ul className="list-unstyled mb-0">                  <li className="mb-3 d-flex align-items-center">
                    <span className="material-symbols-outlined expect-icon">check_circle</span>
                    <span>Complimentary consultation before every service</span>
                  </li>                  <li className="mb-3 d-flex align-items-center">
                    <span className="material-symbols-outlined expect-icon">check_circle</span>
                    <span>Relaxed atmosphere with complimentary beverages</span>
                  </li>
                  <li className="mb-3 d-flex align-items-center">
                    <span className="material-symbols-outlined expect-icon">check_circle</span>
                    <span>Premium grooming products used for every service</span>
                  </li>
                  <li className="mb-3 d-flex align-items-center">
                    <span className="material-symbols-outlined expect-icon">check_circle</span>
                    <span>Hot towel refreshment with each haircut</span>
                  </li>
                  <li className="d-flex align-items-center">
                    <span className="material-symbols-outlined expect-icon">check_circle</span>
                    <span>Style advice and product recommendations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>            <div className="col-12 col-lg-6 mb-3 mb-md-4">
            <div className="card border-0 shadow-sm h-100 grooming-policies">
              <div className="card-body p-3 p-md-4">
                <h3 className="h5 h-md-4 mb-3 mb-md-4">Grooming Policies</h3>
                <ul className="list-unstyled mb-0">
                  <li className="mb-3 d-flex align-items-center">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>Please arrive 5-10 minutes before your appointment time</span>
                  </li>                  <li className="mb-3 d-flex align-items-center">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>24-hour cancellation notice required to avoid charge</span>
                  </li>
                  <li className="mb-3 d-flex align-items-center">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>We accept cash and all major credit/debit cards</span>
                  </li>
                  <li className="mb-3 d-flex align-items-center">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>Tips are appreciated but not included in service price</span>
                  </li>
                  <li className="d-flex align-items-center">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>Gift certificates available for all services</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
          {/* Call to Action */}
        <div className="text-center mt-4 mt-md-5 pt-2 pt-md-3">
          <p className="lead mb-3 mb-md-4 cta-text">Ready to experience the difference?</p>
          <Link to="/booking" className="btn btn-lg px-4 px-md-5 cta-btn">
            Book Your Appointment
          </Link></div>
      </div>
    </div>
  );
};

export default ServicesPage;