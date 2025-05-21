import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import staffAuthService from '../../services/staffAuthService';

/**
 * Component bảo vệ route chỉ cho phép người dùng có vai trò phù hợp truy cập
 * Chuyển hướng người dùng staff đến trang dashboard
 */
export const UserOnlyRoute = () => {
  // Trong ứng dụng staff riêng biệt, không sử dụng route này
  return <Navigate to="/login" replace />;
};

/**
 * Component bảo vệ các route yêu cầu quyền truy cập của staff
 * Đảm bảo chỉ có staff đã xác thực mới được truy cập
 */
export const StaffProtectedRoute = () => {
  // Kiểm tra xem người dùng đã xác thực với vai trò staff chưa
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  // Nếu đã xác thực, hiển thị route con
  if (isStaffAuthenticated) {
    return <Outlet />;
  } else {
    // Nếu chưa xác thực, chuyển hướng về trang đăng nhập
    return <Navigate to="/login" replace />;
  }
};

/**
 * Component bảo vệ route chỉ cho phép truy cập khi chưa đăng nhập
 * (ví dụ: trang đăng nhập và đăng ký)
 */
export const PublicOnlyRoute = () => {
  // Kiểm tra trạng thái xác thực của staff
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  if (isStaffAuthenticated) {
    // Nếu đã đăng nhập, chuyển hướng đến trang dashboard
    return <Navigate to="/" replace />;
  } else {
    // Nếu chưa đăng nhập, cho phép truy cập
    return <Outlet />;
  }
};

/**
 * Component bảo vệ route chỉ cho phép truy cập khi chưa đăng nhập với vai trò staff
 * (ví dụ: trang đăng nhập của staff)
 */
export const StaffPublicOnlyRoute = () => {
  // Kiểm tra trạng thái xác thực của staff
  const isStaff = staffAuthService.isStaffAuthenticated();

  if (isStaff) {
    // Nếu đã đăng nhập, chuyển hướng đến trang dashboard
    return <Navigate to="/" replace />;
  } else {
    // Nếu chưa đăng nhập, cho phép truy cập
    return <Outlet />;
  }
};