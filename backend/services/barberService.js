const Barber = require('../models/Barber');

const getAllBarbers = async (activeOnly = true) => {
  const filter = activeOnly ? { is_active: true } : {};
  const barbers = await Barber.find(filter);
  return { barbers, count: barbers.length };
};

const getBarberById = async (id) => {
  const barber = await Barber.findById(id);
  if (!barber) throw Object.assign(new Error('Barber not found'), { statusCode: 404 });
  return barber;
};

const createBarber = async (dto) => {
  const barber = new Barber({
    name: dto.name,
    phone: dto.phone,
    email: dto.email,
    description: dto.description,
    specialization: dto.specialization,
    imgURL: dto.image_url,
    is_active: dto.is_active,
    workingDays: dto.workingDays,
    workingHours: dto.workingHours,
  });
  return barber.save();
};

const updateBarber = async (id, dto) => {
  if (dto.email) {
    const existing = await Barber.findOne({ email: dto.email, _id: { $ne: id } });
    if (existing) throw Object.assign(new Error('A barber with this email already exists'), { statusCode: 400 });
  }

  const updateData = {
    name: dto.name,
    phone: dto.phone,
    email: dto.email,
    description: dto.description,
    specialization: dto.specialization,
    is_active: dto.is_active,
    workingDays: dto.workingDays,
    workingHours: dto.workingHours,
  };
  if (dto.image_url) updateData.imgURL = dto.image_url;

  const updated = await Barber.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  if (!updated) throw Object.assign(new Error('Barber not found'), { statusCode: 404 });
  return updated;
};

const deleteBarber = async (id) => {
  const deleted = await Barber.findByIdAndDelete(id);
  if (!deleted) throw Object.assign(new Error('Barber not found'), { statusCode: 404 });
};

const toggleBarberStatus = async (id, is_active) => {
  const updated = await Barber.findByIdAndUpdate(id, { is_active }, { new: true, runValidators: true });
  if (!updated) throw Object.assign(new Error('Barber not found'), { statusCode: 404 });
  return updated;
};

module.exports = { getAllBarbers, getBarberById, createBarber, updateBarber, deleteBarber, toggleBarberStatus };
