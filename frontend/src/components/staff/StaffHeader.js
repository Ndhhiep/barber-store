import React from 'react';
import { Link } from 'react-router-dom';
import staffAuthService from '../../services/staff_services/staffAuthService';

const StaffHeader = () => {
  const staffUser = staffAuthService.getStaffUser();
  
  const handleLogout = () => {
    // Sử dụng staffAuthService.staffLogout thay vì authService.logout
    staffAuthService.staffLogout();
  };

  return (
    <header className="staff-top-header">
      <div className="container-fluid">
        <div className="header-content">
          <Link className="navbar-brand" to="/staff">Barber Store Staff</Link>
          <div className="user-actions">
            <span className="staff-user-name">{staffUser?.user?.name || 'Staff User'}</span>
            <button className="logout-btn" onClick={handleLogout}>LOGOUT</button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;