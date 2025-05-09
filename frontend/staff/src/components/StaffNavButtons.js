import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import staffAuthService from '../services/staffAuthService';
import { useNotifications } from '../context/NotificationContext';
// Import Bootstrap Icons CSS if not already globally imported
// import 'bootstrap-icons/font/bootstrap-icons.css'; 

const StaffNavButtons = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const staffUser = staffAuthService.getStaffUser();
  
  // Sử dụng NotificationContext để lấy số lượng thông báo và các hàm xóa thông báo
  const { 
    orderNotifications, 
    bookingNotifications, 
    clearOrderNotifications, 
    clearBookingNotifications 
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
  }, [location.pathname, clearOrderNotifications, clearBookingNotifications]);
  
  // Function to get the last name
  const getLastName = (fullName) => {
    if (!fullName) return 'Staff User';
    const nameParts = fullName.trim().split(' ');
    return nameParts[nameParts.length - 1];
  };

  const handleLogout = () => {
    staffAuthService.staffLogout();
    // Corrected: Redirect to staff login page after logout
    navigate('/login'); 
  };

  // CSS cho badge thông báo
  const notificationBadgeStyle = {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
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

  return (
    <div className="staff-sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li className="nav-item">
            <NavLink to="/" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item" style={navItemStyle}>
            <NavLink to="/appointments" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Appointments
              {bookingNotifications > 0 && (
                <span style={notificationBadgeStyle}>
                  {bookingNotifications > 99 ? '99+' : bookingNotifications}
                </span>
              )}
            </NavLink>
          </li>
          <li className="nav-item" style={navItemStyle}>
            <NavLink to="/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Orders
              {orderNotifications > 0 && (
                <span style={notificationBadgeStyle}>
                  {orderNotifications > 99 ? '99+' : orderNotifications}
                </span>
              )}
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Products
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/services" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Services
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/barbers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Barbers
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/customers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Customers
            </NavLink>
          </li>
        </ul>
      </nav>
      {/* Footer section for user info and logout */}
      <div className="sidebar-footer">
        {/* Sử dụng inline style để ghi đè lên CSS mặc định */}
        <div 
          className="user-info" 
          style={{ 
            display: "flex", 
            flexDirection: "row", // Đảm bảo các phần tử nằm trên cùng một dòng 
            justifyContent: "space-between", // Đẩy các phần tử ra hai đầu
            alignItems: "center", // Căn giữa theo chiều dọc
            width: "100%", // Chiếm toàn bộ chiều rộng
          }}
        > 
          {/* Hiển thị tên cuối */}
          <span className="text-truncate">{getLastName(staffUser?.user?.name)}</span> 
          {/* Nút logout với icon */}
          <button 
            className="logout-btn btn btn-link p-0" 
            onClick={handleLogout} 
            title="Logout"
            style={{ 
              border: "none", // Bỏ border
              background: "transparent", // Trong suốt
              color: "inherit",
              padding: 0,
              lineHeight: 1 
            }} 
          >
            <i className="bi bi-box-arrow-right fs-5"></i> 
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffNavButtons;
