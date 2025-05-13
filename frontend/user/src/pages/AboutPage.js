import React from 'react';
import { Link } from 'react-router-dom';
import '../css/AboutPage.css';

const AboutPage = () => {  return (
    <div>      {/* Page Title Section */}
      <section className="page-title-section">
        <div className="container py-4">
          <h1 className="display-4 mb-3 page-title">About The Gentleman's Cut</h1>
          <hr />
          <p className="page-subtitle">Where traditional barbering craftsmanship meets modern style and exceptional service</p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="image-container">
                <img 
                  src="/assets/about01.jpg" 
                  alt="Barbershop Interior" 
                  className="img-fluid shadow"
                />
                <div className="image-decoration-right"></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4 about-title">
                Our Story
              </h2>
              <p className="lead mb-4">
                Founded in 2015, The Gentleman's Cut began with a simple mission: to revive the art of traditional barbering while providing modern men with exceptional grooming services in a welcoming, classic environment.
              </p>
              <p className="mb-4">
                Our founder, James Wilson, trained under master barbers in London and New York before bringing his expertise back to his hometown. What started as a small three-chair shop has grown into a respected establishment known for precision cuts, traditional hot towel shaves, and a commitment to the craft of men's grooming.
              </p>
              <p>
                We've built our reputation on attention to detail, personalized service, and creating an atmosphere where men can relax, socialize, and leave looking and feeling their best.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-5 values-section">
        <div className="container">
          <h2 className="text-center h1 mb-5 about-title">Our Values</h2>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card value-card">
                <div className="card-body p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-scissors value-icon"></i>
                  </div>
                  <h3 className="h4 mb-3 about-title">Craftsmanship</h3>
                  <p className="card-text">
                    We believe in the importance of mastering traditional barbering techniques and continuously refining our skills to provide exceptional service.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card value-card">
                <div className="card-body p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-people value-icon"></i>
                  </div>
                  <h3 className="h4 mb-3 about-title">Community</h3>
                  <p className="card-text">
                    Our barbershop is more than a place for a haircut—it's a gathering space that fosters conversation, connection, and a sense of belonging.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card value-card">
                <div className="card-body p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-star value-icon"></i>
                  </div>
                  <h3 className="h4 mb-3 about-title">Character</h3>
                  <p className="card-text">
                    We operate with integrity, respect, and a commitment to excellence, treating each client as an individual with unique preferences and needs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 order-lg-2 mb-4 mb-lg-0">
              <div className="image-container">
                <img 
                  src="/assets/about02.png" 
                  alt="Barber at Work" 
                  className="img-fluid shadow"
                />
                <div className="image-decoration-left"></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4 about-title">
                Our Approach
              </h2>
              <p className="lead mb-4">
                At The Gentleman's Cut, we believe that a great haircut begins with understanding each client's unique style, hair type, and lifestyle.
              </p>
              <ul className="list-unstyled">
                <li className="mb-3 d-flex">
                  <i className="bi bi-check2-circle me-2 check-icon"></i>
                  <span><strong>Personal Consultation</strong> - Every service begins with a thorough consultation to understand your preferences.</span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="bi bi-check2-circle me-2 check-icon"></i>
                  <span><strong>Premium Products</strong> - We use only the highest quality grooming products selected for their performance and ingredients.</span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="bi bi-check2-circle me-2 check-icon"></i>
                  <span><strong>Continued Education</strong> - Our barbers regularly attend workshops and training to stay current with techniques and trends.</span>
                </li>
                <li className="d-flex">
                  <i className="bi bi-check2-circle me-2 check-icon"></i>
                  <span><strong>Attention to Detail</strong> - We take pride in the small touches that make a big difference in your final look.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-5 cta-section">
        <div className="container py-4">
          <h2 className="h1 mb-4 cta-title">Experience The Difference</h2>
          <p className="lead mx-auto mb-5 cta-description">
            We invite you to visit The Gentleman's Cut and experience our commitment to exceptional grooming services in a classic barbershop atmosphere.
          </p>
          <Link to="/booking" className="btn btn-lg cta-button">
            Book Your Appointment
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;