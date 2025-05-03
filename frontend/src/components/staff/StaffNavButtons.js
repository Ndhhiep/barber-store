import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import staffAuthService from '../../services/staff_services/staffAuthService';
// Import Bootstrap Icons CSS if not already globally imported
// import 'bootstrap-icons/font/bootstrap-icons.css'; 

const StaffNavButtons = () => {
  const navigate = useNavigate();
  const staffUser = staffAuthService.getStaffUser();
  
  // Function to get the last name
  const getLastName = (fullName) => {
    if (!fullName) return 'Staff User';
    const nameParts = fullName.trim().split(' ');
    return nameParts[nameParts.length - 1];
  };

  const handleLogout = () => {
    staffAuthService.staffLogout();
    // Corrected: Redirect to staff login page after logout
    navigate('/staff/login'); 
  };

  return (
    <div className="staff-sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li className="nav-item">
            <NavLink to="/staff" end className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/staff/appointments" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Appointments
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/staff/orders" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Orders
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/staff/products" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
              Products
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/staff/customers" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
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
