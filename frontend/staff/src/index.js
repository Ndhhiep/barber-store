import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
// Import animate.css for animations
import 'animate.css';
// Sửa lỗi không tìm thấy bootstrap-icons CSS - cần cài đặt package
// import 'bootstrap-icons/font/bootstrap-icons.css';
// Thay vì import CSS không tồn tại, tạm thời bỏ qua
// import './css/StaffApp.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);