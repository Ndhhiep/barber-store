import React from 'react';

/**
 * EmptyState — displays a centered message when there is no data.
 *
 * Props:
 *   message  {string}  - Text to display (default: 'No data found.')
 *   icon     {string}  - Bootstrap icon class (e.g. 'bi-inbox')
 *   className {string} - Extra CSS classes on the wrapper
 */
const EmptyState = ({ message = 'No data found.', icon, className = '' }) => {
  return (
    <div className={`text-center py-5 text-muted ${className}`}>
      {icon && <i className={`bi ${icon} fs-1 mb-3 d-block`}></i>}
      <p className="mb-0">{message}</p>
    </div>
  );
};

export default EmptyState;
