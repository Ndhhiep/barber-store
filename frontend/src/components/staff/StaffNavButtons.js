import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import staffAuthService from '../../services/staff_services/staffAuthService';

const StaffNavButtons = () => {
  const navigate = useNavigate();
  const staffUser = staffAuthService.getStaffUser();
  
  const handleLogout = () => {
    staffAuthService.staffLogout();
    navigate('/login');
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
      
      <div className="sidebar-footer">
        <div className="user-info">
          <span>{staffUser?.name || 'Staff User'}</span>
          <button className="logout-btn" onClick={handleLogout}>LOGOUT</button>
        </div>
      </div>
    </div>
  );
};

export default StaffNavButtons;
