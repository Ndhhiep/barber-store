import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { hasRoleAccess } from '../../services/authService';

/**
 * Component to protect routes that require user role access
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
 * Component to protect routes that should be accessible only when not logged in
 * (like login and register pages)
 */
export const PublicOnlyRoute = () => {
  // Check for regular user authentication
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
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
  } else {
    // If not authenticated at all, allow access
    return <Outlet />;
  }
};