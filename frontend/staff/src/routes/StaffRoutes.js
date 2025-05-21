import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Nhập các trang dành cho staff
import StaffDashboard from '../pages/StaffDashboard';
import StaffAppointments from '../pages/StaffAppointments';
import StaffOrders from '../pages/StaffOrders';
import StaffProducts from '../pages/StaffProducts';
import StaffCustomers from '../pages/StaffCustomers';
import StaffServices from '../pages/StaffServices';
import StaffBarbers from '../pages/StaffBarbers';
import StaffLayout from '../components/StaffLayout';
import StaffLoginPage from '../pages/StaffLoginPage';
import StaffContacts from '../pages/StaffContacts';

// Nhập các route guard dành cho staff
import { StaffProtectedRoute, StaffPublicOnlyRoute } from '../components/common/RouteGuards';

const StaffRoutes = () => {
  return (
    <Routes>
      {/* Các route công khai cho staff */}
      <Route element={<StaffPublicOnlyRoute />}>
        <Route path="/login" element={<StaffLoginPage />} />
      </Route>
      
      {/* Các route được bảo vệ cho staff */}
      <Route element={<StaffProtectedRoute />}>
        <Route element={<StaffLayout />}>
          <Route path="/" element={<StaffDashboard />} />
          <Route path="/appointments" element={<StaffAppointments />} />
          <Route path="/orders" element={<StaffOrders />} />
          <Route path="/products" element={<StaffProducts />} />
          <Route path="/customers" element={<StaffCustomers />} />
          <Route path="/services" element={<StaffServices />} />
          <Route path="/barbers" element={<StaffBarbers />} />
          <Route path="/contacts" element={<StaffContacts />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default StaffRoutes;