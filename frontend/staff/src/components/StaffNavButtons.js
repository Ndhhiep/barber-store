import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
// Đảm bảo đã import Bootstrap Icons CSS nếu chưa được import toàn cục
import 'bootstrap-icons/font/bootstrap-icons.css'; 
import '../css/StaffNavButtons.css';

const StaffNavButtons = () => {
  const location = useLocation();
  // Sử dụng NotificationContext để lấy số lượng thông báo và các hàm xóa thông báo
  const { 
    orderNotifications, 
    bookingNotifications,
    contactNotifications,
    customerNotifications,
    clearOrderNotifications, 
    clearBookingNotifications,
    clearContactNotifications,
    clearCustomerNotifications
  } = useNotifications();
  // Theo dõi đường dẫn hiện tại để xóa thông báo khi người dùng truy cập trang tương ứng
  useEffect(() => {
    // Khi user vào trang orders, xóa thông báo đơn hàng
    if (location.pathname.includes('/orders')) {
      clearOrderNotifications();
    }
    // Khi user vào trang appointments, xóa thông báo đặt lịch
    else if (location.pathname.includes('/appointments')) {
      clearBookingNotifications();
    }
    // Khi user vào trang contacts, xóa thông báo liên hệ
    else if (location.pathname.includes('/contacts')) {
      clearContactNotifications();
    }
    // Khi user vào trang customers, xóa thông báo khách hàng
    else if (location.pathname.includes('/customers')) {
      clearCustomerNotifications();
    }
  }, [
    location.pathname, 
    clearOrderNotifications, 
    clearBookingNotifications,
    clearContactNotifications,
    clearCustomerNotifications  ]);
  
  // CSS cho badge thông báo
  const notificationBadgeStyle = {
    position: 'absolute',
    top: '5px',
    right: '15px',
    fontSize: '0.65rem',
    padding: '0.25em 0.6em',
    borderRadius: '50%',
    backgroundColor: '#dc3545',
    color: 'white',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '18px',
    height: '18px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    border: '1px solid #fff'
  };
  // CSS cho container chứa link và badge
  const navItemStyle = {
    position: 'relative'
  };  
  // Thêm style cho sidebar để phù hợp với theme tối trong hình
  const sidebarStyles = {
    backgroundColor: "#1e2330",
    color: "white",
    height: "100vh",
    width: "250px", // Changed from 100% to fixed width
    paddingTop: "10px"
  };

  const navHeaderStyles = {
    color: "#828997",
    fontSize: "0.85rem",
    fontWeight: "400",
    padding: "15px 20px",
    letterSpacing: "0.5px"
  };

  const navLinkStyles = {
    color: "#e4e6eb",
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: "0.95rem",
    transition: "all 0.3s ease"
  };

  const navIconStyles = {
    fontSize: "1.2rem",
    marginRight: "12px",
    display: "inline-flex",
    justifyContent: "center",
    width: "24px"
  };

  return (
    <div className="staff-sidebar" style={sidebarStyles}>
      <h3 className="px-3 py-3" style={{ color: "white", fontWeight: "500" }}>Barber Shop</h3>
      <div style={{ borderBottom: "1px solid #32394a", margin: "5px 0 15px 0" }}></div>
      <div style={navHeaderStyles}>MAIN MENU</div>
      <nav className="sidebar-nav">
        <ul style={{ listStyleType: "none", padding: 0, margin: 0 }}>
          <li className="nav-item">
            <NavLink to="/" end style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-grid" style={navIconStyles}></i>
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item" style={navItemStyle}>
            <NavLink to="/appointments" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-calendar4-week" style={navIconStyles}></i>
              Appointments
              {bookingNotifications > 0 && (
                <span style={notificationBadgeStyle}>
                  {bookingNotifications > 99 ? '99+' : bookingNotifications}
                </span>
              )}
            </NavLink>
          </li>
          <li className="nav-item" style={navItemStyle}>
            <NavLink to="/orders" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-cart" style={navIconStyles}></i>
              Orders
              {orderNotifications > 0 && (
                <span style={notificationBadgeStyle}>
                  {orderNotifications > 99 ? '99+' : orderNotifications}
                </span>
              )}
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/products" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-box" style={navIconStyles}></i>
              Products
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/services" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-scissors" style={navIconStyles}></i>
              Services
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/barbers" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-person" style={navIconStyles}></i>
              Barbers
            </NavLink>
          </li>
          <li className="nav-item" style={navItemStyle}>
            <NavLink to="/customers" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-people" style={navIconStyles}></i>
              Customers
              {customerNotifications > 0 && (
                <span style={notificationBadgeStyle}>
                  {customerNotifications > 99 ? '99+' : customerNotifications}
                </span>
              )}
            </NavLink>
          </li>
          <li className="nav-item" style={navItemStyle}>
            <NavLink to="/contacts" style={navLinkStyles} className={({isActive}) => isActive ? "active-nav-link" : ""}>
              <i className="bi bi-envelope" style={navIconStyles}></i>
              Contacts
              {contactNotifications > 0 && (
                <span style={notificationBadgeStyle}>
                  {contactNotifications > 99 ? '99+' : contactNotifications}
                </span>
              )}
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default StaffNavButtons;
