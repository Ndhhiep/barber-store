const authService = require('../services/authService');
const RegisterDTO = require('../dto/auth/RegisterDTO');
const LoginDTO = require('../dto/auth/LoginDTO');
const UpdateProfileDTO = require('../dto/auth/UpdateProfileDTO');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const _send = (res, statusCode, data) => res.status(statusCode).json({ status: 'success', ...data });
const _fail = (res, statusCode, message) => res.status(statusCode).json({ status: 'fail', message });
const _error = (res, error) => {
  const code = error.statusCode || 500;
  res.status(code).json({ status: code >= 500 ? 'error' : 'fail', message: error.message });
};

// Đăng ký
exports.register = async (req, res) => {
  try {
    const dto = new RegisterDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return _fail(res, 400, errors[0]);

    const { token, redirectPath, user } = await authService.register(dto);
    _send(res, 201, { token, redirectPath, data: { user } });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return _fail(res, 400, messages.join(', '));
    }
    _error(res, error);
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const dto = new LoginDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return _fail(res, 400, errors[0]);

    const { token, redirectPath, user } = await authService.login(dto);
    _send(res, 200, { token, redirectPath, data: { user } });
  } catch (error) {
    _error(res, error);
  }
};

// Middleware bảo vệ route
exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return _fail(res, 401, 'You are not logged in. Please log in to get access.');

    const currentUser = await authService.verifyAndGetUser(token);
    req.user = currentUser;
    next();
  } catch (error) {
    _fail(res, 401, 'Not authorized to access this resource');
  }
};

// Phân quyền theo role
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return _fail(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
};

// Lấy thông tin cá nhân
exports.getMe = async (req, res) => {
  try {
    _send(res, 200, { data: { user: req.user } });
  } catch (error) {
    _error(res, error);
  }
};

// Cập nhật mật khẩu
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { token, redirectPath, user } = await authService.updatePassword(req.user.id, currentPassword, newPassword);
    _send(res, 200, { token, redirectPath, data: { user } });
  } catch (error) {
    _error(res, error);
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const resetToken = await authService.forgotPassword(req.body.email);
    _send(res, 200, { message: 'Token sent to email', resetToken });
  } catch (error) {
    _error(res, error);
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { token, redirectPath, user } = await authService.resetPassword(req.params.token, req.body.password);
    _send(res, 200, { token, redirectPath, data: { user } });
  } catch (error) {
    _error(res, error);
  }
};

// Cập nhật hồ sơ
exports.updateProfile = async (req, res) => {
  try {
    const dto = new UpdateProfileDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return _fail(res, 400, errors[0]);

    const updatedUser = await authService.updateProfile(req.user.id, dto);
    _send(res, 200, { message: 'Profile updated successfully', data: { user: updatedUser } });
  } catch (error) {
    _error(res, error);
  }
};

// Lấy tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const result = await authService.getAllUsers(req.query);
    _send(res, 200, result);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to fetch users' });
  }
};