const Contact = require('../models/Contact');

/**
 * Tạo một liên hệ mới
 * @route POST /api/contact
 * @access Public 
 */
exports.createContact = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Xác thực đầu vào
    if (!name || !email || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp tên, email và nội dung tin nhắn'
      });
    }

    // Tạo thông tin liên hệ mới
    const contactData = {
      name,
      email,
      phone,
      message,
      status: 'new'
    };

    // Nếu có user đã đăng nhập, lưu ID của user
    if (req.user && req.user._id) {
      contactData.userId = req.user._id;
    }

    const contact = await Contact.create(contactData);

    res.status(201).json({
      status: 'success',
      message: 'Gửi liên hệ thành công',
      data: {
        contact
      }
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi gửi liên hệ. Vui lòng thử lại sau.'
    });
  }
};

/**
 * Lấy tất cả các liên hệ (chỉ cho admin)
 * @route GET /api/contact
 * @access Private (Staff)
 */
exports.getAllContacts = async (req, res) => {
  try {
    // Có thể thêm phân trang, sắp xếp, lọc ở đây
    const contacts = await Contact.find()
      .sort({ createdAt: -1 }) // Sắp xếp theo thời gian giảm dần
      .populate('userId', 'name email phone'); // Populate thông tin user nếu có

    res.status(200).json({
      status: 'success',
      results: contacts.length,
      data: {
        contacts
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi lấy dữ liệu liên hệ'
    });
  }
};

/**
 * Lấy chi tiết một liên hệ theo ID
 * @route GET /api/contact/:id
 * @access Private (Staff)
 */
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('userId', 'name email phone');
    
    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy liên hệ với ID này'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        contact
      }
    });
  } catch (error) {
    console.error('Error fetching contact detail:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi lấy chi tiết liên hệ'
    });
  }
};

/**
 * Cập nhật trạng thái của một liên hệ
 * @route PATCH /api/contact/:id
 * @access Private (Staff)
 */
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Trạng thái không hợp lệ'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy liên hệ với ID này'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        contact
      }
    });
  } catch (error) {
    console.error('Error updating contact status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi cập nhật trạng thái liên hệ'
    });
  }
};

/**
 * Xóa một liên hệ
 * @route DELETE /api/contact/:id
 * @access Private (Staff)
 */
exports.deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy liên hệ với ID này'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Liên hệ đã được xóa thành công',
      data: null
    });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({
      status: 'error',
      message: 'Có lỗi xảy ra khi xóa liên hệ'
    });
  }
};
