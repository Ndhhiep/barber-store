import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { login } from '../services/authService';
import '../css/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from query params or default to homepage
  const redirect = new URLSearchParams(location.search).get('redirect') || '';
  
  useEffect(() => {
    // Check if user is already logged in with a valid token and user data
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        // Make sure we have valid user data
        const userData = JSON.parse(userStr);
        if (userData && userData.role === 'user') {
          navigate(redirect ? `/${redirect}` : '/');
        }
      } catch (e) {
        // If user data is invalid, clear it out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate, redirect]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    })); 
  };
  
  const handleRememberMeChange = () => {
    setRememberMe(!rememberMe);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Use the authService login function
      await login(formData.email, formData.password);
      // Redirection is handled by the authService.login function
    } catch (error) {
      // Check for custom error messages
      if (error.message) {
        setError(error.message);
      } else {
        setError(
          error.response?.data?.message || 
          'Sai tài khoản hoặc mật khẩu. Vui lòng kiểm tra lại thông tin đăng nhập.'
        );
      }
      setIsLoading(false);
    }
  };
  
  return (
    <div className="login-page" style={{ backgroundImage: 'url(/assets/login_background.webp)' }}>
      <div className="login-overlay"></div>
      
      
      <div className="container login-container">
        <div className="row">
          {/* Left column with welcome text */}
          <div className="col-lg-6 welcome-column">
            <div className="welcome-content">
              <h1 className="welcome-title">Welcome to<br/>The Gentle</h1>
              <p className="welcome-text">
                Experience premium grooming services in a classic barbershop atmosphere. 
                Sign in to your account to book appointments, track your history, and enjoy a personalized experience.
              </p>
            </div>
          </div>
          
          {/* Right column with login form */}
          <div className="col-lg-6 form-column">
            <div className="card login-card">
              <div className="card-body p-4">
                <h2 className="text-center mb-4">Sign in</h2>
                
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
                  
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={handleRememberMeChange}
                      />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Remember Me
                      </label>
                    </div>
                    <Link to="/forgot-password" className="forgot-password-link">
                      Lost your password?
                    </Link>
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
                    ) : 'Sign in now'}
                  </button>
                  
                  <div className="text-center">
                    <p className="register-text mb-3">
                      Don't have an account? <Link to="/register" className="register-link">Register now</Link>
                    </p>
                  </div>
                  
                  <div className="text-center mt-4">
                    <p className="terms-text">
                      By clicking on "Sign in now" you agree to our<br/>
                      <Link to="/terms" className="terms-link">Terms of Service</Link> | <Link to="/privacy" className="terms-link">Privacy Policy</Link>
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

export default LoginPage;