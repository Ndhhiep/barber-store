import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * AppointmentFilters — filter bar (All / Today / Week + date picker + phone search)
 *
 * Props:
 *   activeFilter     {string}   - 'all' | 'today' | 'week' | 'specific-date'
 *   selectedDate     {Date}     - currently selected specific date
 *   showDatePicker   {boolean}
 *   phoneSearchQuery {string}
 *   onFilterChange   {Function} - (filter: string) => void
 *   onDateSelect     {Function} - (date: Date) => void
 *   onPhoneSearch    {Function} - (query: string) => void
 *   onToggleDatePicker {Function} - () => void
 *   onClearDate      {Function} - () => void
 */
const AppointmentFilters = ({
  activeFilter,
  selectedDate,
  showDatePicker,
  phoneSearchQuery,
  onFilterChange,
  onDateSelect,
  onPhoneSearch,
  onToggleDatePicker,
  onClearDate,
}) => {
  return (
    <div className="d-flex align-items-center">
      {/* Phone Search */}
      <div className="input-group me-2" style={{ maxWidth: '250px' }}>
        <input
          type="text"
          className="form-control form-control-sm"
          placeholder="Search by phone..."
          id="phoneSearchInput"
          value={phoneSearchQuery}
          onChange={(e) => onPhoneSearch(e.target.value)}
        />
        <button className="btn btn-sm btn-outline-secondary" type="button">
          <i className="bi bi-search"></i>
        </button>
      </div>

      {/* Date Picker Toggle */}
      <div className="date-filter position-relative">
        <button
          className={`btn btn-sm ${activeFilter === 'specific-date' ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={onToggleDatePicker}
          title="Filter by date"
        >
          <i className="bi bi-calendar3"></i>
        </button>

        {showDatePicker && (
          <div
            className="position-absolute bg-white shadow rounded p-2 mt-1 date-picker-dropdown"
            style={{ zIndex: 1000, right: 0 }}
          >
            <DatePicker
              selected={selectedDate}
              onChange={onDateSelect}
              inline
              calendarClassName="custom-calendar-style"
              todayButton="Today"
            />
            <div className="d-flex mt-2 justify-content-between">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={onClearDate}
                title="Clear filter"
              >
                Clear
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={onToggleDatePicker}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentFilters;
