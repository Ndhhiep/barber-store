const express = require('express');
const router = express.Router();
const { 
  getServices, 
  getServiceById, 
  createService, 
  updateService, 
  deleteService 
} = require('../controllers/serviceController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../controllers/authController');

// Các route công khai
router.get('/', getServices);
router.get('/:id', getServiceById);

// Các route được bảo vệ - yêu cầu xác thực admin/staff
router.post('/', protect, restrictTo('admin', 'manager', 'barber', 'staff'), createService);
router.put('/:id', protect, restrictTo('admin', 'manager', 'barber', 'staff'), updateService);
router.delete('/:id', protect, restrictTo('admin', 'manager', 'barber', 'staff'), deleteService);

module.exports = router;