const express = require('express');
const router = express.Router();
const { getAllBarbers, getAllBarbersForStaff, getBarberById, createBarber, updateBarber, deleteBarber, toggleBarberStatus, uploadBarberImage } = require('../controllers/barberController');
const { protect, staffOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Các route công khai
// Lấy tất cả barber đang hoạt động (công khai)
router.get('/', getAllBarbers);

// Các route dành cho nhân viên (yêu cầu xác thực)
router.get('/staff', protect, staffOnly, getAllBarbersForStaff);

// Các thao tác CRUD cho barber (chỉ nhân viên)
router.post('/', protect, staffOnly, createBarber);
router.put('/:id', protect, staffOnly, updateBarber);
router.delete('/:id', protect, staffOnly, deleteBarber);

// Tải ảnh barber lên (chỉ nhân viên)
router.post('/upload-image', protect, staffOnly, upload.single('image'), uploadBarberImage);

// Chuyển đổi trạng thái hoạt động của barber (chỉ nhân viên)
router.patch('/:id/toggle-status', protect, staffOnly, toggleBarberStatus);

// Lấy barber theo id (công khai) - Phải để sau các route có đường dẫn cụ thể
router.get('/:id', getBarberById);

module.exports = router;