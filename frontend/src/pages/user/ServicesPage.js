import React from 'react';
import { Link } from 'react-router-dom';
import '../../css/user/ServicesPage.css';

const ServicesPage = () => {
  const services = [
    {
      id: 1,
      name: "Classic Haircut",
      description: "A precision haircut tailored to your preferences. Includes consultation, shampoo, cut, and styling.",
      price: "$32",
      duration: "45 min"
    },
    {
      id: 2,
      name: "Traditional Hot Towel Shave",
      description: "Experience our signature straight razor shave with hot towel treatment, pre-shave oil, and soothing aftershave.",
      price: "$40",
      duration: "45 min"
    },
    {
      id: 3,
      name: "Beard Trim & Style",
      description: "Expert beard shaping and styling with hot towel and premium beard oils for the perfect finish.",
      price: "$25",
      duration: "30 min"
    },
    {
      id: 4,
      name: "The Gentleman's Package",
      description: "Our complete grooming experience including a haircut, hot towel shave, and facial massage.",
      price: "$75",
      duration: "90 min"
    },
    {
      id: 5,
      name: "Executive Cut & Style",
      description: "Premium haircut with additional styling time and product consultation for the discerning professional.",
      price: "$45",
      duration: "60 min"
    },
    {
      id: 6,
      name: "Father & Son Cut",
      description: "Haircuts for both father and son (12 and under) in our classic barbershop atmosphere.",
      price: "$60",
      duration: "75 min"
    },
    {
      id: 7,
      name: "Grey Blending",
      description: "Subtle grey reduction treatment that maintains a distinguished yet refreshed appearance.",
      price: "$55",
      duration: "60 min"
    },
    {
      id: 8,
      name: "Buzz Cut",
      description: "Clean, classic all-over short cut with clipper of your choice.",
      price: "$25",
      duration: "30 min"
    }
  ];

  return (
    <div className="py-5 services-page">
      <div className="container">
        <div className="text-center mb-5">
          <h1 className="display-4 mb-3 services-heading">Our Services</h1>
          <p className="lead mx-auto services-lead">
            At The Gentleman's Cut, we offer a range of premium grooming services delivered with skill and attention to detail.
            Each service includes a consultation to understand your preferences and ensure your complete satisfaction.
          </p>
        </div>
        
        {/* Services Section */}
        <div className="row g-4">
          {services.map(service => (
            <div key={service.id} className="col-md-6">
              <div className="card h-100 shadow-sm service-card">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h3 className="h4 service-name">{service.name}</h3>
                    <div className="d-flex flex-column align-items-end">
                      <span className="service-price mb-1">{service.price}</span>
                      <span className="text-muted service-duration">{service.duration}</span>
                    </div>
                  </div>
                  <p className="card-text mb-3 service-description">{service.description}</p>
                  <div className="d-flex justify-content-end">
                    <Link to="/booking" className="btn btn-sm book-btn">
                      BOOK NOW
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Additional Information Section */}
        <div className="row mt-5 pt-4">
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm h-100 what-to-expect">
              <div className="card-body p-4">
                <h3 className="h4 mb-4">What to Expect</h3>
                <ul className="list-unstyled mb-0">
                  <li className="mb-3 d-flex">
                    <i className="bi bi-check2 me-2 check-icon"></i>
                    <span>Complimentary consultation before every service</span>
                  </li>
                  <li className="mb-3 d-flex">
                    <i className="bi bi-check2 me-2 check-icon"></i>
                    <span>Relaxed atmosphere with complimentary beverages</span>
                  </li>
                  <li className="mb-3 d-flex">
                    <i className="bi bi-check2 me-2 check-icon"></i>
                    <span>Premium grooming products used for every service</span>
                  </li>
                  <li className="mb-3 d-flex">
                    <i className="bi bi-check2 me-2 check-icon"></i>
                    <span>Hot towel refreshment with each haircut</span>
                  </li>
                  <li className="d-flex">
                    <i className="bi bi-check2 me-2 check-icon"></i>
                    <span>Style advice and product recommendations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm h-100 service-card">
              <div className="card-body p-4">
                <h3 className="h4 mb-4 service-name">Grooming Policies</h3>
                <ul className="list-unstyled mb-0">
                  <li className="mb-3 d-flex">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>Please arrive 5-10 minutes before your appointment time</span>
                  </li>
                  <li className="mb-3 d-flex">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>24-hour cancellation notice required to avoid charge</span>
                  </li>
                  <li className="mb-3 d-flex">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>We accept cash and all major credit/debit cards</span>
                  </li>
                  <li className="mb-3 d-flex">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>Tips are appreciated but not included in service price</span>
                  </li>
                  <li className="d-flex">
                    <i className="bi bi-info-circle me-2 info-icon"></i>
                    <span>Gift certificates available for all services</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Call to Action */}
        <div className="text-center mt-5 pt-3">
          <p className="lead mb-4 cta-text">Ready to experience the difference?</p>
          <Link to="/booking" className="btn btn-lg px-5 cta-btn">
            Book Your Appointment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;