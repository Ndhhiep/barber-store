const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Tất cả các route trong file này yêu cầu xác thực
router.use(authController.protect);

// GET /api/users - Lấy tất cả người dùng với phân trang (chỉ nhân viên)
router.get('/', authController.restrictTo('admin', 'manager', 'barber', 'staff'), authController.getAllUsers);

// GET /api/users/stats - Lấy thống kê khách hàng cho dashboard (chỉ nhân viên)
router.get('/stats', authController.restrictTo('admin', 'manager', 'barber', 'staff'), (req, res) => {
  // TODO: Triển khai tính năng thống kê người dùng
  res.status(200).json({
    status: 'success',
    data: {
      totalUsers: 0,
      newUsersThisMonth: 0,
      activeUsers: 0,
      // Dữ liệu mẫu
      userGrowth: [
        { month: 'Jan', users: 0 },
        { month: 'Feb', users: 0 },
        { month: 'Mar', users: 0 },
        { month: 'Apr', users: 0 },
        { month: 'May', users: 0 },
        { month: 'Jun', users: 0 }
      ]
    }
  });
});

// GET /api/users/:id - Lấy thông tin người dùng theo ID (chỉ nhân viên hoặc chính người dùng đó)
router.get('/:id', (req, res, next) => {
  // Cho phép truy cập nếu là nhân viên hoặc nếu người dùng đang yêu cầu chính thông tin của họ
  if (
    req.user.role === 'admin' || 
    req.user.role === 'manager' || 
    req.user.role === 'barber' || 
    req.user.role === 'staff' || 
    req.params.id === req.user._id.toString()
  ) {
    next();
  } else {
    res.status(403).json({
      status: 'fail',
      message: 'You do not have permission to access this user'
    });
  }
}, async (req, res) => {
  try {
    const { id } = req.params;
    const User = require('../models/User');
    
    const user = await User.findById(id).select('-password -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;