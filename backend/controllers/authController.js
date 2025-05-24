const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

// Tạo JWT token
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// Gửi phản hồi token
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  // Loại bỏ mật khẩu khỏi dữ liệu
  user.password = undefined;

  // Xác định đường dẫn chuyển hướng dựa trên vai trò người dùng
  const redirectPath = user.role === 'staff' ? '/staff' : '/';

  res.status(statusCode).json({
    status: 'success',
    token,
    redirectPath,
    data: {
      user
    }
  });
};

// Đăng ký user
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Tăng cường xác thực
    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email and password'
      });
    }
    
    // Kiểm tra xem người dùng với email này đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already in use'
      });
    }

    // Vì lý do bảo mật, chỉ cho phép vai trò 'user' được đặt trực tiếp - vai trò admin phải được đặt thủ công
    const userRole = role === 'staff' ? 'staff' : 'user';
    
    // Tạo người dùng với tất cả các trường đã được xác thực
    const userData = {
      name,
      email,
      password,
      role: userRole
    };
    
    // Thêm số điện thoại nếu có
    if (phone) {
      userData.phone = phone;
    }
    
    // Tạo người dùng
    const user = await User.create(userData);

    createSendToken(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    
    // Gửi thông báo lỗi chi tiết hơn
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        status: 'fail',
        message: messages.join(', ')
      });
    }
    
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Đăng nhập người dùng
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra xem email và mật khẩu có tồn tại không
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Tìm người dùng theo email
    const user = await User.findOne({ email }).select('+password');

    // Kiểm tra xem người dùng có tồn tại và mật khẩu có đúng không
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // Kiểm tra xem người dùng có đang hoạt động không
    if (!user.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Bảo vệ các route - middleware
exports.protect = async (req, res, next) => {
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

    // Xác minh token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Kiểm tra xem người dùng vẫn còn tồn tại không
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Kiểm tra xem người dùng có đang hoạt động không
    if (!currentUser.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your account has been deactivated. Please contact support.'
      });
    }

    // Cấp quyền truy cập route được bảo vệ
    req.user = currentUser;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this resource'
    });
  }
};

// Hạn chế theo vai trò
exports.restrictTo = (...roles) => {
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

// Lấy thông tin người dùng hiện tại
exports.getMe = async (req, res) => {
  try {
    // req.user đã có sẵn từ middleware protect
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Cập nhật mật khẩu người dùng
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Lấy người dùng từ collection kèm trường mật khẩu
    const user = await User.findById(req.user.id).select('+password');
    
    // Kiểm tra xem mật khẩu hiện tại có đúng không
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Your current password is wrong'
      });
    }
    
    // Cập nhật mật khẩu
    user.password = newPassword;
    await user.save();
    
    // Đăng nhập người dùng, gửi JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  // 1) Lấy người dùng dựa trên email gửi lên
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({
      status: 'fail',
      message: 'There is no user with that email address'
    });
  }

  // 2) Tạo token đặt lại mật khẩu ngẫu nhiên
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Gửi token đến email người dùng
  try {
    // Trong ứng dụng thực, bạn sẽ gửi email chứa token
    // Trong ví dụ này, chúng tôi chỉ trả token trong phản hồi
    
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      resetToken // Trong sản phẩm, loại bỏ dòng này và gửi token qua email
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(500).json({
      status: 'error',
      message: 'There was an error sending the email. Try again later!'
    });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    // 1) Lấy người dùng dựa trên token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) Nếu token chưa hết hạn và có người dùng, đặt mật khẩu mới
    if (!user) {
      return res.status(400).json({
        status: 'fail',
        message: 'Token is invalid or has expired'
      });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Cập nhật thuộc tính changedPasswordAt cho người dùng
    // Điều này được xử lý tự động nếu sử dụng tùy chọn timestamps

    // 4) Đăng nhập người dùng, gửi JWT
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Cập nhật thông tin người dùng (trừ mật khẩu)
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    // Kiểm tra xem có dữ liệu cập nhật không
    if (!name && !phone) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide at least one field to update'
      });
    }
    
    // Chuẩn bị dữ liệu cập nhật
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    // Cập nhật thông tin người dùng (không cập nhật mật khẩu)
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpires');
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

// Lấy tất cả người dùng với phân trang và tìm kiếm - cho quyền truy cập nhân viên
exports.getAllUsers = async (req, res) => {
  try {
    // Trích xuất tham số phân trang và tìm kiếm từ query
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    
    // Tạo filter tìm kiếm nếu có từ khóa tìm kiếm
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Chỉ lấy người dùng thường (không bao gồm staff/admin...)
    filter.role = 'user';

    // Đếm tổng số người dùng khớp filter
    const totalUsers = await User.countDocuments(filter);
    
    // Tìm người dùng với phân trang
    const users = await User.find(filter)
      .select('-password -passwordResetToken -passwordResetExpires')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      count: users.length,
      total: totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      data: { users }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};