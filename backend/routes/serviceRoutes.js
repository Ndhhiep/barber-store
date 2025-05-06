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

// Public routes
router.get('/', getServices);
router.get('/:id', getServiceById);

// Protected routes - require admin/staff authentication
router.post('/', protect, restrictTo('admin', 'manager', 'barber', 'staff'), createService);
router.put('/:id', protect, restrictTo('admin', 'manager', 'barber', 'staff'), updateService);
router.delete('/:id', protect, restrictTo('admin', 'manager', 'barber', 'staff'), deleteService);

module.exports = router;