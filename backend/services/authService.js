const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

// ─── JWT ─────────────────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

const verifyToken = async (token) => promisify(jwt.verify)(token, process.env.JWT_SECRET);

const buildTokenResponse = (user) => {
  const token = signToken(user._id);
  user.password = undefined;
  const redirectPath = user.role === 'staff' ? '/staff' : '/';
  return { token, redirectPath, user };
};

// ─── REGISTER ────────────────────────────────────────────────────────────────

const register = async (dto) => {
  const existing = await User.findOne({ email: dto.email });
  if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 400 });

  const userRole = dto.role === 'staff' ? 'staff' : 'user';
  const userData = { name: dto.name, email: dto.email, password: dto.password, role: userRole };
  if (dto.phone) userData.phone = dto.phone;

  const user = await User.create(userData);
  return buildTokenResponse(user);
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────

const login = async (dto) => {
  const user = await User.findOne({ email: dto.email }).select('+password');

  if (!user || !(await user.comparePassword(dto.password))) {
    throw Object.assign(new Error('Incorrect email or password'), { statusCode: 401 });
  }
  if (!user.isActive) {
    throw Object.assign(new Error('Your account has been deactivated. Please contact support.'), { statusCode: 401 });
  }

  return buildTokenResponse(user);
};

// ─── PROTECT MIDDLEWARE ──────────────────────────────────────────────────────

const verifyAndGetUser = async (token) => {
  const decoded = await verifyToken(token);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) throw Object.assign(new Error('The user belonging to this token no longer exists.'), { statusCode: 401 });
  if (!currentUser.isActive) throw Object.assign(new Error('Your account has been deactivated.'), { statusCode: 401 });

  return currentUser;
};

// ─── UPDATE PASSWORD ─────────────────────────────────────────────────────────

const updatePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw Object.assign(new Error('Your current password is wrong'), { statusCode: 401 });
  }
  user.password = newPassword;
  await user.save();
  return buildTokenResponse(user);
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────

const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw Object.assign(new Error('There is no user with that email address'), { statusCode: 404 });

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  return resetToken;
};

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw Object.assign(new Error('Token is invalid or has expired'), { statusCode: 400 });

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  return buildTokenResponse(user);
};

// ─── UPDATE PROFILE ──────────────────────────────────────────────────────────

const updateProfile = async (userId, dto) => {
  const updateData = dto.toUpdate();
  const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  }).select('-password -passwordResetToken -passwordResetExpires');

  if (!updatedUser) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return updatedUser;
};

// ─── GET ALL USERS ───────────────────────────────────────────────────────────

const getAllUsers = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = query.search || '';

  const filter = { role: 'user' };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const totalUsers = await User.countDocuments(filter);
  const users = await User.find(filter)
    .select('-password -passwordResetToken -passwordResetExpires')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    count: users.length,
    total: totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
    users,
  };
};

module.exports = {
  register,
  login,
  verifyAndGetUser,
  updatePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  getAllUsers,
  buildTokenResponse,
};
