const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email'
      ],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['user', 'staff'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    passwordResetToken: String,
    passwordResetExpires: Date
  },
  {
    timestamps: true // Tự động thêm các trường createdAt và updatedAt
  }
);

// Middleware trước khi lưu để băm mật khẩu
userSchema.pre('save', async function(next) {
  // Chỉ chạy hàm này nếu mật khẩu đã được chỉnh sửa
  if (!this.isModified('password')) return next();
  
  // Băm mật khẩu với độ phức tạp 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  
  next();
});

// Phương thức so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Phương thức tạo token đặt lại mật khẩu
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 phút

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;