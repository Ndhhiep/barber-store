import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../css/TeamPage.css';
import barberService from '../services/barberService';

const TeamPage = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBarbers = async () => {
      try {
        setLoading(true);
        const data = await barberService.getAllBarbers();
        // Sort barbers to show most senior ones first (assuming they were added in order of seniority)
        setBarbers(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching barbers:', err);
        setError('Failed to load our team data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBarbers();
  }, []);

  // Fallback barbers data in case API call fails
  const fallbackBarbers = [
    {
      _id: '1',
      name: "James Wilson",
      title: "Master Barber & Founder",
      description: "With over 15 years of experience, James trained in London and New York before opening The Gentleman's Cut. He specializes in classic cuts and traditional shaving techniques.",
      expertise: ["Classic Haircuts", "Straight Razor Shaves", "Beard Styling"],
      image_url: "/assets/barber-1.jpg"
    },
    {
      _id: '2',
      name: "Robert Davis",
      title: "Senior Barber",
      description: "Robert brings 10 years of barbering expertise with a particular talent for contemporary styles and precision fades. His attention to detail ensures each client leaves looking their best.",
      expertise: ["Contemporary Styles", "Skin Fades", "Hair Design"],
      image_url: "/assets/barber-2.jpg"
    }
  ];

  // Use fallback data if API call fails or returns empty
  const displayBarbers = barbers.length > 0 ? barbers : (error ? fallbackBarbers : []);

  return (    <div>      {/* Page Title Section */}      <section className="page-title-section">
        <div className="container py-4">
          <h1 className="display-4 mb-3 page-title">Meet Our Team</h1>
          <hr />
          <p className="page-subtitle">Our skilled barbers are dedicated to delivering exceptional grooming experiences</p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-5 team-section">
        <div className="container">
          

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading our skilled team...</p>
            </div>
          ) : displayBarbers.length === 0 ? (
            <div className="alert alert-info text-center">
              No team members are currently available. Please check back later.
            </div>
          ) : (
            displayBarbers.map((barber, index) => (
              <div key={barber._id} className="row align-items-center mb-5 pb-5 border-bottom">
                <div className="col-lg-5 mb-4 mb-lg-0">
                  <div className="position-relative">
                    <img 
                      src={barber.imgURL || `/assets/barber-${index + 1}.jpg`} 
                      alt={barber.name} 
                      className="img-fluid shadow team-member-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/600x800?text=Barber+Image";
                      }}
                    />
                    <div 
                      className={index % 2 === 0 ? 'image-border-odd' : 'image-border-even'}
                    ></div>
                  </div>
                </div>
                <div className="col-lg-7 px-lg-5">
                  <h2 className="h1 mb-2 team-member-name">
                    {barber.name}
                  </h2>
                  <p className="text-accent mb-4 team-member-title">
                    {barber.title || barber.specialization || 'Barber'}
                  </p>
                  <p className="lead mb-4">
                    {barber.description}
                  </p>
                  <h3 className="h5 mb-3 specialties-heading">
                    Specialties
                  </h3>
                  <ul className="list-unstyled mb-4">
                    {(barber.expertise || []).map((skill, index) => (
                      <li key={index} className="mb-2 d-flex align-items-center">
                        <i className="bi bi-check-circle me-2 specialty-icon"></i>
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                  <Link 
                    to={`/booking?barber=${encodeURIComponent(barber._id)}`} 
                    className="btn book-with-barber"
                  >
                    Book with {barber.name.split(' ')[0]}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Join Our Team */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0 order-lg-2">
              <div className="position-relative">
                <img 
                  src="/assets/team01.jfif" 
                  alt="Barbershop Team" 
                  className="img-fluid shadow"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x400?text=Join+Our+Team";
                  }}
                />
                <div className="join-team-image-border"></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4 join-team-heading">
                Join Our Team
              </h2>
              <p className="lead mb-4">
                We're always looking for passionate, skilled barbers to join The Gentleman's Cut family.
              </p>
              <p className="mb-4">
                If you're dedicated to the craft of barbering, have a great attitude, and want to work in a professional yet friendly environment, we'd love to hear from you.
              </p>
              <h3 className="h5 mb-3 specialties-heading">
                What We Offer
              </h3>
              <ul className="list-unstyled mb-4">
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle me-2 specialty-icon"></i>
                  <span>Competitive commission structure</span>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle me-2 specialty-icon"></i>
                  <span>Professional development opportunities</span>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle me-2 specialty-icon"></i>
                  <span>A supportive, team-oriented environment</span>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bi bi-check-circle me-2 specialty-icon"></i>
                  <span>Growing client base</span>
                </li>
              </ul>
              <Link to="/contact" className="btn contact-btn">
                Contact Us About Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TeamPage;