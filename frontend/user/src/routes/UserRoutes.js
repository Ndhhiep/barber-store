import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { UserOnlyRoute, PublicOnlyRoute } from '../components/common/RouteGuards';

// Import user pages
import HomePage from '../pages/HomePage';
import ServicesPage from '../pages/ServicesPage';
import ContactPage from '../pages/ContactPage';
import BookingPage from '../pages/BookingPage';
import BookingConfirmedPage from '../pages/BookingConfirmedPage';
import AboutPage from '../pages/AboutPage';
import TeamPage from '../pages/TeamPage';
import ProductsPage from '../pages/ProductsPage';
import ProductDetailPage from '../pages/ProductDetailPage';
import CartPage from '../pages/CartPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MyBookingsPage from '../pages/MyBookingsPage';
import MyOrdersPage from '../pages/MyOrdersPage';
import UserProfile from '../pages/UserProfile';

const UserRoutes = () => {
  return (
    <Routes>
      {/* Public routes that everyone can access */}
      <Route path="/" element={<HomePage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/products" element={<ProductsPage />} />      <Route path="/products/:id" element={<ProductDetailPage />} />      <Route path="/cart" element={<CartPage />} />
      <Route path="/booking-confirmed" element={<BookingConfirmedPage />} />
      <Route path="/booking" element={<BookingPage />} />
      
      {/* Routes accessible only when not logged in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      {/* Routes requiring user role */}
      <Route element={<UserOnlyRoute />}>
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/user-profile" element={<UserProfile />} />
      </Route>
    </Routes>
  );
};

export default UserRoutes;