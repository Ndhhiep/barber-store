import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import staff pages
import StaffDashboard from '../pages/staff/StaffDashboard';
import StaffAppointments from '../pages/staff/StaffAppointments';
import StaffOrders from '../pages/staff/StaffOrders';
import StaffProducts from '../pages/staff/StaffProducts';
import StaffCustomers from '../pages/staff/StaffCustomers';
import StaffLayout from '../components/staff/StaffLayout';
import StaffLoginPage from '../pages/staff/StaffLoginPage';

// Import staff route guards
import { StaffProtectedRoute, StaffPublicOnlyRoute } from '../components/common/RouteGuards';

const StaffRoutes = () => {
  return (
    <Routes>
      {/* Public staff routes */}
      <Route element={<StaffPublicOnlyRoute />}>
        <Route path="/login" element={<StaffLoginPage />} />
      </Route>
      
      {/* Protected staff routes */}
      <Route element={<StaffProtectedRoute />}>
        <Route element={<StaffLayout />}>
          <Route path="/" element={<StaffDashboard />} />
          <Route path="/appointments" element={<StaffAppointments />} />
          <Route path="/orders" element={<StaffOrders />} />
          <Route path="/products" element={<StaffProducts />} />
          <Route path="/customers" element={<StaffCustomers />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default StaffRoutes;