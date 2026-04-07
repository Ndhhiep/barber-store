import React from 'react';

/**
 * TimeSlotSelector — grid of time slot buttons with availability + duration range highlighting.
 *
 * Props:
 *   timeSlots          {string[]} - all possible slot strings ["09:00", ...]
 *   timeSlotStatuses   {Array}    - [{start_time, isAvailable, isOccupied, isPast}]
 *   selectedTime       {string}   - currently selected time slot
 *   selectedDate       {Date}
 *   barberId           {string}
 *   selectedServices   {string[]} - list of selected service IDs
 *   totalDuration      {number}   - total minutes of selected services
 *   isLoading          {boolean}
 *   formErrors         {{time?: string}}
 *   onTimeSelect       {Function} - (time: string) => void
 *   isSlotDisabled     {Function} - (time: string) => boolean
 *   getDisabledReason  {Function} - (time: string) => string
 *   calculateEndTime   {Function} - (startTime, durationMin) => string
 */
const TimeSlotSelector = ({
  timeSlots,
  timeSlotStatuses,
  selectedTime,
  selectedDate,
  barberId,
  totalDuration,
  isLoading,
  formErrors = {},
  onTimeSelect,
  isSlotDisabled,
  getDisabledReason,
  calculateEndTime,
}) => {
  if (!barberId) {
    return (
      <div className="text-center my-3">
        <i className="bi bi-person-badge text-muted me-2"></i>
        <span className="text-muted fw-medium">Please select a barber first</span>
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="text-center my-3">
        <i className="bi bi-calendar3 text-muted me-2"></i>
        <span className="text-muted fw-medium">Please select a date first</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center my-3">
        <div className="spinner-grow spinner-grow-sm text-primary me-2" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="text-primary fw-medium">Loading available time slots...</span>
      </div>
    );
  }

  const slots = timeSlotStatuses.length > 0
    ? timeSlotStatuses.map(s => s.start_time)
    : timeSlots;

  const endTime = selectedTime && totalDuration > 0
    ? calculateEndTime(selectedTime, totalDuration)
    : null;

  return (
    <>
      <div className="card time-slots-card border-0 no-hover-effect w-100">
        <div className="card-body py-3 px-2">
          <div className="time-slots-grid w-100">
            <div className="row g-2">
              {slots.map((time, index) => {
                const disabled = isSlotDisabled(time);
                const isSelected = selectedTime === time;

                // Range highlighting
                let isInSelectedRange = false;
                let isEndOfRange = false;
                if (selectedTime && totalDuration > 0 && endTime) {
                  const [ch, cm] = time.split(':').map(Number);
                  const currentMin = ch * 60 + cm;
                  const [sh, sm] = selectedTime.split(':').map(Number);
                  const selectedMin = sh * 60 + sm;
                  const [eh, em] = endTime.split(':').map(Number);
                  const endMin = eh * 60 + em;
                  const slotEndMin = currentMin + 30;

                  if (currentMin >= selectedMin && currentMin < endMin) {
                    isInSelectedRange = true;
                    if (slotEndMin >= endMin) isEndOfRange = true;
                  }
                }

                return (
                  <div key={index} className="col-4 col-sm-3 col-md-2">
                    <button
                      type="button"
                      className={`btn time-slot-btn w-100 position-relative${isSelected ? ' active' : ''}${disabled ? ' disabled' : ''}${isInSelectedRange && !isSelected ? ' selected-range' : ''}`}
                      onClick={() => !disabled && onTimeSelect(time)}
                      disabled={disabled}
                      title={
                        disabled
                          ? getDisabledReason(time)
                          : isInSelectedRange
                            ? `Part of this ${totalDuration}-minute appointment (${selectedTime} - ${endTime})`
                            : totalDuration > 0
                              ? `Click to book ${totalDuration}-minute appointment (${time} - ${calculateEndTime(time, totalDuration)})`
                              : 'Available time slot'
                      }
                    >
                      <i className={`bi bi-${disabled ? 'lock-fill' : isInSelectedRange ? 'check-circle-fill' : 'clock'} me-1 small`}></i>
                      {time}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {formErrors.time && <div className="text-danger mt-1">{formErrors.time}</div>}

      <div className="mt-2">
        <div className="help-text">
          {totalDuration > 0 && selectedTime && (
            <small className="text-success d-block mb-1">
              <i className="bi bi-check-circle me-1"></i>
              Selected time: {selectedTime} - {calculateEndTime(selectedTime, totalDuration)} ({totalDuration} minutes total)
            </small>
          )}
          <small className="d-flex align-items-center mb-1 text-muted">
            <i className="bi bi-clock-history me-1"></i> Past time slots or slots within 30 minutes are disabled
          </small>
          <small className="d-flex align-items-center mb-1 text-muted">
            <i className="bi bi-info-circle me-1"></i> Grayed out time slots are unavailable
          </small>
          {totalDuration === 0 && (
            <small className="d-flex align-items-center text-info">
              <i className="bi bi-lightbulb me-1"></i> Select services first to see available time slots
            </small>
          )}
        </div>
      </div>
    </>
  );
};

export default TimeSlotSelector;
