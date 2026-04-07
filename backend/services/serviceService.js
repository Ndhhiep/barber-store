const Service = require('../models/Service');

const getServices = async () => {
  return Service.find({}).sort({ name: 1 });
};

const getServiceById = async (id) => {
  const service = await Service.findById(id);
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  return service;
};

const createService = async (dto) => {
  const existing = await Service.findOne({ name: dto.name });
  if (existing) throw Object.assign(new Error('Service with this name already exists'), { statusCode: 400 });

  return Service.create({ name: dto.name, price: dto.price, description: dto.description, duration: dto.duration });
};

const updateService = async (id, body) => {
  const { name, price, description, duration, isActive } = body;
  const service = await Service.findById(id);
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });

  if (duration !== undefined && (duration < 15 || duration > 240)) {
    throw Object.assign(new Error('Duration must be between 15 and 240 minutes'), { statusCode: 400 });
  }
  if (name && name !== service.name) {
    const existing = await Service.findOne({ name });
    if (existing) throw Object.assign(new Error('Service with this name already exists'), { statusCode: 400 });
  }

  service.name = name || service.name;
  service.price = price !== undefined ? price : service.price;
  service.description = description || service.description;
  service.duration = duration !== undefined ? duration : service.duration;
  service.isActive = isActive !== undefined ? isActive : service.isActive;

  return service.save();
};

const deleteService = async (id) => {
  const service = await Service.findById(id);
  if (!service) throw Object.assign(new Error('Service not found'), { statusCode: 404 });
  await Service.deleteOne({ _id: id });
};

module.exports = { getServices, getServiceById, createService, updateService, deleteService };
