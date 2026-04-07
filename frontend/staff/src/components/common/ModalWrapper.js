import React, { useEffect } from 'react';

/**
 * ModalWrapper — Bootstrap 5 modal container
 *
 * Props:
 *  isOpen    {boolean}
 *  title     {string}
 *  size      {'sm'|'md'|'lg'|'xl'}  - default 'lg'
 *  onClose   {() => void}
 *  children  {ReactNode}            - modal body content
 *  footer    {ReactNode}            - optional custom footer
 *  id        {string}               - optional id for aria
 */
const ModalWrapper = ({
  isOpen,
  title,
  size = 'lg',
  onClose,
  children,
  footer,
  id = 'staffModal',
}) => {
  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = size === 'md' ? '' : `modal-${size}`;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
      >
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${sizeClass}`}>
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header">
              <h5 className="modal-title" id={`${id}-title`}>
                {title}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              />
            </div>

            {/* Body */}
            <div className="modal-body">{children}</div>

            {/* Footer — rendered only when provided */}
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  );
};

export default ModalWrapper;
