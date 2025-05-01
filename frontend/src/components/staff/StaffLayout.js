import React, { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import StaffNavButtons from './StaffNavButtons';
import StaffHeader from './StaffHeader';
import staffAuthService from '../../services/staff_services/staffAuthService';
import '../../css/staff/StaffLayout.css';

const StaffLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  useEffect(() => {
    const checkAuth = () => {
      // Sử dụng staffAuthService.isStaffAuthenticated thay vì hasRoleAccess
      if (staffAuthService.isStaffAuthenticated()) {
        setAuthorized(true);
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);
  
  if (loading) {
    return <div className="staff-loading">Loading...</div>;
  }
  
  if (!authorized) {
    // Nếu không được xác thực là staff, chuyển hướng đến trang đăng nhập staff
    return <Navigate to="/staff/login" replace />;
  }
  
  return (
    <div className="staff-page-container">
      <StaffHeader />
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