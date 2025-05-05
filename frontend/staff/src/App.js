import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import StaffRoutes from './routes/StaffRoutes';

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
      <div className="App">
        <main>
          <Routes>
            <Route path="/*" element={<StaffRoutes />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;