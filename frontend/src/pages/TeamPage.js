import React from 'react';
import { Link } from 'react-router-dom';

const TeamPage = () => {
  const barbers = [
    {
      id: 1,
      name: "James Wilson",
      title: "Master Barber & Founder",
      description: "With over 15 years of experience, James trained in London and New York before opening The Gentleman's Cut. He specializes in classic cuts and traditional shaving techniques.",
      expertise: ["Classic Haircuts", "Straight Razor Shaves", "Beard Styling"],
      image: "/assets/barber-1.jpg"
    },
    {
      id: 2,
      name: "Robert Davis",
      title: "Senior Barber",
      description: "Robert brings 10 years of barbering expertise with a particular talent for contemporary styles and precision fades. His attention to detail ensures each client leaves looking their best.",
      expertise: ["Contemporary Styles", "Skin Fades", "Hair Design"],
      image: "/assets/barber-2.jpg"
    },
    {
      id: 3,
      name: "Michael Thompson",
      title: "Beard Specialist",
      description: "Michael is our beard care expert with specialized training in beard sculpting and maintenance. His knowledge of facial hair styling has made him a favorite among our bearded clients.",
      expertise: ["Beard Sculpting", "Hot Towel Treatments", "Mustache Styling"],
      image: "/assets/barber-3.jpg"
    },
    {
      id: 4,
      name: "Daniel Martinez",
      title: "Style Consultant",
      description: "With a background in men's fashion and 6 years of barbering experience, Daniel offers not just great cuts but also styling advice to complement your overall look.",
      expertise: ["Textured Cuts", "Styling Consultations", "Product Knowledge"],
      image: "/assets/barber-4.jpg"
    }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 bg-dark text-white text-center">
        <div className="container py-4">
          <h1 className="display-4 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>Meet Our Team</h1>
          <p className="lead mx-auto" style={{ maxWidth: '800px' }}>
            Skilled professionals with a passion for the art and craft of barbering.
          </p>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-5" style={{ backgroundColor: '#F5F2EE' }}>
        <div className="container">
          <div className="mb-5 text-center">
            <p className="lead text-muted">
              Our team of experienced barbers combines traditional techniques with contemporary styles to deliver exceptional grooming services tailored to each client.
            </p>
          </div>

          {barbers.map((barber) => (
            <div key={barber.id} className="row align-items-center mb-5 pb-5 border-bottom">
              <div className="col-lg-5 mb-4 mb-lg-0">
                <div className="position-relative">
                  <img 
                    src={barber.image} 
                    alt={barber.name} 
                    className="img-fluid shadow"
                    style={{ maxHeight: '500px', width: '100%', objectFit: 'cover' }}
                  />
                  <div 
                    style={{ 
                      position: 'absolute', 
                      bottom: barber.id % 2 === 0 ? '20px' : '-20px',
                      right: barber.id % 2 === 0 ? '-20px' : '20px',
                      border: '2px solid #8B775C',
                      width: '60%',
                      height: '70%',
                      zIndex: '-1'
                    }}
                  ></div>
                </div>
              </div>
              <div className="col-lg-7 px-lg-5">
                <h2 className="h1 mb-2" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>
                  {barber.name}
                </h2>
                <p className="text-accent mb-4" style={{ color: '#8B775C', fontWeight: 500 }}>
                  {barber.title}
                </p>
                <p className="lead mb-4">
                  {barber.description}
                </p>
                <h3 className="h5 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>
                  Specialties
                </h3>
                <ul className="list-unstyled mb-4">
                  {barber.expertise.map((skill, index) => (
                    <li key={index} className="mb-2 d-flex align-items-center">
                      <i className="bi bi-check-circle me-2" style={{ color: '#8B775C' }}></i>
                      <span>{skill}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/booking" 
                  className="btn" 
                  style={{ 
                    backgroundColor: '#2B2A2A',
                    color: '#D9D0C7',
                    fontFamily: 'Lato, sans-serif',
                    borderRadius: '0',
                    padding: '0.6rem 1.5rem'
                  }}>
                  Book with {barber.name.split(' ')[0]}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Join Our Team */}
      <section className="py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-4 mb-lg-0 order-lg-2">
              <div className="position-relative">
                <img 
                  src="/assets/join-team.jpg" 
                  alt="Barbershop Team" 
                  className="img-fluid shadow"
                />
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '-20px',
                    left: '-20px',
                    border: '2px solid #8B775C',
                    width: '50%',
                    height: '60%',
                    zIndex: '-1'
                  }}
                ></div>
              </div>
            </div>
            <div className="col-lg-6 px-lg-5">
              <h2 className="h1 mb-4" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>
                Join Our Team
              </h2>
              <p className="lead mb-4">
                We're always looking for passionate, skilled barbers to join The Gentleman's Cut family.
              </p>
              <p className="mb-4">
                If you're dedicated to the craft of barbering, have a great attitude, and want to work in a professional yet friendly environment, we'd love to hear from you.
              </p>
              <h3 className="h5 mb-3" style={{ fontFamily: 'Playfair Display, serif', color: '#2B2A2A' }}>
                What We Offer
              </h3>
              <ul className="list-unstyled mb-4">
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle me-2" style={{ color: '#8B775C' }}></i>
                  <span>Competitive commission structure</span>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle me-2" style={{ color: '#8B775C' }}></i>
                  <span>Professional development opportunities</span>
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i className="bi bi-check-circle me-2" style={{ color: '#8B775C' }}></i>
                  <span>A supportive, team-oriented environment</span>
                </li>
                <li className="d-flex align-items-center">
                  <i className="bi bi-check-circle me-2" style={{ color: '#8B775C' }}></i>
                  <span>Growing client base</span>
                </li>
              </ul>
              <Link to="/contact" 
                className="btn" 
                style={{ 
                  backgroundColor: '#8B775C',
                  color: '#fff',
                  fontFamily: 'Lato, sans-serif',
                  borderRadius: '0',
                  padding: '0.6rem 1.5rem'
                }}>
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