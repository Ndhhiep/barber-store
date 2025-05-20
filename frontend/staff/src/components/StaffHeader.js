import React from 'react';
import { useNavigate } from 'react-router-dom';
import staffAuthService from '../services/staffAuthService';
// Đảm bảo đã import Bootstrap Icons nếu chưa được import toàn cục
// import 'bootstrap-icons/font/bootstrap-icons.css';

const StaffHeader = () => {
  const staffUser = staffAuthService.getStaffUser();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    staffAuthService.staffLogout();
    navigate('/login');
  };
  
  // Lấy chữ cái viết tắt của user cho avatar
  const getUserInitials = () => {
    const name = staffUser?.user?.name || 'Staff User';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return nameParts[0].substring(0, 2).toUpperCase();
  };  
  return (
    <header className="staff-top-header">
      <div className="container-fluid">
        <div className="header-content d-flex justify-content-end align-items-center w-100">
          {/* Hành động của user - căn phải */}
          <div className="user-actions d-flex align-items-center">
            {/* Avatar của user */}
            <div className="user-avatar me-3" title={staffUser?.user?.name || 'Staff User'}>
              {getUserInitials()}
            </div>
            
            {/* Nút đăng xuất sử dụng Google Material Icons */}
            <div>
              <button 
                className="btn btn-link p-0" 
                title="Logout from system" 
                onClick={handleLogout}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  transition: 'all 0.2s ease-in-out',
                  color: '#2c3347',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1.8rem',color: '#2c3347' }}>
                  logout
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;