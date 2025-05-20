import React, { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import StaffHeader from './StaffHeader';
import StaffNavButtons from './StaffNavButtons';

import staffAuthService from '../services/staffAuthService';
import '../css/StaffLayout.css';

const StaffLayout = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = () => {
      // Kiểm tra xem user đã xác thực với vai trò staff chưa
      if (staffAuthService.isStaffAuthenticated()) {
        // Lấy lịch sử điều hướng từ sessionStorage
        const staffNavHistory = sessionStorage.getItem('staffNavHistory');
        
        // Staff phải có lịch sử điều hướng hợp lệ hoặc vừa mới đăng nhập
        if (staffNavHistory || sessionStorage.getItem('staffJustLoggedIn')) {
          setAuthorized(true);
          
          // Nếu vừa mới đăng nhập, xoá flag đó và thiết lập lịch sử điều hướng
          if (sessionStorage.getItem('staffJustLoggedIn')) {
            sessionStorage.removeItem('staffJustLoggedIn');
            sessionStorage.setItem('staffNavHistory', 'true');
          }
        }
      }
      setLoading(false);
    };
    
    checkAuth();
    
    // Cập nhật lịch sử điều hướng mỗi khi truy cập trang staff
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
    // Nếu chưa xác thực đúng cách hoặc không vào từ login, chuyển hướng về trang login staff
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="staff-page-container">
      <div className="staff-layout-container">
        <aside className="staff-sidebar"> {/* Changed from sidebar-container to staff-sidebar */}
          <StaffNavButtons />
        </aside>
        <div className="staff-content-wrapper">
          <StaffHeader />
          <main className="staff-main-content">
            <div className="staff-content-body">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StaffLayout;