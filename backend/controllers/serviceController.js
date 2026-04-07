const serviceService = require('../services/serviceService');
const asyncHandler = require('express-async-handler');
const CreateServiceDTO = require('../dto/service/CreateServiceDTO');

const _error = (res, err) => {
  const code = err.statusCode || 500;
  res.status(code).json({ status: code >= 500 ? 'error' : 'fail', message: err.message });
};

// GET /api/services
const getServices = asyncHandler(async (req, res) => {
  try {
    const services = await serviceService.getServices();
    res.json({ status: 'success', count: services.length, data: services });
  } catch (error) {
    _error(res, error);
  }
});

// GET /api/services/:id
const getServiceById = asyncHandler(async (req, res) => {
  try {
    const service = await serviceService.getServiceById(req.params.id);
    res.json({ status: 'success', data: service });
  } catch (error) {
    _error(res, error);
  }
});

// POST /api/services
const createService = asyncHandler(async (req, res) => {
  try {
    const dto = new CreateServiceDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return res.status(400).json({ status: 'fail', message: errors[0] });

    const service = await serviceService.createService(dto);
    res.status(201).json({ status: 'success', data: service });
  } catch (error) {
    _error(res, error);
  }
});

// PUT /api/services/:id
const updateService = asyncHandler(async (req, res) => {
  try {
    const updated = await serviceService.updateService(req.params.id, req.body);
    res.json({ status: 'success', data: updated });
  } catch (error) {
    _error(res, error);
  }
});

// DELETE /api/services/:id
const deleteService = asyncHandler(async (req, res) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ status: 'success', message: 'Service deleted successfully' });
  } catch (error) {
    _error(res, error);
  }
});

module.exports = { getServices, getServiceById, createService, updateService, deleteService };