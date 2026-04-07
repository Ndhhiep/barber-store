const Contact = require('../models/Contact');

const VALID_STATUSES = ['new', 'read', 'replied', 'archived'];

const createContact = async (dto, userId = null) => {
  const contactData = {
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    message: dto.message,
    status: 'new',
  };
  if (userId) contactData.userId = userId;
  return Contact.create(contactData);
};

const getAllContacts = async () => {
  return Contact.find().sort({ createdAt: -1 }).populate('userId', 'name email phone');
};

const getContactById = async (id) => {
  const contact = await Contact.findById(id).populate('userId', 'name email phone');
  if (!contact) throw Object.assign(new Error('Không tìm thấy liên hệ'), { statusCode: 404 });
  return contact;
};

const updateContactStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw Object.assign(new Error('Trạng thái không hợp lệ'), { statusCode: 400 });
  }
  const contact = await Contact.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!contact) throw Object.assign(new Error('Không tìm thấy liên hệ'), { statusCode: 404 });
  return contact;
};

const deleteContact = async (id) => {
  const contact = await Contact.findByIdAndDelete(id);
  if (!contact) throw Object.assign(new Error('Không tìm thấy liên hệ'), { statusCode: 404 });
};

module.exports = { createContact, getAllContacts, getContactById, updateContactStatus, deleteContact };
