import React from 'react';

/**
 * SuccessToast — fixed-position toast notification (bottom-right)
 *
 * Props:
 *  message   {string}     - message to display; renders nothing when empty
 *  type      {'success'|'error'|'warning'|'info'}  - default 'success'
 *  onClose   {() => void}
 */
const SuccessToast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  const bgMap = {
    success: 'bg-success',
    error:   'bg-danger',
    warning: 'bg-warning text-dark',
    info:    'bg-info text-dark',
  };

  const titleMap = {
    success: 'Success',
    error:   'Error',
    warning: 'Warning',
    info:    'Info',
  };

  const bgClass = bgMap[type] || bgMap.success;
  const title   = titleMap[type] || 'Notice';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '320px',
        minWidth: '240px',
      }}
      className={`toast show ${bgClass} text-white`}
      role="alert"
      aria-live="polite"
    >
      <div className={`toast-header ${bgClass} text-white`}>
        <strong className="me-auto">{title}</strong>
        <button
          type="button"
          className="btn-close btn-close-white"
          onClick={onClose}
          aria-label="Close"
        />
      </div>
      <div className="toast-body">{message}</div>
    </div>
  );
};

export default SuccessToast;
