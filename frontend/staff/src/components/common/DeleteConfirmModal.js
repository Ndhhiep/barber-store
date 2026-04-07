import React from 'react';

/**
 * DeleteConfirmModal — reusable delete confirmation dialog
 *
 * Props:
 *  isOpen      {boolean}
 *  entityName  {string}  - e.g. 'barber', 'product', 'service'
 *  displayId   {string}  - human-readable identifier shown in message
 *  isDeleting  {boolean}
 *  onConfirm   {() => void}
 *  onCancel    {() => void}
 */
const DeleteConfirmModal = ({
  isOpen,
  entityName = 'item',
  displayId = '',
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deleteConfirmTitle"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title fs-4" id="deleteConfirmTitle">
                Confirmation
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onCancel}
                aria-label="Close"
              />
            </div>

            <div className="modal-body pt-0">
              <p className="text-secondary">
                Are you sure you want to delete {entityName}{' '}
                {displayId && <span className="fw-bold">{displayId}</span>}? This
                action cannot be undone and you will be unable to recover any data.
              </p>
            </div>

            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-secondary"
                style={{ backgroundColor: '#CED4DA', borderColor: '#CED4DA', color: '#212529' }}
                onClick={onCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ backgroundColor: '#FA5252' }}
                onClick={onConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Deleting...
                  </>
                ) : (
                  'Yes, delete it!'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" />
    </>
  );
};

export default DeleteConfirmModal;
