import React, { useState, useEffect } from 'react';
import staffContactService from '../services/staffContactService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

const StaffContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Tích hợp Socket.IO
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();
  // Sử dụng context để theo dõi new contact IDs
  const { clearContactNotifications, newContactIds, removeNewContactId } = useNotifications();
    useEffect(() => {
    fetchContacts();
    // Reset navigation notification count but keep individual message badges
    clearContactNotifications();
  }, [clearContactNotifications]);
    // Xử lý sự kiện Socket.IO cho cập nhật thời gian thực
  useEffect(() => {
    if (!isConnected) return;    // Xử lý sự kiện liên hệ mới
    const handleNewContact = (data) => {
      console.log('New contact received via socket:', data);
      // Thêm liên hệ mới vào danh sách
      if (data && data.contact) {
        setContacts(prevContacts => [data.contact, ...prevContacts]);
        // Set to first page to show the new contact
        setCurrentPage(1);
        // Note: Badge management is handled by NotificationContext
        // New contacts will automatically get badges via the context
      }
    };
    
    // Đăng ký các handler của socket
    registerHandler('newContact', handleNewContact);
    
    // Dọn dẹp khi component unmount
    return () => {
      unregisterHandler('newContact', handleNewContact);
    };
  }, [isConnected, registerHandler, unregisterHandler]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await staffContactService.getAllContacts();
      console.log('Response in component:', response);
      
      // Kiểm tra cấu trúc dữ liệu và đặt contacts phù hợp
      if (response && response.data && response.data.contacts) {
        setContacts(response.data.contacts);
      } else if (response && response.contacts) {
        setContacts(response.contacts);
      } else if (Array.isArray(response)) {
        setContacts(response);
      } else {
        console.error('Unexpected API response structure:', response);
        setContacts([]);
        setError('Contact data has an invalid format.');
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts. Please try again later.');
    } finally {
      setLoading(false);
    }
  };  const handleViewContact = (contact) => {
    setSelectedContact(contact);
    setShowModal(true);
    
    // Xóa badge NEW chỉ cho liên hệ được click
    if (newContactIds.has(contact._id)) {
      // Use context method to remove badge only for this contact
      removeNewContactId(contact._id);
      
      // Giảm số lượng thông báo ở nút điều hướng nếu cần
      // Không xóa toàn bộ thông báo vì có thể còn các contacts khác chưa đọc
      // clearContactNotifications();
    }
    
    // Nếu trạng thái liên hệ là 'new', cập nhật thành 'read'
    if (contact.status === 'new') {
      handleUpdateStatus(contact._id, 'read');
    }
  };
  
  const handleUpdateStatus = async (id, status) => {
    try {
      await staffContactService.updateContactStatus(id, status);
      // Cập nhật state cục bộ để phản ánh sự thay đổi
      setContacts(contacts.map(contact => 
        contact._id === id ? { ...contact, status } : contact
      ));
      
      if (selectedContact && selectedContact._id === id) {
        setSelectedContact({ ...selectedContact, status });
      }
      
    } catch (err) {
      console.error('Error updating contact status:', err);
      alert('Failed to update contact status. Please try again.');
    }
  };
  
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
    const getStatusBadgeColor = (status) => {
    switch(status) {
      case 'new':
        return 'warning';
      case 'read':
        return 'info';
      case 'replied':
        return 'success';
      case 'archived':
        return 'secondary';
      default:
        return 'primary';
    }
  };
  
  // Pagination logic
  const indexOfLastContact = currentPage * itemsPerPage;
  const indexOfFirstContact = indexOfLastContact - itemsPerPage;
  const currentContacts = contacts.slice(indexOfFirstContact, indexOfLastContact);
  const totalPages = Math.ceil(contacts.length / itemsPerPage);
  
  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Previous page
  const goToPreviousPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
  };
  
  // Next page
  const goToNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  };

  return (
    <div className="container mt-4">
      <h1>Contact Messages</h1>
      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="text-center my-3">
          <div className="spinner-border" role="status"></div>
        </div>
      ) : (
        <div className="card mt-4">          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <span>All Messages </span>
              {/* Show the number of new contacts as a badge */}
              {newContactIds.size > 0 && (
                <span className="badge bg-danger ms-2">{newContactIds.size} New</span>
              )}
            </div>
            <span className="text-muted small">
              {contacts.length > 0 ? (
                <>Showing {indexOfFirstContact + 1}-{Math.min(indexOfLastContact, contacts.length)} of {contacts.length} messages</>
              ) : (
                'No messages'
              )}
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
                  </thead>                  <tbody>
                    {currentContacts.map(contact => (
                      <tr key={contact._id} className={newContactIds.has(contact._id) ? 'table-warning' : ''}>                        <td>{contact._id.slice(-6).toUpperCase()}
                          {newContactIds.has(contact._id) && (
                            <span className="badge bg-danger ms-2" style={{ padding: '0.25em 0.6em', fontWeight: 'bold' }}>NEW</span>
                          )}
                        </td>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone || 'N/A'}</td>
                        <td>{formatDate(contact.createdAt)}</td>
                        <td>
                          <span className={`badge bg-${getStatusBadgeColor(contact.status)}`}>
                            {contact.status ? contact.status.charAt(0).toUpperCase() + contact.status.slice(1) : 'New'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-sm btn-primary me-1" 
                              onClick={() => handleViewContact(contact)}
                            >
                             View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {contacts.length > itemsPerPage && (
                  <nav aria-label="Contact pagination" className="mt-4">
                    <ul className="pagination justify-content-center">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={goToPreviousPage}>
                          Previous
                        </button>
                      </li>
                      
                      {[...Array(totalPages).keys()].map(number => (
                        <li key={number + 1} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => paginate(number + 1)}
                          >
                            {number + 1}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={goToNextPage}>
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                )}
              </div>
            ) : (
              <p className="text-center">No contacts found.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Modal chi tiết liên hệ */}
      {selectedContact && (
        <div className={`modal fade ${showModal ? 'show' : ''}`} 
             style={{ display: showModal ? 'block' : 'none' }} 
             tabIndex="-1" 
             role="dialog"
             aria-hidden={!showModal}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Contact Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {/* Thông tin liên hệ - Bố cục đơn giản */}
                <div className="mb-3">
                  <div className="row mb-1">
                    <div className="col-sm-2"><strong>Name:</strong></div>
                    <div className="col-sm-10">{selectedContact.name}</div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-sm-2"><strong>Email:</strong></div>
                    <div className="col-sm-10">{selectedContact.email}</div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-sm-2"><strong>Phone:</strong></div>
                    <div className="col-sm-10">{selectedContact.phone || 'Not provided'}</div>
                  </div>
                  <div className="row mb-1">
                    <div className="col-sm-2"><strong>Date:</strong></div>
                    <div className="col-sm-10">{formatDate(selectedContact.createdAt)}</div>
                  </div>
                  <div className="row mb-0">
                    <div className="col-sm-2"><strong>Status:</strong></div>
                    <div className="col-sm-10">
                      <span className={`badge bg-${getStatusBadgeColor(selectedContact.status)}`}>
                        {selectedContact.status ? selectedContact.status.charAt(0).toUpperCase() + selectedContact.status.slice(1) : 'New'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Phần tin nhắn - Bố cục đơn giản có viền */}
                <div className="mb-3">
                  <p className="mb-1"><strong>Message:</strong></p>
                  <div 
                    className="p-2 border rounded" 
                    style={{ 
                      whiteSpace: 'pre-wrap', 
                      minHeight: '100px',
                      backgroundColor: '#f8f9fa'
                    }}
                  >
                    {selectedContact.message}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Lớp nền modal */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default StaffContacts;
