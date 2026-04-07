const barberService = require('../services/barberService');
const imageService = require('../services/imageService');
const CreateBarberDTO = require('../dto/barber/CreateBarberDTO');

const _error = (res, err) => {
  const code = err.statusCode || 500;
  res.status(code).json({ success: false, message: err.message, error: process.env.NODE_ENV === 'development' ? err.message : undefined });
};

// GET /api/barbers
const getAllBarbers = async (req, res) => {
  try {
    const data = await barberService.getAllBarbers(true);
    res.status(200).json({ success: true, data });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/barbers/staff
const getAllBarbersForStaff = async (req, res) => {
  try {
    const data = await barberService.getAllBarbers(false);
    res.status(200).json({ success: true, data });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/barbers/:id
const getBarberById = async (req, res) => {
  try {
    const barber = await barberService.getBarberById(req.params.id);
    res.status(200).json({ success: true, data: { barber } });
  } catch (error) {
    _error(res, error);
  }
};

// POST /api/barbers
const createBarber = async (req, res) => {
  try {
    const dto = new CreateBarberDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return res.status(400).json({ success: false, message: errors[0] });

    const saved = await barberService.createBarber(dto);
    res.status(201).json({ success: true, data: saved, message: 'Barber created successfully' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'A barber with this email already exists' });
    _error(res, error);
  }
};

// PUT /api/barbers/:id
const updateBarber = async (req, res) => {
  try {
    const updated = await barberService.updateBarber(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated, message: 'Barber updated successfully' });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'A barber with this email already exists' });
    _error(res, error);
  }
};

// DELETE /api/barbers/:id
const deleteBarber = async (req, res) => {
  try {
    await barberService.deleteBarber(req.params.id);
    res.status(200).json({ success: true, message: 'Barber deleted successfully' });
  } catch (error) {
    _error(res, error);
  }
};

// PATCH /api/barbers/:id/toggle-status
const toggleBarberStatus = async (req, res) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) return res.status(400).json({ success: false, message: 'is_active field is required' });
    const updated = await barberService.toggleBarberStatus(req.params.id, is_active);
    res.status(200).json({ success: true, data: updated, message: `Barber status updated to ${is_active ? 'active' : 'inactive'}` });
  } catch (error) {
    _error(res, error);
  }
};

// POST /api/barbers/upload-image
const uploadBarberImage = async (req, res) => {
  try {
    const { url, public_id } = await imageService.processUploadedImage(req.file);
    res.status(200).json({ success: true, data: { url, public_id }, message: 'Image uploaded successfully' });
  } catch (error) {
    _error(res, error);
  }
};

module.exports = { getAllBarbers, getAllBarbersForStaff, getBarberById, createBarber, updateBarber, deleteBarber, toggleBarberStatus, uploadBarberImage };