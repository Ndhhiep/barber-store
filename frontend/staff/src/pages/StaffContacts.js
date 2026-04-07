import React, { useState, useEffect, useCallback } from 'react';
import staffContactService from '../services/staffContactService';
import { useNotifications } from '../context/NotificationContext';
import useSocketEvent from '../hooks/useSocketEvent';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import ModalWrapper from '../components/common/ModalWrapper';
import { formatDate, formatShortId } from '../utils/formatters';

const StaffContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const { clearContactNotifications, newContactIds, removeNewContactId } = useNotifications();
  const { currentPage, totalPages, handlePageChange, resetPage, getPageSlice, updateTotalPages } = usePagination(10);

  useEffect(() => {
    fetchContacts();
    clearContactNotifications();
  }, [clearContactNotifications]);

  // Real-time: new contact via socket
  useSocketEvent('newContact', useCallback((data) => {
    console.log('New contact received via socket:', data);
    if (data && data.contact) {
      setContacts(prev => [data.contact, ...prev]);
      resetPage();
    }
  }, [resetPage]));

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await staffContactService.getAllContacts();
      console.log('Response in component:', response);

      let list = [];
      if (response?.data?.contacts) list = response.data.contacts;
      else if (response?.contacts) list = response.contacts;
      else if (Array.isArray(response)) list = response;
      else {
        console.error('Unexpected API response structure:', response);
        setError('Contact data has an invalid format.');
      }
      setContacts(list);
      setError(null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Update totalPages when contacts change
  useEffect(() => {
    updateTotalPages(contacts.length);
  }, [contacts.length, updateTotalPages]);

  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
    if (newContactIds.has(contact._id)) {
      removeNewContactId(contact._id);
    }
    if (contact.status === 'new') {
      handleUpdateStatus(contact._id, 'read');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await staffContactService.updateContactStatus(id, status);
      setContacts(prev => prev.map(c => c._id === id ? { ...c, status } : c));
      if (selectedContact?._id === id) {
        setSelectedContact(prev => ({ ...prev, status }));
      }
    } catch (err) {
      console.error('Error updating contact status:', err);
      alert('Failed to update contact status. Please try again.');
    }
  };

  const currentContacts = getPageSlice(contacts);
  const indexOfFirst = (currentPage - 1) * 10;

  return (
    <div className="container mt-4">
      <h1>Contact Messages</h1>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="card mt-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <span>All Messages </span>
              {newContactIds.size > 0 && (
                <span className="badge bg-danger ms-2">{newContactIds.size} New</span>
              )}
            </div>
            <span className="text-muted small">
              {contacts.length > 0 ? (
                <>Showing {indexOfFirst + 1}-{Math.min(indexOfFirst + 10, contacts.length)} of {contacts.length} messages</>
              ) : 'No messages'}
            </span>
          </div>
          <div className="card-body">
            {contacts.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentContacts.map(contact => (
                      <tr key={contact._id} className={newContactIds.has(contact._id) ? 'table-warning' : ''}>
                        <td>
                          {formatShortId(contact._id)}
                          {newContactIds.has(contact._id) && (
                            <span className="badge bg-danger ms-2" style={{ padding: '0.25em 0.6em', fontWeight: 'bold' }}>NEW</span>
                          )}
                        </td>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone || 'N/A'}</td>
                        <td>{formatDate(contact.createdAt)}</td>
                        <td>
                          <StatusBadge status={contact.status || 'new'} type="contact" />
                        </td>
                        <td>
                          <button
                            className="btn btn-sm me-1"
                            style={{ backgroundColor: '#0DCAF0' }}
                            onClick={() => handleViewContact(contact)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            ) : (
              <EmptyState message="No contacts found." icon="bi-envelope-x" />
            )}
          </div>
        </div>
      )}

      {/* Contact Detail Modal */}
      <ModalWrapper
        isOpen={showModal && !!selectedContact}
        title="Contact Details"
        size="lg"
        onClose={() => setShowModal(false)}
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
        }
      >
        {selectedContact && (
          <>
            <div className="mb-3">
              {[
                ['Name', selectedContact.name],
                ['Email', selectedContact.email],
                ['Phone', selectedContact.phone || 'Not provided'],
                ['Date', formatDate(selectedContact.createdAt)],
              ].map(([label, value]) => (
                <div className="row mb-1" key={label}>
                  <div className="col-sm-2"><strong>{label}:</strong></div>
                  <div className="col-sm-10">{value}</div>
                </div>
              ))}
              <div className="row mb-0">
                <div className="col-sm-2"><strong>Status:</strong></div>
                <div className="col-sm-10">
                  <StatusBadge status={selectedContact.status || 'new'} type="contact" />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <p className="mb-1"><strong>Message:</strong></p>
              <div
                className="p-2 border rounded"
                style={{ whiteSpace: 'pre-wrap', minHeight: '100px', backgroundColor: '#f8f9fa' }}
              >
                {selectedContact.message}
              </div>
            </div>
          </>
        )}
      </ModalWrapper>
    </div>
  );
};

export default StaffContacts;
