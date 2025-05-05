const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes (require authentication)
router.use(authController.protect); // All routes after this middleware require authentication
router.get('/me', authController.getMe);
router.patch('/update-password', authController.updatePassword);

// Staff routes - GET all users list
router.get('/users', authController.restrictTo('admin', 'manager', 'barber', 'staff'), authController.getAllUsers);

module.exports = router;