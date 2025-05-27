import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../css/Header.css';
import { useCart } from '../context/CartContext';
import { logout, hasRoleAccess } from '../services/authService';

const Header = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);
  
  // Function to close navbar when nav link is clicked
  const closeNavbar = () => {
    setIsNavCollapsed(true);
  };

  // Close navbar when clicking outside (for mobile)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isNavCollapsed && window.innerWidth <= 991) {
        const navbar = document.getElementById('navbarNav');
        const toggler = document.querySelector('.navbar-toggler');
        
        if (navbar && !navbar.contains(event.target) && !toggler.contains(event.target)) {
          closeNavbar();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNavCollapsed]);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if the current user has 'user' role (not staff)
        if (hasRoleAccess('user')) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
      }
    };
    
    checkAuthStatus();
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  // Simplified scroll handler to reduce unnecessary calculations
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);  return (
    <>
      {/* Header placeholder that appears when header becomes fixed */}
      {isScrolled && <div style={{ height: '80px' }}></div>}
      
      {/* Mobile navbar backdrop */}
      <div 
        className={`navbar-backdrop ${!isNavCollapsed ? 'show' : ''}`}
        onClick={closeNavbar}
      ></div>
      
      <header className={`navbar navbar-expand-lg header-navbar ${isScrolled ? 'sticky-header' : ''}`}>
        <div className="header-container container-fluid px-2 px-sm-3 px-md-4">
          {/* Logo and Brand Name */}
          <NavLink to="/" className="navbar-brand d-flex align-items-center">
            <div className="header-logo-circle">
              <span className="logo-letters">GC</span>
            </div>
            <span className="header-brand-name ms-2">
              The Gentleman's Cut
            </span>
          </NavLink>
            <button 
            className="navbar-toggler header-toggler position-relative" 
            type="button" 
            data-bs-toggle="collapse" 
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded={!isNavCollapsed ? true : false}
            aria-label="Toggle navigation"
            onClick={handleNavCollapse}
          >
            <span className="navbar-toggler-icon header-toggler-icon"></span>
            {itemCount > 0 && (
              <span className="toggle-cart-badge">
                {itemCount}
                <span className="visually-hidden">items in cart</span>
              </span>
            )}
          </button>
            <div 
            className={`navbar-collapse ${!isNavCollapsed ? 'show' : ''}`} 
            id="navbarNav"
          >
            {/* Mobile User Authentication at top of navbar */}
            <div className="d-lg-none mb-2">
              {isLoggedIn ? (
                <div className="dropdown d-flex justify-content-center">
                  <button 
                    className="mobile-user-dropdown-btn border-0 bg-transparent position-relative" 
                    type="button"
                    id="mobileNavbarDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle user-icon fs-5"></i>
                  </button>
                  <ul className="dropdown-menu" aria-labelledby="mobileNavbarDropdown" style={{position: 'absolute', inset: '0px auto auto 50%', transform: 'translate(-50%, 0px)'}}>
                    <li>
                      <NavLink 
                        to="/user-profile" 
                        className="dropdown-item"
                        onClick={closeNavbar}
                      >
                        <i className="bi bi-person me-2"></i>My Information
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/my-bookings" 
                        className="dropdown-item"
                        onClick={closeNavbar}
                      >
                        <i className="bi bi-calendar-check me-2"></i>My Bookings
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/my-orders" 
                        className="dropdown-item"
                        onClick={closeNavbar}
                      >
                        <i className="bi bi-bag-check me-2"></i>My Orders
                      </NavLink>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={() => {
                          handleLogout();
                          closeNavbar();
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="d-flex justify-content-center">
                  <NavLink 
                    to="/login" 
                    className="btn border-0 bg-transparent p-0"
                    onClick={closeNavbar}
                  >
                    <i className="bi bi-person fs-5"></i>
                  </NavLink>
                </div>
              )}
            </div>
            
            {/* Divider in mobile */}
            <hr className="d-lg-none my-1" />
            
            {/* Main Navigation - Centered */}
            <ul className="navbar-nav mx-auto header-nav" style={{gap: '0'}}>
              <li className="nav-item">
                <NavLink 
                  to="/" 
                  className={({isActive}) => 
                    `nav-link header-nav-link ${isActive ? 'active' : ''}`} 
                  end
                  onClick={closeNavbar}
                >
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/about" 
                  className={({isActive}) => 
                    `nav-link header-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeNavbar}
                >
                  About
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/services" 
                  className={({isActive}) => 
                    `nav-link header-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeNavbar}
                >
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/team" 
                  className={({isActive}) => 
                    `nav-link header-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeNavbar}
                >
                  Our Team
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink 
                  to="/products" 
                  className={({isActive}) => 
                    `nav-link header-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeNavbar}
                >
                  Products
                </NavLink>
              </li>              <li className="nav-item">
                <NavLink 
                  to="/contact" 
                  className={({isActive}) => 
                    `nav-link header-nav-link ${isActive ? 'active' : ''}`}
                  onClick={closeNavbar}
                >
                  Contact
                </NavLink>
              </li>
                {/* Cart - Mobile and Desktop */}
              <li className="nav-item">
                <NavLink 
                  to="/cart" 
                  className={({isActive}) => 
                    `nav-link header-nav-link cart-btn ${isActive ? 'active' : ''}`}
                  onClick={closeNavbar}
                >
                  <i className="bi bi-cart3 cart-icon"></i>
                  {itemCount > 0 && (
                    <span className="cart-badge">
                      {itemCount}
                      <span className="visually-hidden">items in cart</span>
                    </span>
                  )}
                </NavLink>
              </li>
              
              {/* Mobile Only Book Appointment Button */}
              <li className="nav-item d-lg-none">
                <NavLink 
                  to="/booking" 
                  className="btn btn-sm header-book-btn w-100 mt-1 py-1"
                  onClick={closeNavbar}
                >
                  BOOK APPOINTMENT
                </NavLink>
              </li>
            </ul>              {/* Right Side Elements - User and Book Button */}
            <div className="d-flex align-items-center">
              {/* User Authentication Icon */}
              {isLoggedIn ? (
                <div className="dropdown me-3 d-none d-lg-block">
                  <button 
                    className="user-dropdown-btn" 
                    type="button"
                    id="navbarDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle user-icon fs-5"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <NavLink 
                        to="/user-profile" 
                        className="dropdown-item my-info"
                        onClick={closeNavbar}
                      >
                        <i className="bi bi-person me-2"></i>My Information
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/my-bookings" 
                        className="dropdown-item"
                        onClick={closeNavbar}
                      >
                        <i className="bi bi-calendar-check me-2"></i>My Bookings
                      </NavLink>
                    </li>
                    <li>
                      <NavLink 
                        to="/my-orders" 
                        className="dropdown-item"
                        onClick={closeNavbar}
                      >
                        <i className="bi bi-bag-check me-2"></i>My Orders
                      </NavLink>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={() => {
                          handleLogout();
                          closeNavbar();
                        }}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <NavLink 
                  to="/login" 
                  className="btn btn-outline-dark me-3 d-none d-lg-block"
                  id="login-btn"
                  onClick={closeNavbar}
                >
                  Login
                </NavLink>
              )}
              
              {/* Book Appointment Button - Right side */}
              <NavLink 
                to="/booking" 
                className="btn btn-outline-dark d-none d-lg-block"
                onClick={closeNavbar}
                style={{ borderRadius: '5px' }}
              >
                BOOK APPOINTMENT
              </NavLink>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;