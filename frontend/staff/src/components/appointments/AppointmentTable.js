import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatShortId, formatTimeSlot } from '../../utils/formatters';

/**
 * AppointmentTable — renders the appointments table with NEW badge, status, and actions.
 *
 * Props:
 *   appointments    {Array}    - list of appointment objects
 *   newBookingIds   {Set}      - set of IDs to highlight as NEW
 *   phoneSearchQuery {string}
 *   activeFilter    {string}
 *   selectedDate    {Date}
 *   onView          {Function} - (appointment) => void
 *   onEdit          {Function} - (appointment) => void
 */
const AppointmentTable = ({
  appointments,
  newBookingIds,
  phoneSearchQuery,
  activeFilter,
  selectedDate,
  onView,
  onEdit,
}) => {
  if (appointments.length === 0) {
    let msg = 'No appointments found for the selected time period.';
    if (phoneSearchQuery) {
      msg = `No appointments found with phone number containing "${phoneSearchQuery}".`;
    } else if (activeFilter === 'specific-date') {
      const dateStr = selectedDate ? new Date(selectedDate).toLocaleDateString() : 'the selected date';
      msg = `No appointments found for ${dateStr}.`;
    }
    return <p className="text-center">{msg}</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Phone</th>
            <th>Date</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(appointment => (
            <tr key={appointment._id} className={newBookingIds.has(appointment._id) ? 'table-warning' : ''}>
              <td>
                {formatShortId(appointment._id)}
                {newBookingIds.has(appointment._id) && (
                  <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">NEW</span>
                )}
              </td>
              <td>{appointment.userName || 'N/A'}</td>
              <td>{appointment.phone || 'N/A'}</td>
              <td>{formatDate(appointment.date)}</td>
              <td>{formatTimeSlot(appointment.time)}</td>
              <td>
                <StatusBadge status={appointment.status} type="booking" />
              </td>
              <td>
                <button className="btn btn-sm btn-info me-2" onClick={() => onView(appointment)}>
                  View
                </button>
                <button
                  className={`btn btn-sm ${appointment.status === 'completed' || appointment.status === 'cancelled' ? 'btn-secondary' : 'btn-primary'}`}
                  onClick={() => onEdit(appointment)}
                  disabled={appointment.status === 'completed' || appointment.status === 'cancelled'}
                  title={
                    appointment.status === 'completed' || appointment.status === 'cancelled'
                      ? `Cannot edit ${appointment.status} appointment`
                      : 'Edit appointment'
                  }
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentTable;
