const Barber = require('../models/Barber');

/**
 * Lấy tất cả các barber đang hoạt động
 * @route GET /api/barbers
 * @access Công khai
 */
const getAllBarbers = async (req, res) => {
  try {
    // Tìm tất cả barber đang hoạt động
    const barbers = await Barber.find({ is_active: true });
    
    return res.status(200).json({
      success: true,
      data: {
        barbers: barbers,
        count: barbers.length
      }
    });
  } catch (error) {
    console.error('Error fetching barbers:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching barbers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy tất cả barber cho nhân viên (cả đang hoạt động và không hoạt động)
 * @route GET /api/barbers/staff
 * @access Riêng tư (Chỉ nhân viên)
 */
const getAllBarbersForStaff = async (req, res) => {
  try {
    // Tìm tất cả barber bất kể trạng thái hoạt động
    const barbers = await Barber.find();
    
    return res.status(200).json({
      success: true,
      data: {
        barbers: barbers,
        count: barbers.length
      }
    });
  } catch (error) {
    console.error('Error fetching barbers for staff:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching barbers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Lấy barber theo ID
 * @route GET /api/barbers/:id
 * @access Công khai
 */
const getBarberById = async (req, res) => {
  try {
    const barber = await Barber.findById(req.params.id);
    
    if (!barber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        barber: barber
      }
    });
  } catch (error) {
    console.error('Error fetching barber:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching barber',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tạo barber mới
 * @route POST /api/barbers
 * @access Riêng tư (Chỉ nhân viên)
 */
const createBarber = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      description,
      specialization,
      image_url,
      is_active,
      workingDays,
      workingHours
    } = req.body;

    // Xác thực các trường bắt buộc
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, and email'
      });
    }

    // Tạo barber mới với URL hình ảnh từ Cloudinary
    const barber = new Barber({
      name,
      phone,
      email,
      description,
      specialization,
      imgURL: image_url, // Lưu URL hình ảnh từ Cloudinary
      is_active: is_active !== undefined ? is_active : true,
      workingDays,
      workingHours
    });

    // Lưu barber vào cơ sở dữ liệu
    const savedBarber = await barber.save();

    return res.status(201).json({
      success: true,
      data: savedBarber,
      message: 'Barber created successfully'
    });
  } catch (error) {
    console.error('Error creating barber:', error);
    
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A barber with this email already exists'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error creating barber',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cập nhật barber
 * @route PUT /api/barbers/:id
 * @access Riêng tư (Chỉ nhân viên)
 */
const updateBarber = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      description,
      specialization,
      image_url,
      is_active,
      workingDays,
      workingHours
    } = req.body;

    // Kiểm tra xem email đã tồn tại cho barber khác không
    if (email) {
      const existingBarber = await Barber.findOne({ email, _id: { $ne: req.params.id } });
      if (existingBarber) {
        return res.status(400).json({
          success: false,
          message: 'A barber with this email already exists'
        });
      }
    }

    // Xây dựng đối tượng cập nhật với URL hình ảnh từ Cloudinary
    const updateData = {
      name,
      phone,
      email,
      description,
      specialization,
      is_active,
      workingDays,
      workingHours
    };

    // Chỉ cập nhật URL hình ảnh nếu có URL mới
    if (image_url) {
      updateData.imgURL = image_url;
    }

    // Tìm và cập nhật barber
    const updatedBarber = await Barber.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedBarber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedBarber,
      message: 'Barber updated successfully'
    });
  } catch (error) {
    console.error('Error updating barber:', error);
    
    // Handle duplicate email error (this should be rare now with the pre-check above)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A barber with this email already exists'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error updating barber',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Xóa barber
 * @route DELETE /api/barbers/:id
 * @access Riêng tư (Chỉ nhân viên)
 */
const deleteBarber = async (req, res) => {
  try {
    const deletedBarber = await Barber.findByIdAndDelete(req.params.id);

    if (!deletedBarber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Barber deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting barber:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting barber',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Chuyển đổi trạng thái hoạt động barber
 * @route PATCH /api/barbers/:id/toggle-status
 * @access Riêng tư (Chỉ nhân viên)
 */
const toggleBarberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Xác thực đầu vào
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'is_active field is required'
      });
    }

    // Tìm và cập nhật barber với trạng thái mới
    const updatedBarber = await Barber.findByIdAndUpdate(
      id,
      { is_active: is_active },
      { new: true, runValidators: true }
    );

    if (!updatedBarber) {
      return res.status(404).json({
        success: false,
        message: 'Barber not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedBarber,
      message: `Barber status updated to ${is_active ? 'active' : 'inactive'}`
    });
  } catch (error) {
    console.error('Error toggling barber status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating barber status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Tải ảnh barber lên Cloudinary
 * @route POST /api/barbers/upload-image
 * @access Riêng tư (Chỉ nhân viên)
 */
const uploadBarberImage = async (req, res) => {
  try {
    console.log('Upload request received');
    
    // Nếu không có file được tải lên
    if (!req.file) {
      console.log('No file found in request');
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    console.log('File uploaded successfully:', req.file);
    
    // File đã được tải lên và xử lý bởi uploadMiddleware
    return res.status(200).json({
      success: true,
      data: {
        url: req.file.path, // Cloudinary URL
        public_id: req.file.filename // Cloudinary public ID for future reference/deletion
      },
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading barber image:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAllBarbers,
  getAllBarbersForStaff,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
  toggleBarberStatus,
  uploadBarberImage
};