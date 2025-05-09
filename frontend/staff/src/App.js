import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import StaffRoutes from './routes/StaffRoutes';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';

// Hàm cuộn lên đầu trang khi điều hướng
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]); 

  return null; 
}

// Component chính của ứng dụng staff
function App() {
  return (
    <Router>
      <ScrollToTop />
      <SocketProvider>
        <NotificationProvider>
          <div className="App">
            <main>
              <Routes>
                <Route path="/*" element={<StaffRoutes />} />
              </Routes>
            </main>
          </div>
        </NotificationProvider>
      </SocketProvider>
    </Router>
  );
}

export default App;