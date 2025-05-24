const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Các route công khai
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Các route được bảo vệ (yêu cầu xác thực)
router.use(authController.protect); // Tất cả các route sau middleware này yêu cầu xác thực
router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);
router.put('/update-profile', authController.updateProfile);

// Các route dành cho staff - Lấy danh sách tất cả người dùng
router.get('/users', authController.restrictTo('admin', 'manager', 'barber', 'staff'), authController.getAllUsers);

module.exports = router;