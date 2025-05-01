import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/user/header'; 
import Footer from './components/user/Footer';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext'; 
import UserRoutes from './routes/UserRoutes';
import StaffRoutes from './routes/StaffRoutes';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); 

  return null; 
}

// Component to manage content display
function AppContent() {
  const location = useLocation();
  
  // Check if we're in staff routes
  const isStaffRoute = location.pathname.startsWith('/staff');
  
  // Paths where user header should be hidden
  const hideHeaderPaths = ['/login', '/register'];
  
  // Check whether to show user header
  const showUserHeader = !hideHeaderPaths.includes(location.pathname) && !isStaffRoute;
  
  return (
    <CartProvider>
      <div className="App">
        {showUserHeader && <Header />}
        <main>
          <Routes>
            {/* Staff routes */}
            <Route path="/staff/*" element={<StaffRoutes />} />
            
            {/* User routes - all other paths */}
            <Route path="/*" element={<UserRoutes />} />
          </Routes>
        </main>
        {!isStaffRoute && <Footer />}
      </div>
    </CartProvider>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}

export default App;