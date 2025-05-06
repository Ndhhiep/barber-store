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
 * Get all barbers for staff (both active and inactive)
 * @route GET /api/barbers/staff
 * @access Private (Staff only)
 */
const getAllBarbersForStaff = async (req, res) => {
  try {
    // Find all barbers regardless of active status
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

/**
 * Create a new barber
 * @route POST /api/barbers
 * @access Private (Staff only)
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

    // Validate required fields
    if (!name || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, phone, and email'
      });
    }

    // Create new barber with Cloudinary image URL
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

    // Save barber to database
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
 * Update a barber
 * @route PUT /api/barbers/:id
 * @access Private (Staff only)
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

    // Check if email already exists for a different barber
    if (email) {
      const existingBarber = await Barber.findOne({ email, _id: { $ne: req.params.id } });
      if (existingBarber) {
        return res.status(400).json({
          success: false,
          message: 'A barber with this email already exists'
        });
      }
    }

    // Build update object with Cloudinary image URL
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

    // Only update image URL if a new one is provided
    if (image_url) {
      updateData.imgURL = image_url;
    }

    // Find and update barber
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
 * Delete a barber
 * @route DELETE /api/barbers/:id
 * @access Private (Staff only)
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
 * Toggle barber active status
 * @route PATCH /api/barbers/:id/toggle-status
 * @access Private (Staff only)
 */
const toggleBarberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Validate input
    if (is_active === undefined) {
      return res.status(400).json({
        success: false,
        message: 'is_active field is required'
      });
    }

    // Find and update barber with the new status
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

module.exports = {
  getAllBarbers,
  getAllBarbersForStaff,
  getBarberById,
  createBarber,
  updateBarber,
  deleteBarber,
  toggleBarberStatus
};