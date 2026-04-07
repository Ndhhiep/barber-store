import React, { useState, useEffect, useCallback, useRef } from 'react';
import staffAppointmentService from '../services/staffAppointmentService';
import staffBarberService from '../services/staffBarberService';
import staffService from '../services/staffService';
import staffTimeSlotService from '../services/staffTimeSlotService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import normalizeBookingData from '../utils/bookingDataNormalizer';
import useSuccessMessage from '../hooks/useSuccessMessage';
import '../css/StaffAppointments.css';

import ErrorAlert from '../components/common/ErrorAlert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SuccessToast from '../components/common/SuccessToast';
import Pagination from '../components/common/Pagination';
import AppointmentFilters from '../components/appointments/AppointmentFilters';
import AppointmentTable from '../components/appointments/AppointmentTable';
import AppointmentDetailModal from '../components/appointments/AppointmentDetailModal';
import AppointmentEditModal from '../components/appointments/AppointmentEditModal';

// ─── Constants ─────────────────────────────────────────────────
const APPOINTMENTS_PER_PAGE = 10;

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00',
];

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  services: [],
  barberId: '',
  date: null,
  time: '',
  notes: '',
};

// ─── Helpers ──────────────────────────────────────────────────
const sortAppointments = (list) =>
  [...list].sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (da !== db) return db - da;
    const ta = new Date(`2000-01-01T${a.time}`);
    const tb = new Date(`2000-01-01T${b.time}`);
    return tb - ta;
  });

const calculateEndTime = (startTime, durationMinutes) => {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const end = h * 60 + m + durationMinutes;
  return `${Math.floor(end / 60).toString().padStart(2, '0')}:${(end % 60).toString().padStart(2, '0')}`;
};

