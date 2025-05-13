import React from 'react';
import '../css/Footer.css'; 

function Footer() {
  return (
    <footer className="py-5 footer">
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3 footer-heading">The Gentleman's Cut</h5>
            <p className="footer-text">Providing exceptional grooming services in a classic barbershop atmosphere since 2015.</p>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3 footer-heading">Hours</h5>
            <p className="footer-text mb-1">Monday - Sunday: 9am - 7pm</p>
            
          </div>
          <div className="col-md-4">
            <h5 className="text-uppercase mb-3 footer-heading">Contact</h5>
            <p className="footer-text mb-1">123 Main Street, Downtown</p>
            <p className="footer-text mb-1">Phone: (555) 123-4567</p>
            <p className="footer-text">Email: info@gentlemanscut.com</p>
          </div>
        </div>
        <hr className="my-4 footer-separator" />
        <div className="row align-items-center">
          <div className="col-md-8 footer-copyright">
            <p className="footer-text mb-md-0">&copy; {new Date().getFullYear()} The Gentleman's Cut Barbershop. All rights reserved.</p>
          </div>
          <div className="col-md-4 text-md-end footer-social-container">
            <a href="#!" className="footer-social-link me-3">
              <i className="bi bi-facebook"></i>
            </a>
            <a href="#!" className="footer-social-link me-3">
              <i className="bi bi-instagram"></i>
            </a>
            <a href="#!" className="footer-social-link">
              <i className="bi bi-twitter"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;