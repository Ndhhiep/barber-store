const express = require('express');
const router = express.Router();
const { getAllBarbers, getBarberById } = require('../controllers/barberController');

// Get all barbers
router.get('/', getAllBarbers);

// Get barber by id
router.get('/:id', getBarberById);

module.exports = router;