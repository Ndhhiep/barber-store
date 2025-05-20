const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Route công khai để gửi contact form
router.post('/', contactController.createContact);

// Các route dành cho staff quản lý
router.use(protect);
router.use(restrictTo('staff', 'admin'));

router.get('/', contactController.getAllContacts);
router.get('/:id', contactController.getContactById);
router.patch('/:id', contactController.updateContactStatus);
router.delete('/:id', contactController.deleteContact);

module.exports = router;
