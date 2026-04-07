const contactService = require('../services/contactService');
const CreateContactDTO = require('../dto/contact/CreateContactDTO');

const _error = (res, err) => {
  const code = err.statusCode || 500;
  res.status(code).json({ status: 'error', message: err.message });
};

// POST /api/contact
exports.createContact = async (req, res) => {
  try {
    const dto = new CreateContactDTO(req.body);
    const errors = dto.validate();
    if (errors.length > 0) return res.status(400).json({ status: 'error', message: errors[0] });

    const userId = req.user && req.user._id ? req.user._id : null;
    const contact = await contactService.createContact(dto, userId);
    res.status(201).json({ status: 'success', message: 'Gửi liên hệ thành công', data: { contact } });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/contact
exports.getAllContacts = async (req, res) => {
  try {
    const contacts = await contactService.getAllContacts();
    res.status(200).json({ status: 'success', results: contacts.length, data: { contacts } });
  } catch (error) {
    _error(res, error);
  }
};

// GET /api/contact/:id
exports.getContactById = async (req, res) => {
  try {
    const contact = await contactService.getContactById(req.params.id);
    res.status(200).json({ status: 'success', data: { contact } });
  } catch (error) {
    _error(res, error);
  }
};

// PATCH /api/contact/:id
exports.updateContactStatus = async (req, res) => {
  try {
    const contact = await contactService.updateContactStatus(req.params.id, req.body.status);
    res.status(200).json({ status: 'success', data: { contact } });
  } catch (error) {
    _error(res, error);
  }
};

// DELETE /api/contact/:id
exports.deleteContact = async (req, res) => {
  try {
    await contactService.deleteContact(req.params.id);
    res.status(200).json({ status: 'success', message: 'Liên hệ đã được xóa thành công', data: null });
  } catch (error) {
    _error(res, error);
  }
};
