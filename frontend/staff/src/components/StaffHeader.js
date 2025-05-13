import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import staffAuthService from '../services/staffAuthService';
// Ensure Bootstrap Icons are imported if not globally available
// import 'bootstrap-icons/font/bootstrap-icons.css';

const StaffHeader = () => {
  const staffUser = staffAuthService.getStaffUser();
  const navigate = useNavigate();
  const [notificationCount] = useState(2); // Default notification count, can be dynamic later
  
  const handleLogout = () => {
    staffAuthService.staffLogout();
    navigate('/login');
  };
  
  // Get user initials for avatar
  const getUserInitials = () => {
    const name = staffUser?.user?.name || 'Staff User';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };  return (
    <header className="staff-top-header">
      <div className="container-fluid">
        <div className="header-content d-flex justify-content-between align-items-center w-100">
          {/* Left side - can add a brand or title here if needed */}
          <div></div>
          
          {/* User actions - right aligned */}
          <div className="user-actions d-flex align-items-center">            {/* Notification bell */}
            <div className="notification-bell">
              <button 
                className="btn btn-icon notification-btn"
                title="Notifications"
              >
                <span className="material-symbols-outlined">notifications</span>
                {notificationCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{transform: 'translate(-50%, -50%)'}}>
                    {notificationCount}
                    <span className="visually-hidden">unread notifications</span>
                  </span>
                )}
              </button>
            </div>
            
            {/* User avatar */}
            <div className="user-avatar" title={staffUser?.user?.name || 'Staff User'}>
              {getUserInitials()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;