import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { hasRoleAccess } from '../../services/authService';

/**
 * Component bảo vệ các route yêu cầu quyền truy cập của người dùng
 */
export const UserOnlyRoute = () => {
  // Kiểm tra xem người dùng hiện tại có vai trò 'user' hay không
  const isUser = hasRoleAccess('user');

  if (isUser) {
    // Nếu là người dùng hợp lệ, cho phép truy cập
    return <Outlet />;
  } else {
    // Nếu chưa xác thực, chuyển hướng đến trang đăng nhập
    return <Navigate to="/login" replace />;
  }
};

/**
 * Component bảo vệ các route chỉ truy cập khi chưa đăng nhập
 * (ví dụ: trang đăng nhập và đăng ký)
 */
export const PublicOnlyRoute = () => {
  // Kiểm tra trạng thái xác thực của người dùng
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  let isUser = false;
  
  if (token && userStr) {
    try {
      const userData = JSON.parse(userStr);
      // Đảm bảo chúng ta có dữ liệu người dùng hợp lệ với vai trò chính xác
      isUser = userData && userData.role === 'user' && userData.name;
    } catch (e) {
      console.error("Error parsing user data:", e);
      // Xóa dữ liệu người dùng không hợp lệ
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      isUser = false;
    }
  }

  if (isUser) {
    // Nếu đã đăng nhập, chuyển hướng về trang chủ
    return <Navigate to="/" replace />;
  } else {
    // Nếu chưa đăng nhập, cho phép truy cập
    return <Outlet />;
  }
};