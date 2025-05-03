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
 * Ensures that all protected staff routes can only be accessed via proper authentication
 */
export const StaffProtectedRoute = () => {
  // Check if the current user is authenticated as staff
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  // Check where user came from (if they navigated directly)
  const referrer = document.referrer;
  const hasValidReferrer = referrer.includes('/staff/login') || referrer.includes('/staff/');
  
  // If staff is authenticated and they either came from login or another staff page, allow access
  if (isStaffAuthenticated) {
    return <Outlet />;
  } else {
    // If not authenticated as staff, always redirect to staff login
    return <Navigate to="/staff/login" replace />;
  }
};

/**
 * Component to protect routes that should be accessible only when not logged in
 * (like login and register pages)
 */
export const PublicOnlyRoute = () => {
  // Check for regular user authentication
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  // Check for staff authentication
  const isStaffAuthenticated = staffAuthService.isStaffAuthenticated();
  
  let isUser = false;
  
  if (token && userStr) {
    try {
      const userData = JSON.parse(userStr);
      // Make sure we have valid user data with correct role
      isUser = userData && userData.role === 'user' && userData.name;
    } catch (e) {
      console.error("Error parsing user data:", e);
      // Clear invalid user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      isUser = false;
    }
  }

  if (isUser) {
    // If user is regular user, redirect to home
    return <Navigate to="/" replace />;
  } else if (isStaffAuthenticated) {
    // If user is authenticated as staff, redirect to staff dashboard
    return <Navigate to="/staff" replace />;
  } else {
    // If not authenticated at all, allow access
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