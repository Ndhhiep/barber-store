import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../../css/user/Header.css';
import { useCart } from '../../context/CartContext';
import { logout, hasRoleAccess } from '../../services/user_services/authService';

const Header = () => {
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleNavCollapse = () => setIsNavCollapsed(!isNavCollapsed);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if the current user has 'user' role (not staff)
        if (hasRoleAccess('user')) {
          const userData = JSON.parse(localStorage.getItem('user'));
          setIsLoggedIn(true);
          setUserName(userData.name.split(' ')[0]); // Just use first name
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
          
          {/* Book Appointment button - Moved to left side */}
          <NavLink to="/booking" className="btn header-book-btn d-none d-lg-block me-auto ms-4">
            Book Appointment
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
            <ul className="navbar-nav mx-auto header-nav">
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
              
              {/* Mobile Only Book Appointment Button */}
              <li className="nav-item d-lg-none">
                <NavLink to="/booking" className="btn header-book-btn w-100 mt-3">
                  Book Appointment
                </NavLink>
              </li>
            </ul>
            
            <div className="d-flex align-items-center">
              {/* Cart button - Moved to right side */}
              <NavLink to="/cart" className="position-relative cart-btn me-3">
                <i className="bi bi-cart3 fs-5"></i>
                {itemCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {itemCount}
                    <span className="visually-hidden">items in cart</span>
                  </span>
                )}
              </NavLink>

              {/* Divider between cart and login */}
              <div className="vr mx-2 d-none d-sm-block header-divider"></div>
              
              {/* User Authentication Links */}
              {isLoggedIn ? (
                <div className="dropdown">
                  <button 
                    className="user-dropdown-btn dropdown-toggle" 
                    type="button"
                    id="navbarDropdown" 
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle user-icon"></i>
                    <span>{userName}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                    <li>
                      <NavLink to="/user-profile" className="dropdown-item my-info">
                        <i className="bi bi-person"></i>My Information
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/my-bookings" className="dropdown-item">
                        <i className="bi bi-calendar-check me-2"></i>My Bookings
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/my-orders" className="dropdown-item">
                        <i className="bi bi-bag-check me-2"></i>My Orders
                      </NavLink>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={handleLogout}
                      >
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <NavLink to="/login" className="login-btn">
                  Login
                </NavLink>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;