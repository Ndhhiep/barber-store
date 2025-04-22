import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 bg-dark text-white text-center">
        <div className="container py-4">
          <h1 className="display-4 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>About The Gentleman's Cut</h1>
          <p className="lead mx-auto" style={{ maxWidth: '800px' }}>
            A traditional barbershop experience with modern expertise and classic style.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <div className="position-relative">
                <img 
                  src="/assets/about-main.jpg" 
                  alt="Barbershop Interior" 
                  className="img-fluid shadow"
                />
                <div 
                  style={{ 
                    position: 'absolute', 
                    bottom: '-20px',
                    right: '-20px',
                    border: '2px solid #8B775C',
                    width: '60%',
                    height: '70%',
                    zIndex: '-1'
                  }}
                ></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>
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
      <section className="py-5" style={{ backgroundColor: '#F5F2EE' }}>
        <div className="container">
          <h2 className="text-center h1 mb-5" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>Our Values</h2>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '0' }}>
                <div className="card-body p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-scissors" style={{ fontSize: '2.5rem', color: '#8B775C' }}></i>
                  </div>
                  <h3 className="h4 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>Craftsmanship</h3>
                  <p className="card-text">
                    We believe in the importance of mastering traditional barbering techniques and continuously refining our skills to provide exceptional service.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '0' }}>
                <div className="card-body p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-people" style={{ fontSize: '2.5rem', color: '#8B775C' }}></i>
                  </div>
                  <h3 className="h4 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>Community</h3>
                  <p className="card-text">
                    Our barbershop is more than a place for a haircut—it's a gathering space that fosters conversation, connection, and a sense of belonging.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-md-4">
              <div className="card h-100 border-0 shadow-sm" style={{ borderRadius: '0' }}>
                <div className="card-body p-4 text-center">
                  <div className="mb-3">
                    <i className="bi bi-star" style={{ fontSize: '2.5rem', color: '#8B775C' }}></i>
                  </div>
                  <h3 className="h4 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>Character</h3>
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
              <div className="position-relative">
                <img 
                  src="/assets/about-approach.jpg" 
                  alt="Barber at Work" 
                  className="img-fluid shadow"
                />
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '-20px',
                    left: '-20px',
                    border: '2px solid #8B775C',
                    width: '60%',
                    height: '70%',
                    zIndex: '-1'
                  }}
                ></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>
                Our Approach
              </h2>
              <p className="lead mb-4">
                At The Gentleman's Cut, we believe that a great haircut begins with understanding each client's unique style, hair type, and lifestyle.
              </p>
              <ul className="list-unstyled">
                <li className="mb-3 d-flex">
                  <i className="bi bi-check2-circle me-2" style={{ color: '#8B775C', fontSize: '1.2rem' }}></i>
                  <span><strong>Personal Consultation</strong> - Every service begins with a thorough consultation to understand your preferences.</span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="bi bi-check2-circle me-2" style={{ color: '#8B775C', fontSize: '1.2rem' }}></i>
                  <span><strong>Premium Products</strong> - We use only the highest quality grooming products selected for their performance and ingredients.</span>
                </li>
                <li className="mb-3 d-flex">
                  <i className="bi bi-check2-circle me-2" style={{ color: '#8B775C', fontSize: '1.2rem' }}></i>
                  <span><strong>Continued Education</strong> - Our barbers regularly attend workshops and training to stay current with techniques and trends.</span>
                </li>
                <li className="d-flex">
                  <i className="bi bi-check2-circle me-2" style={{ color: '#8B775C', fontSize: '1.2rem' }}></i>
                  <span><strong>Attention to Detail</strong> - We take pride in the small touches that make a big difference in your final look.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-dark text-white text-center">
        <div className="container py-4">
          <h2 className="h1 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>Experience The Difference</h2>
          <p className="lead mx-auto mb-5" style={{ maxWidth: '700px' }}>
            We invite you to visit The Gentleman's Cut and experience our commitment to exceptional grooming services in a classic barbershop atmosphere.
          </p>
          <Link to="/booking" 
            className="btn btn-lg px-5" 
            style={{ 
              backgroundColor: '#8B775C',
              color: '#fff',
              fontFamily: 'Playfair Display, serif',
              borderRadius: '0'
            }}>
            Book Your Appointment
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;