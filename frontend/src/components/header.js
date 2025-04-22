import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import '../css/Header.css';
import { useCart } from '../context/CartContext';

const Header = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const { itemCount } = useCart();

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  // Simplified scroll handler to reduce unnecessary calculations
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Header placeholder that appears when header becomes fixed */}
      {isScrolled && <div style={{ height: '80px' }}></div>}
      
      <header className={`navbar navbar-expand-lg header-navbar ${isScrolled ? 'sticky-header' : ''}`}>
        <div className="header-container container-fluid px-2 px-sm-3 px-md-4">
          <NavLink to="/" className="navbar-brand d-flex align-items-center">
            <img 
              src="/assets/logo.PNG" 
              alt="The Gentleman's Cut" 
              className="header-brand-logo"
            />
            <span className="header-brand-name d-none d-sm-inline">
              The Gentleman's Cut
            </span>
          </NavLink>
          
          <button 
            className="navbar-toggler header-toggler" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={!isNavCollapsed ? true : false}
            aria-label="Toggle navigation"
            onClick={handleNavCollapse}
          >
            <span className="navbar-toggler-icon header-toggler-icon"></span>
          </button>
          
          <div 
            className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} 
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto me-0 header-nav">
              <li className="nav-item">
                <NavLink to="/" className={({isActive}) => 
                  `nav-link header-nav-link ${isActive ? 'active' : ''}`} end>
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/about" className={({isActive}) => 
                  `nav-link header-nav-link ${isActive ? 'active' : ''}`}>
                  About
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/services" className={({isActive}) => 
                  `nav-link header-nav-link ${isActive ? 'active' : ''}`}>
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/team" className={({isActive}) => 
                  `nav-link header-nav-link ${isActive ? 'active' : ''}`}>
                  Our Team
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/products" className={({isActive}) => 
                  `nav-link header-nav-link ${isActive ? 'active' : ''}`}>
                  Products
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/contact" className={({isActive}) => 
                  `nav-link header-nav-link ${isActive ? 'active' : ''}`}>
                  Contact
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/cart" className={({isActive}) => 
                  `nav-link header-nav-link position-relative ${isActive ? 'active' : ''}`}>
                  <i className="bi bi-cart3 fs-5"></i>
                  {itemCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {itemCount}
                      <span className="visually-hidden">items in cart</span>
                    </span>
                  )}
                </NavLink>
              </li>
              <li className="nav-item mt-2 mt-lg-0 ms-lg-3">
                <NavLink to="/booking" className="btn header-book-btn">
                  Book Appointment
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;