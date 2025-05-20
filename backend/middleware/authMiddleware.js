const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');

// Middleware bảo vệ các route - xác thực token
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Lấy token từ header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // Xác thực token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Kiểm tra người dùng còn tồn tại hay không
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Kiểm tra user còn đang hoạt động hay không
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Cấp quyền truy cập vào route được bảo vệ
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this resource'
    });
  }
};

// Middleware kiểm tra xem người dùng có phải nhân viên không
const staffOnly = (req, res, next) => {
  if (req.user && req.user.role === 'staff') {
    next();
  } else {
    return res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to perform this action'
    });
  }
};

// Hàm hỗ trợ giới hạn cho các vai trò cụ thể
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

module.exports = { protect, staffOnly, restrictTo };