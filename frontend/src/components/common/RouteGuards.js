import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { hasRoleAccess } from '../../services/user_services/authService';
import staffAuthService from '../../services/staff_services/staffAuthService';

/**
 * Component to protect routes that require user role access
 * Redirects staff users to staff dashboard
 */
export const UserOnlyRoute = () => {
  // Check if the current user has 'user' role access
  const isUser = hasRoleAccess('user');

  if (isUser) {
    // If user has regular user role, allow access
    return <Outlet />;
  } else {
    // If not authenticated at all, redirect to login
    return <Navigate to="/login" replace />;
  }
};

/**
 * Component to protect routes that require staff role access
 */
export const StaffProtectedRoute = () => {
  // Check if the current user is authenticated as staff
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();

  if (isStaffAuthenticated) {
    return <Outlet />;
  } else {
    // If not authenticated as staff, redirect to staff login
    return <Navigate to="/staff/login" replace />;
  }
};

/**
 * Component to protect routes that should be accessible only when not logged in
 * (like login and register pages)
 */
export const PublicOnlyRoute = () => {
  const isUser = hasRoleAccess('user');

  if (isUser) {
    // If user is regular user, redirect to home
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
    return <Navigate to="/staff" replace />;
  } else {
    // If not authenticated as staff, allow access
    return <Outlet />;
  }
};