// ─── Component ────────────────────────────────────────────────
const StaffAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [phoneSearchQuery, setPhoneSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail modal
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [showServiceSelector, setShowServiceSelector] = useState(false);

  // Form data
  const [availableServices, setAvailableServices] = useState([]);
  const [availableBarbers, setAvailableBarbers] = useState([]);

  // Time slots
  const [timeSlotStatuses, setTimeSlotStatuses] = useState([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);

  // Hooks
  const { message: toastMessage, showSuccess, clearMessage } = useSuccessMessage(3000);
  const [inlineError, setInlineError] = useState({ type: '', text: '' });
  const containerRef = useRef(null);
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();
  const { clearBookingNotifications, newBookingIds, removeNewBookingId } = useNotifications();

  // ── Derived values ──────────────────────────────────────────
  const calculateTotalDuration = useCallback((serviceIds) => {
    if (!serviceIds || serviceIds.length === 0) return 0;
    return serviceIds.reduce((total, id) => {
      const svc = availableServices.find(s => s._id === id);
      return total + (svc?.duration || 30);
    }, 0);
  }, [availableServices]);

  // ── Load services & barbers ──────────────────────────────────
  const loadFormData = useCallback(async () => {
    try {
      const [svcRes, barberRes] = await Promise.all([
        staffService.getAllServices(),
        staffBarberService.getAllBarbersForStaff(),
      ]);
      const services = svcRes?.services || svcRes?.data || svcRes || [];
      setAvailableServices(Array.isArray(services) ? services : []);

      let barbers = [];
      if (barberRes?.data?.barbers) barbers = barberRes.data.barbers;
      else if (barberRes?.barbers) barbers = barberRes.barbers;
      else if (Array.isArray(barberRes)) barbers = barberRes;
      setAvailableBarbers(barbers);
    } catch (err) {
      console.error('Error loading form data:', err);
    }
  }, []);

  useEffect(() => { loadFormData(); }, [loadFormData]);

  // ── Fetch appointments ───────────────────────────────────────
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      switch (activeFilter) {
        case 'today': response = await staffAppointmentService.getTodayAppointments(currentPage, APPOINTMENTS_PER_PAGE); break;
        case 'week':  response = await staffAppointmentService.getWeekAppointments(currentPage, APPOINTMENTS_PER_PAGE); break;
        default:      response = await staffAppointmentService.getAllAppointments(currentPage, APPOINTMENTS_PER_PAGE);
      }
      const sorted = sortAppointments(response.bookings || []);
      setAppointments(sorted);
      if (!phoneSearchQuery) setFilteredAppointments(sorted);
      if (response.totalPages) {
        setTotalPages(response.totalPages);
      } else if (response.totalCount) {
        setTotalPages(Math.ceil(response.totalCount / APPOINTMENTS_PER_PAGE));
      } else {
        setTotalPages(Math.max(1, Math.ceil(sorted.length / APPOINTMENTS_PER_PAGE)));
      }
      setError(null);
    } catch (err) {
      setError('Failed to load appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, currentPage, phoneSearchQuery]);

  useEffect(() => {
    if (activeFilter !== 'specific-date') fetchAppointments();
  }, [activeFilter, currentPage, fetchAppointments]);

  // ── Phone search effect ──────────────────────────────────────
  useEffect(() => {
    if (!appointments.length) return;
    if (activeFilter === 'specific-date') return;
    if (!phoneSearchQuery.trim()) { setFilteredAppointments(appointments); return; }
    const filtered = appointments.filter(a => {
      const phone = a.phone || a.userPhone || '';
      return phone.toLowerCase().includes(phoneSearchQuery.toLowerCase());
    });
    setFilteredAppointments(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE)));
  }, [phoneSearchQuery, appointments, activeFilter]);

  // ── Specific date filter ─────────────────────────────────────
  useEffect(() => {
    if (activeFilter === 'specific-date' && selectedDate && appointments.length > 0) {
      const sd = new Date(selectedDate);
      const filtered = appointments.filter(a => {
        const ad = new Date(a.date);
        return ad.getFullYear() === sd.getFullYear() &&
               ad.getMonth() === sd.getMonth() &&
               ad.getDate() === sd.getDate();
      });
      setFilteredAppointments(filtered);
      setTotalPages(Math.max(1, Math.ceil(filtered.length / APPOINTMENTS_PER_PAGE)));
    }
  }, [activeFilter, selectedDate, appointments]);

  // ── Notification cleanup ────────────────────────────────────
  useEffect(() => {
    clearBookingNotifications();
    const handleClick = (e) => {
      clearBookingNotifications();
      if (showDatePicker) {
        const els = document.querySelectorAll('.date-picker-dropdown, .date-filter button');
        let inside = false;
        els.forEach(el => { if (el.contains(e.target)) inside = true; });
        if (!inside) setShowDatePicker(false);
      }
    };
    const el = containerRef.current;
    if (el) el.addEventListener('click', handleClick);
    document.addEventListener('mousedown', handleClick);
    return () => {
      if (el) el.removeEventListener('click', handleClick);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [clearBookingNotifications, showDatePicker]);

  // ── Socket.IO ───────────────────────────────────────────────
  const handleNewBooking = useCallback(async (data) => {
    try {
      if (data.operationType === 'insert' && data.fullDocument) {
        const newBooking = normalizeBookingData(data.fullDocument);
        const today = new Date().toISOString().split('T')[0];
        const bookingDate = new Date(newBooking.date).toISOString().split('T')[0];
        const now = new Date();

        const shouldAdd = activeFilter === 'all' ||
          (activeFilter === 'today' && bookingDate === today) ||
          (activeFilter === 'week' && (() => {
            const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0,0,0,0);
            const weekEnd   = new Date(now); weekEnd.setDate(now.getDate() + (6 - now.getDay())); weekEnd.setHours(23,59,59,999);
            return new Date(newBooking.date) >= weekStart && new Date(newBooking.date) <= weekEnd;
          })());

        if (shouldAdd) {
          try {
            const res = await staffAppointmentService.getAppointmentById(newBooking._id);
            const complete = { ...newBooking, ...normalizeBookingData(res) };
            setAppointments(prev => sortAppointments([...prev, complete]));
          } catch {
            setAppointments(prev => sortAppointments([...prev, newBooking]));
          }
        }
      } else if (data.operationType === 'update' && data.documentId) {
        const updater = prev =>
          prev.map(a => a._id === data.documentId
            ? { ...a, ...(data.updateDescription?.updatedFields || {}) }
            : a);
        setAppointments(updater);
        setFilteredAppointments(updater);
      }
    } catch (err) {
      console.error('Error processing booking data:', err);
    }
  }, [activeFilter]);

  useEffect(() => {
    if (!isConnected) return;
    registerHandler('newBooking', handleNewBooking);
    return () => unregisterHandler('newBooking', handleNewBooking);
  }, [isConnected, registerHandler, unregisterHandler, handleNewBooking]);

  // ── Time slot checks ─────────────────────────────────────────
  const isTimeSlotDisabled = useCallback((timeSlot) => {
    if (formData.date && new Date(formData.date).toDateString() === new Date().toDateString()) {
      const now = new Date();
      const [h, m] = timeSlot.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (slotTime <= new Date(now.getTime() + 30 * 60000)) return true;
    }
    if (timeSlotStatuses.length === 0) return false;
    const slotStatus = timeSlotStatuses.find(s => s.start_time === timeSlot);
    if (!slotStatus || !slotStatus.isAvailable || slotStatus.isOccupied || slotStatus.isPast) return true;
    const totalDuration = calculateTotalDuration(formData.services);
    if (totalDuration === 0) return false;
    const slotsNeeded = Math.ceil(totalDuration / 30);
    const startIndex = timeSlotStatuses.findIndex(s => s.start_time === timeSlot);
    if (startIndex === -1 || startIndex + slotsNeeded > timeSlotStatuses.length) return true;
    for (let i = 0; i < slotsNeeded; i++) {
      const cur = timeSlotStatuses[startIndex + i];
      if (!cur || !cur.isAvailable || cur.isPast) return true;
    }
    return false;
  }, [formData.date, formData.services, timeSlotStatuses, calculateTotalDuration]);

  const getDisabledReason = useCallback((timeSlot) => {
    if (formData.date && new Date(formData.date).toDateString() === new Date().toDateString()) {
      const now = new Date();
      const [h, m] = timeSlot.split(':').map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
      if (slotTime <= new Date(now.getTime() + 30 * 60000)) return 'This time slot is in the past or too soon to book';
    }
    if (timeSlotStatuses.length === 0) return 'Time slot data not available';
    const slotStatus = timeSlotStatuses.find(s => s.start_time === timeSlot);
    if (!slotStatus) return 'Time slot not found';
    if (slotStatus.isPast) return 'This time slot is in the past';
    if (!slotStatus.isAvailable) return 'This time slot is already booked';
    const totalDuration = calculateTotalDuration(formData.services);
    if (totalDuration === 0) return '';
    const slotsNeeded = Math.ceil(totalDuration / 30);
    const startIndex = timeSlotStatuses.findIndex(s => s.start_time === timeSlot);
    if (startIndex === -1) return 'Time slot not found';
    if (startIndex + slotsNeeded > timeSlotStatuses.length) return 'Not enough remaining time in the day';
    for (let i = 0; i < slotsNeeded; i++) {
      const cur = timeSlotStatuses[startIndex + i];
      if (!cur) return `Required slot at ${calculateEndTime(timeSlot, i * 30)} not available`;
      if (cur.isPast) return `Required slot at ${cur.start_time} is in the past`;
      if (!cur.isAvailable) return `Required slot at ${cur.start_time} is already booked`;
    }
    return '';
  }, [formData.date, formData.services, timeSlotStatuses, calculateTotalDuration]);

  const handleTimeSelect = (time) => {
    const totalDuration = calculateTotalDuration(formData.services);
    if (totalDuration === 0) { setFormData(prev => ({ ...prev, time })); return; }
    if (!isTimeSlotDisabled(time)) {
      setFormData(prev => ({ ...prev, time }));
    } else {
      alert(`This time slot cannot be selected: ${getDisabledReason(time)}`);
    }
  };

  // ── Fetch time slot statuses ────────────────────────────────
  const fetchTimeSlotStatuses = useCallback(async () => {
    if (!formData.barberId || !formData.date) return;
    try {
      setIsLoadingTimeSlots(true);
      const formattedDate = formData.date.toISOString().split('T')[0];
      const statuses = await staffTimeSlotService.getTimeSlotStatus(
        formData.barberId, formattedDate, formData.services, selectedAppointment?._id
      );
      setTimeSlotStatuses(statuses);
      if (formData.time && isTimeSlotDisabled(formData.time)) {
        setFormData(prev => ({ ...prev, time: '' }));
      }
    } catch (err) {
      console.error('Error fetching time slot statuses:', err);
      setTimeSlotStatuses([]);
    } finally {
      setIsLoadingTimeSlots(false);
    }
  }, [formData.barberId, formData.date, formData.services, selectedAppointment]);

  useEffect(() => { fetchTimeSlotStatuses(); }, [fetchTimeSlotStatuses]);

  // Reset time if no longer available when services change
  useEffect(() => {
    if (formData.time && formData.barberId && formData.date) {
      if (isTimeSlotDisabled(formData.time)) {
        setFormData(prev => ({ ...prev, time: '' }));
      }
    }
  }, [formData.services]); // eslint-disable-line

  // ── Filter handlers ──────────────────────────────────────────
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1);
    if (filter !== 'specific-date') setSelectedDate(null);
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setActiveFilter('specific-date');
    setCurrentPage(1);
    setShowDatePicker(false);
  };

  const handlePhoneSearch = (query) => {
    setPhoneSearchQuery(query);
    setCurrentPage(1);
  };

  // ── View appointment ─────────────────────────────────────────
  const handleViewAppointment = async (appointment) => {
    try {
      let full = appointment;
      try {
        const res = await staffAppointmentService.getAppointmentById(appointment._id);
        full = res.booking || res;
      } catch {}
      const normalized = normalizeBookingData(full);
      if (newBookingIds.has(appointment._id)) removeNewBookingId(appointment._id);
      if (availableServices.length === 0) await loadFormData();
      setSelectedAppointment(normalized);
      document.body.classList.add('modal-open');
      setShowDetailModal(true);
    } catch (err) {
      setInlineError({ type: 'error', text: 'Failed to load appointment details' });
    }
  };

  const closeDetailModal = () => {
    document.body.classList.remove('modal-open');
    setShowDetailModal(false);
    setTimeout(() => setSelectedAppointment(null), 300);
  };

  // ── Status update ─────────────────────────────────────────────
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await staffAppointmentService.updateAppointmentStatus(id, newStatus);
      const updater = a => a._id === id ? { ...a, status: newStatus } : a;
      setAppointments(prev => prev.map(updater));
      setFilteredAppointments(prev => prev.map(updater));
      if (selectedAppointment?._id === id) {
        setSelectedAppointment(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update appointment status. Please try again.');
    }
  };

  // ── Edit appointment ─────────────────────────────────────────
  const handleEditAppointment = async (appointment) => {
    try {
      if (!availableServices.length || !availableBarbers.length) await loadFormData();
      let full = appointment;
      try {
        const res = await staffAppointmentService.getAppointmentById(appointment._id);
        full = res.booking || res;
      } catch {}
      const normalized = normalizeBookingData(full);
      setSelectedAppointment(normalized);
      setFormData(processAppointmentData(normalized, availableServices));
      setFormErrors({});
      setShowEditModal(true);
      document.body.classList.add('modal-open');
    } catch (err) {
      setInlineError({ type: 'error', text: 'Failed to load appointment data for editing' });
    }
  };

  const closeEditModal = () => {
    document.body.classList.remove('modal-open');
    setShowEditModal(false);
    setTimeout(() => {
      setSelectedAppointment(null);
      setFormData(EMPTY_FORM);
      setFormErrors({});
    }, 300);
  };

  // ── Form processing ──────────────────────────────────────────
  const processAppointmentData = (normalized, services) => {
    let selectedServices = [];
    if (normalized.service_id) {
      selectedServices = Array.isArray(normalized.service_id) ? normalized.service_id : [normalized.service_id];
    } else if (normalized.services && Array.isArray(normalized.services)) {
      selectedServices = normalized.services.map(s => {
        if (typeof s === 'object' && s?._id) return s._id;
        if (typeof s === 'string' && /^[0-9a-fA-F]{24}$/.test(s)) return s;
        if (typeof s === 'string') {
          const found = services.find(sv => sv._id === s || sv.name === s);
          return found ? found._id : s;
        }
        return s;
      }).filter(Boolean);
    } else if (normalized.serviceName && normalized.serviceName !== 'N/A') {
      selectedServices = normalized.serviceName.split(', ').map(name => {
        const found = services.find(s => s.name === name.trim());
        return found ? found._id : null;
      }).filter(Boolean);
    }

    let barberId = '';
    if (normalized.barber_id) {
      barberId = typeof normalized.barber_id === 'object' ? normalized.barber_id._id : normalized.barber_id;
    } else if (normalized.barberId) {
      barberId = normalized.barberId;
    }

    return {
      customerName: normalized.userName || normalized.name || '',
      customerPhone: normalized.userPhone || normalized.phone || '',
      customerEmail: normalized.userEmail || normalized.email || '',
      services: selectedServices,
      barberId,
      date: normalized.date ? new Date(normalized.date) : null,
      time: normalized.time || '',
      notes: normalized.notes || '',
    };
  };

  // ── Validate ─────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!formData.customerName.trim()) errors.customerName = 'Customer name is required';
    if (!formData.customerPhone.trim()) errors.customerPhone = 'Customer phone is required';
    else if (!/^\d{10,11}$/.test(formData.customerPhone.replace(/\D/g, ''))) errors.customerPhone = 'Phone number must be 10-11 digits';
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) errors.customerEmail = 'Invalid email format';
    if (formData.services.length === 0) errors.services = 'At least one service must be selected';
    if (!formData.date) errors.date = 'Date is required';
    if (!formData.time) errors.time = 'Time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const appointmentData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        services: formData.services.map(s => (typeof s === 'object' && s._id ? s._id : s)),
        barberId: formData.barberId || undefined,
        date: formData.date.toISOString().split('T')[0],
        time: formData.time,
        notes: formData.notes || undefined,
      };
      const res = await staffAppointmentService.updateAppointment(selectedAppointment._id, appointmentData);
      const updated = normalizeBookingData(res.booking || res);
      const updater = prev => prev.map(a => a._id === selectedAppointment._id ? updated : a);
      setAppointments(updater);
      setFilteredAppointments(updater);
      showSuccess('Appointment updated successfully!');
      closeEditModal();
    } catch (err) {
      setInlineError({ type: 'error', text: err.message || 'Failed to save appointment' });
    }
  };

  // ── Service management ───────────────────────────────────────
  const handleServiceAdd = (serviceId) => {
    if (!formData.services.includes(serviceId)) {
      setFormData(prev => ({ ...prev, services: [...prev.services, serviceId] }));
    }
    setShowServiceSelector(false);
  };

  const handleServiceRemove = (serviceId) => {
    setFormData(prev => ({ ...prev, services: prev.services.filter(id => id !== serviceId) }));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: null }));
  };

  // ─── Render ─────────────────────────────────────────────────
  const totalDuration = calculateTotalDuration(formData.services);

  return (
    <div className="container mt-4" ref={containerRef}>
      <h2>Manage Appointments</h2>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}
      {inlineError.text && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {inlineError.text}
          <button type="button" className="btn-close" onClick={() => setInlineError({ type: '', text: '' })}></button>
        </div>
      )}

      <div className="row mb-4 mt-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Appointments</span>
              <AppointmentFilters
                activeFilter={activeFilter}
                selectedDate={selectedDate}
                showDatePicker={showDatePicker}
                phoneSearchQuery={phoneSearchQuery}
                onFilterChange={handleFilterChange}
                onDateSelect={handleDateSelect}
                onPhoneSearch={handlePhoneSearch}
                onToggleDatePicker={() => setShowDatePicker(v => !v)}
                onClearDate={() => { setSelectedDate(null); handleFilterChange('all'); setShowDatePicker(false); }}
              />
            </div>

            <div className="card-body">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <AppointmentTable
                  appointments={filteredAppointments}
                  newBookingIds={newBookingIds}
                  phoneSearchQuery={phoneSearchQuery}
                  activeFilter={activeFilter}
                  selectedDate={selectedDate}
                  onView={handleViewAppointment}
                  onEdit={handleEditAppointment}
                />
              )}
            </div>

            {totalPages > 1 && (
              <div className="card-footer d-flex justify-content-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(page) => {
                    if (page >= 1 && page <= totalPages) setCurrentPage(page);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AppointmentDetailModal
        isOpen={showDetailModal}
        appointment={selectedAppointment}
        availableServices={availableServices}
        onClose={closeDetailModal}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Edit Modal */}
      <AppointmentEditModal
        isOpen={showEditModal}
        formData={formData}
        formErrors={formErrors}
        availableServices={availableServices}
        availableBarbers={availableBarbers}
        timeSlots={TIME_SLOTS}
        timeSlotStatuses={timeSlotStatuses}
        isLoadingTimeSlots={isLoadingTimeSlots}
        showServiceSelector={showServiceSelector}
        totalDuration={totalDuration}
        onClose={closeEditModal}
        onSubmit={handleFormSubmit}
        onFormChange={handleFormChange}
        onServiceAdd={handleServiceAdd}
        onServiceRemove={handleServiceRemove}
        onToggleServiceSelector={() => setShowServiceSelector(v => !v)}
        onTimeSelect={handleTimeSelect}
        isSlotDisabled={isTimeSlotDisabled}
        getDisabledReason={getDisabledReason}
        calculateEndTime={calculateEndTime}
      />

      <SuccessToast message={toastMessage} onClose={clearMessage} />
    </div>
  );
};

export default StaffAppointments;