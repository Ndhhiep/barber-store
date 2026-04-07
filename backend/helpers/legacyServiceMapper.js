const mongoose = require('mongoose');
const Service = require('../models/Service');

/**
 * Chuyển đổi dữ liệu services trong booking từ legacy format (string) sang object format.
 * Hàm này là nguồn xử lý duy nhất — không lặp lại ở nhiều nơi.
 *
 * @param {Object} booking - Booking object (lean)
 * @returns {Object} booking với services đã được populate
 */
const populateLegacyServices = async (booking) => {
  const result = { ...booking };

  if (booking.services && Array.isArray(booking.services) && booking.services.length > 0) {
    const hasObjectIds = booking.services.some(
      (service) => mongoose.Types.ObjectId.isValid(service) && typeof service !== 'string'
    );

    if (hasObjectIds) {
      try {
        const serviceIds = booking.services.filter((s) => mongoose.Types.ObjectId.isValid(s));
        const populated = await Service.find({ _id: { $in: serviceIds } }).lean();
        result.services = populated;
        result.serviceName = populated.map((s) => s.name).join(', ');
        result.serviceNames = populated.map((s) => s.name);
      } catch (err) {
        result.serviceName = booking.services.join(', ');
        result.serviceNames = booking.services.map((s) => s.toString());
        result.services = booking.services.map((id) => ({
          _id: id,
          name: id.toString(),
          price: 0,
          duration: 30,
          description: 'Service ID',
        }));
      }
    } else {
      // Legacy: services là mảng string
      result.serviceName = booking.services.join(', ');
      result.serviceNames = booking.services;
      result.services = booking.services.map((name) => ({
        _id: null,
        name,
        price: 0,
        duration: 30,
        description: 'Legacy service',
      }));
    }
  } else if (booking.service && typeof booking.service === 'string') {
    // Legacy: trường service đơn lẻ (string)
    result.serviceName = booking.service;
    result.serviceNames = [booking.service];
    result.services = [
      {
        _id: null,
        name: booking.service,
        price: 0,
        duration: 30,
        description: 'Legacy service',
      },
    ];
  } else {
    result.serviceName = 'No services specified';
    result.serviceNames = [];
    result.services = [];
  }

  return result;
};

module.exports = { populateLegacyServices };
