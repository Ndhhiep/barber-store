import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import staffAuthService from '../../services/staffAuthService';

/**
 * Component to protect routes that require user role access
 * Redirects staff users to staff dashboard
 */
export const UserOnlyRoute = () => {
  // Trong ứng dụng staff riêng biệt, chúng ta không cần route này
  return <Navigate to="/login" replace />;
};

/**
 * Component to protect routes that require staff role access
 * Ensures that all protected staff routes can only be accessed via proper authentication
 */
export const StaffProtectedRoute = () => {
  // Check if the current user is authenticated as staff
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  // Check where user came from (if they navigated directly)
  const referrer = document.referrer;
  const hasValidReferrer = referrer.includes('/login') || referrer.includes('/');
  
  // If staff is authenticated and they either came from login or another staff page, allow access
  if (isStaffAuthenticated) {
    return <Outlet />;
  } else {
    // If not authenticated as staff, always redirect to staff login
    return <Navigate to="/login" replace />;
  }
};

/**
 * Component to protect routes that should be accessible only when not logged in
 * (like login and register pages)
 */
export const PublicOnlyRoute = () => {
  // Check for staff authentication
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  if (isStaffAuthenticated) {
    // If authenticated as staff, redirect to staff dashboard
    return <Navigate to="/" replace />;
  } else {
    // If not authenticated, allow access
    return <Outlet />;
  }
};

/**
 * Component to protect routes that should be accessible only when not logged in as staff
 * (like staff login page)
 */
export const StaffPublicOnlyRoute = () => {
  const isStaff = staffAuthService.isStaffAuthenticated();

  if (isStaff) {
    // If already logged in as staff, redirect to staff dashboard
    return <Navigate to="/" replace />;
  } else {
    // If not authenticated as staff, allow access
    return <Outlet />;
  }
};