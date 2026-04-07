import React from 'react';

/**
 * LoadingSpinner — centered Bootstrap spinner
 *
 * Props:
 *  className  {string}  - optional extra wrapper class
 *  size       {'sm'|'md'}  - default 'md'
 *  text       {string}  - optional label below spinner
 */
const LoadingSpinner = ({ className = '', size = 'md', text = 'Loading...' }) => {
  const spinnerClass = size === 'sm' ? 'spinner-border-sm' : '';

  return (
    <div className={`text-center py-4 ${className}`}>
      <div
        className={`spinner-border text-primary ${spinnerClass}`}
        role="status"
        aria-label={text}
      >
        <span className="visually-hidden">{text}</span>
      </div>
      {text && <p className="mt-2 text-muted small">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
