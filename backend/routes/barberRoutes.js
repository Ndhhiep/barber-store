const express = require('express');
const router = express.Router();
const { getAllBarbers, getAllBarbersForStaff, getBarberById, createBarber, updateBarber, deleteBarber, toggleBarberStatus } = require('../controllers/barberController');
const { protect, staffOnly } = require('../middleware/authMiddleware');

// Public routes
// Get all active barbers (public)
router.get('/', getAllBarbers);

// Staff routes (protected)
router.get('/staff', protect, staffOnly, getAllBarbersForStaff);

// CRUD operations for barbers (staff only)
router.post('/', protect, staffOnly, createBarber);
router.put('/:id', protect, staffOnly, updateBarber);
router.delete('/:id', protect, staffOnly, deleteBarber);

// Toggle barber active status (staff only)
router.patch('/:id/toggle-status', protect, staffOnly, toggleBarberStatus);

// Get barber by id (public) - Phải đặt sau các route có pattern cụ thể
router.get('/:id', getBarberById);

module.exports = router;