import React from 'react';

/**
 * ErrorAlert — dismissible Bootstrap danger alert
 *
 * Props:
 *  message    {string}        - error text; renders nothing when empty
 *  onDismiss  {() => void}    - optional dismiss handler
 *  className  {string}
 */
const ErrorAlert = ({ message, onDismiss, className = '' }) => {
  if (!message) return null;

  return (
    <div
      className={`alert alert-danger ${onDismiss ? 'alert-dismissible' : ''} fade show ${className}`}
      role="alert"
    >
      <i className="bi bi-exclamation-triangle-fill me-2" />
      {message}
      {onDismiss && (
        <button
          type="button"
          className="btn-close"
          onClick={onDismiss}
          aria-label="Dismiss error"
        />
      )}
    </div>
  );
};

export default ErrorAlert;
