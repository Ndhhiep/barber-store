import React from 'react';
import { Link } from 'react-router-dom';
import staffAuthService from '../../services/staff_services/staffAuthService';
// Ensure Bootstrap Icons are imported if not globally available
// import 'bootstrap-icons/font/bootstrap-icons.css';

const StaffHeader = () => {
  const staffUser = staffAuthService.getStaffUser();
  
  const handleLogout = () => {
    staffAuthService.staffLogout();
  };

  return (
    <header className="staff-top-header">
      <div className="container-fluid">
        {/* Use flexbox for alignment */}
        <div className="header-content d-flex justify-content-between align-items-center">
          <Link className="navbar-brand" to="/staff">Barber Store Staff</Link>
          {/* Use flexbox for user actions alignment */}
          <div className="user-actions d-flex align-items-center">
            <span className="staff-user-name me-3">{staffUser?.user?.name || 'Staff User'}</span>
            {/* Logout button with icon */}
            <button 
              className="logout-btn btn btn-link p-0" 
              onClick={handleLogout}
              title="Logout"
              style={{ color: 'inherit', textDecoration: 'none', lineHeight: 1 }} // Adjust styling as needed
            >
              <i className="bi bi-box-arrow-right fs-5"></i> {/* Bootstrap logout icon */}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;