import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import staffAuthService from '../services/staffAuthService';
import '../css/LoginPage.css'; // Cập nhật đường dẫn CSS

const StaffLoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    // Kiểm tra xem staff đã đăng nhập chưa
    if (staffAuthService.isStaffAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    })); 
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
      try {
      // Sử dụng staffAuthService.staffLogin để xác thực
      await staffAuthService.staffLogin(formData.email, formData.password);
      
      // Đặt flag trong sessionStorage để đánh dấu quy trình đăng nhập đúng
      sessionStorage.setItem('staffJustLoggedIn', 'true');
      
      // Điều hướng đến trang dashboard cho staff
      navigate('/');
    } catch (error) {
      setError(
        error.response?.data?.message || error.message ||
        'Staff login failed. Please check your credentials or make sure you have staff privileges.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-page" style={{ backgroundImage: 'url(/assets/login_background.webp)' }}>
      <div className="login-overlay"></div>
      
      <div className="container login-container">
        <div className="row">
          {/* Cột bên trái với nội dung chào mừng */}
          <div className="col-lg-6 welcome-column">
            <div className="welcome-content">
              <h1 className="welcome-title">Staff Portal<br/>The Gentle</h1>
              <p className="welcome-text">
                Welcome to the staff management portal. 
                Please login with your staff credentials to access appointments, orders, and customer information.
              </p>
            </div>
          </div>
          
          {/* Cột bên phải với form đăng nhập */}
          <div className="col-lg-6 form-column">
            <div className="card login-card">
              <div className="card-body p-4">
                <h2 className="text-center mb-4">Staff Sign In</h2>
                
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="btn btn-primary w-100 mb-3 sign-in-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing In...
                      </>
                    ) : 'Staff Sign In'}
                  </button>
                  
                  <div className="text-center">
                    <p className="register-text mb-3">
                      <Link to="/login" className="register-link">Go to Customer Login</Link>
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginPage;