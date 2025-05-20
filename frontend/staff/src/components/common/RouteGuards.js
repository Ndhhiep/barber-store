import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import staffAuthService from '../../services/staffAuthService';

/**
 * Component để bảo vệ các route chỉ cho phép user có vai trò truy cập
 * Chuyển hướng staff users đến staff dashboard
 */
export const UserOnlyRoute = () => {
  // Trong ứng dụng staff riêng biệt, chúng ta không cần route này
  return <Navigate to="/login" replace />;
};

/**
 * Component để bảo vệ các route yêu cầu quyền truy cập staff
 * Đảm bảo tất cả staff routes được bảo vệ chỉ có thể truy cập khi đã xác thực
 */
export const StaffProtectedRoute = () => {
  // Kiểm tra xem user hiện tại đã xác thực với vai trò staff chưa
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  // Nếu đã xác thực là staff và họ đã đến từ trang login hoặc trang staff khác, cho phép truy cập
  if (isStaffAuthenticated) {
    return <Outlet />;
  } else {
    // Nếu chưa xác thực là staff, chuyển hướng về trang login
    return <Navigate to="/login" replace />;
  }
};

/**
 * Component để bảo vệ các route chỉ truy cập khi chưa đăng nhập
 * (như trang login và register)
 */
export const PublicOnlyRoute = () => {
  // Kiểm tra xác thực staff
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  if (isStaffAuthenticated) {
    // Nếu đã xác thực là staff, chuyển hướng đến staff dashboard
    return <Navigate to="/" replace />;
  } else {
    // Nếu chưa xác thực, cho phép truy cập
    return <Outlet />;
  }
};

/**
 * Component để bảo vệ các route chỉ truy cập khi chưa đăng nhập với vai trò staff
 * (như trang staff login)
 */
export const StaffPublicOnlyRoute = () => {
  const isStaff = staffAuthService.isStaffAuthenticated();

  if (isStaff) {
    // Nếu đã đăng nhập là staff, chuyển hướng đến staff dashboard
    return <Navigate to="/" replace />;
  } else {
    // Nếu chưa xác thực là staff, cho phép truy cập
    return <Outlet />;
  }
};