import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { UserOnlyRoute, PublicOnlyRoute } from '../components/common/RouteGuards';

// Import user pages
import HomePage from '../pages/user/HomePage';
import ServicesPage from '../pages/user/ServicesPage';
import ContactPage from '../pages/user/ContactPage';
import BookingPage from '../pages/user/BookingPage';
import AboutPage from '../pages/user/AboutPage';
import TeamPage from '../pages/user/TeamPage';
import ProductsPage from '../pages/user/ProductsPage';
import ProductDetailPage from '../pages/user/ProductDetailPage';
import CartPage from '../pages/user/CartPage';
import LoginPage from '../pages/user/LoginPage';
import RegisterPage from '../pages/user/RegisterPage';
import MyBookingsPage from '../pages/user/MyBookingsPage';
import MyOrdersPage from '../pages/user/MyOrdersPage';
import UserProfile from '../pages/user/UserProfile';

const UserRoutes = () => {
  return (
    <Routes>
      {/* Public routes that everyone can access */}
      <Route path="/" element={<HomePage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/team" element={<TeamPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      
      {/* Routes accessible only when not logged in */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      
      {/* Routes requiring user role */}
      <Route element={<UserOnlyRoute />}>
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        <Route path="/user-profile" element={<UserProfile />} />
      </Route>
    </Routes>
  );
};

export default UserRoutes;