import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import staff pages
import StaffDashboard from '../pages/StaffDashboard';
import StaffAppointments from '../pages/StaffAppointments';
import StaffOrders from '../pages/StaffOrders';
import StaffProducts from '../pages/StaffProducts';
import StaffCustomers from '../pages/StaffCustomers';
import StaffServices from '../pages/StaffServices';
import StaffBarbers from '../pages/StaffBarbers';
import StaffLayout from '../components/StaffLayout';
import StaffLoginPage from '../pages/StaffLoginPage';

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
          <Route path="/services" element={<StaffServices />} />
          <Route path="/barbers" element={<StaffBarbers />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default StaffRoutes;