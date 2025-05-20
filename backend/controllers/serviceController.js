const Service = require('../models/Service');
const asyncHandler = require('express-async-handler');

// @desc    Lấy tất cả dịch vụ
// @route   GET /api/services
// @access  Công khai
const getServices = asyncHandler(async (req, res) => {
  try {
    const services = await Service.find({}).sort({ name: 1 });
    res.json({
      status: 'success',
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch services',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Lấy dịch vụ theo ID
// @route   GET /api/services/:id
// @access  Công khai
const getServiceById = asyncHandler(async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }
    
    res.json({
      status: 'success',
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Tạo dịch vụ mới
// @route   POST /api/services
// @access  Riêng tư/Admin/Staff
const createService = asyncHandler(async (req, res) => {
  try {
    const { name, price, description } = req.body;

    // Kiểm tra dịch vụ với tên này đã tồn tại
    const existingService = await Service.findOne({ name });
    if (existingService) {
      return res.status(400).json({
        status: 'fail',
        message: 'Service with this name already exists'
      });
    }

    const service = await Service.create({
      name,
      price,
      description
    });

    res.status(201).json({
      status: 'success',
      data: service
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Cập nhật dịch vụ
// @route   PUT /api/services/:id
// @access  Riêng tư/Admin/Staff
const updateService = asyncHandler(async (req, res) => {
  try {
    const { name, price, description, isActive } = req.body;
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }

    // Kiểm tra tên duy nhất nếu có thay đổi tên
    if (name && name !== service.name) {
      const existingService = await Service.findOne({ name });
      if (existingService) {
        return res.status(400).json({
          status: 'fail',
          message: 'Service with this name already exists'
        });
      }
    }

    service.name = name || service.name;
    service.price = price !== undefined ? price : service.price;
    service.description = description || service.description;
    service.isActive = isActive !== undefined ? isActive : service.isActive;

    const updatedService = await service.save();

    res.json({
      status: 'success',
      data: updatedService
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Xóa dịch vụ
// @route   DELETE /api/services/:id
// @access  Riêng tư/Admin/Staff
const deleteService = asyncHandler(async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        status: 'fail',
        message: 'Service not found'
      });
    }

    await Service.deleteOne({ _id: req.params.id });

    res.json({
      status: 'success',
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete service',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};