import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import StaffNavButtons from './StaffNavButtons';

import staffAuthService from '../../services/staff_services/staffAuthService';
import '../../css/staff/StaffLayout.css';

const StaffLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = () => {
      // Check if user is authenticated as staff
      if (staffAuthService.isStaffAuthenticated()) {
        // Get navigation history from session storage
        const staffNavHistory = sessionStorage.getItem('staffNavHistory');
        
        // Staff must have proper navigation history or be freshly logged in
        if (staffNavHistory || sessionStorage.getItem('staffJustLoggedIn')) {
          setAuthorized(true);
          
          // If just logged in, clear that flag but set navigation history
          if (sessionStorage.getItem('staffJustLoggedIn')) {
            sessionStorage.removeItem('staffJustLoggedIn');
            sessionStorage.setItem('staffNavHistory', 'true');
          }
        }
      }
      setLoading(false);
    };
    
    checkAuth();
    
    // Update navigation history on each staff page access
    return () => {
      if (staffAuthService.isStaffAuthenticated()) {
        sessionStorage.setItem('staffNavHistory', 'true');
      }
    };
  }, [location.pathname]);
  
  if (loading) {
    return <div className="staff-loading">Loading...</div>;
  }
  
  if (!authorized) {
    // If not properly authenticated or didn't enter through login, redirect to staff login
    return <Navigate to="/staff/login" replace />;
  }
  
  return (
    <div className="staff-page-container">
      <div className="staff-layout-container">
        <StaffNavButtons />
        <main className="staff-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;