import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/header'; 
import Footer from './components/Footer';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext'; 
import { SocketProvider } from './context/SocketContext';
import UserRoutes from './routes/UserRoutes';

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
  
  // Paths where user header should be hidden
  const hideHeaderPaths = ['/login', '/register'];
  
  // Check whether to show user header
  const showUserHeader = !hideHeaderPaths.includes(location.pathname);
    return (
    <SocketProvider>
      <CartProvider>
        <div className="App">
          {showUserHeader && <Header />}
          <main>
            <Routes>
              {/* User routes */}
              <Route path="/*" element={<UserRoutes />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </CartProvider>
    </SocketProvider>
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