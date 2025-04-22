import React from 'react';

function Footer() {
  return (
    <footer className="py-5 mt-5" style={{ backgroundColor: '#2B2A2A', color: '#D9D0C7' }}>
      <div className="container">
        <div className="row">
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3" style={{ color: '#D9D0C7', fontFamily: 'Playfair Display, serif' }}>The Gentleman's Cut</h5>
            <p className="small">Providing exceptional grooming services in a classic barbershop atmosphere since 2015.</p>
          </div>
          <div className="col-md-4 mb-4 mb-md-0">
            <h5 className="text-uppercase mb-3" style={{ color: '#D9D0C7', fontFamily: 'Playfair Display, serif' }}>Hours</h5>
            <p className="small mb-1">Monday - Friday: 9am - 7pm</p>
            <p className="small mb-1">Saturday: 10am - 6pm</p>
            <p className="small">Sunday: Closed</p>
          </div>
          <div className="col-md-4">
            <h5 className="text-uppercase mb-3" style={{ color: '#D9D0C7', fontFamily: 'Playfair Display, serif' }}>Contact</h5>
            <p className="small mb-1">123 Main Street, Downtown</p>
            <p className="small mb-1">Phone: (555) 123-4567</p>
            <p className="small">Email: info@gentlemanscut.com</p>
          </div>
        </div>
        <hr className="my-4" style={{ backgroundColor: '#504B40', opacity: 0.2 }} />
        <div className="row align-items-center">
          <div className="col-md-8 small">
            <p className="mb-md-0">&copy; {new Date().getFullYear()} The Gentleman's Cut Barbershop. All rights reserved.</p>
          </div>
          <div className="col-md-4 text-md-end">
            <a href="#!" className="text-decoration-none me-3" style={{ color: '#D9D0C7' }}>
              <i className="bi bi-facebook"></i>
            </a>
            <a href="#!" className="text-decoration-none me-3" style={{ color: '#D9D0C7' }}>
              <i className="bi bi-instagram"></i>
            </a>
            <a href="#!" className="text-decoration-none" style={{ color: '#D9D0C7' }}>
              <i className="bi bi-twitter"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;