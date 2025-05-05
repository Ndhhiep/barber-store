const Barber = require('../models/Barber');

/**
 * Get all active barbers
 * @route GET /api/barbers
 * @access Public
 */
const getAllBarbers = async (req, res) => {
  try {
    // Find all active barbers
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
 * Get a single barber by ID
 * @route GET /api/barbers/:id
 * @access Public
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

module.exports = {
  getAllBarbers,
  getBarberById
};