import React, { useState, useEffect, useCallback } from 'react';
import staffCustomerService from '../services/staffCustomerService';
import { useNotifications } from '../context/NotificationContext';
import useSocketEvent from '../hooks/useSocketEvent';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import EmptyState from '../components/common/EmptyState';
import CustomerDetailModal from '../components/customers/CustomerDetailModal';
import { formatDate, formatShortId } from '../utils/formatters';

const StaffCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerDetails, setCustomerDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { clearCustomerNotifications, newCustomerIds, removeNewCustomerId } = useNotifications();
  const { currentPage, totalPages, setCurrentPage, setTotalPages, handlePageChange } = usePagination(10);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffCustomerService.getAllCustomers(searchTerm, currentPage, 10);
      setCustomers(response.data || []);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage, setTotalPages]);

  useEffect(() => {
    fetchCustomers();
    clearCustomerNotifications();
  }, [searchTerm, currentPage, clearCustomerNotifications, fetchCustomers]);

  // Socket event: new customer
  useSocketEvent('newCustomer', useCallback((data) => {
    console.log('New customer received via socket:', data);
    const customerData = data.user || data.customer;
    if (!customerData?._id) { console.error('Invalid customer data received:', data); return; }

    if (currentPage === 1 && !searchTerm) {
      setCustomers(prev => {
        const updated = [customerData, ...prev];
        return updated.length > 10 ? updated.slice(0, 10) : updated;
      });
    } else {
      console.log('New customer added but not shown due to pagination/search');
    }
  }, [currentPage, searchTerm]));

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers();
  };

  const handleViewCustomer = async (id) => {
    try {
      const customer = await staffCustomerService.getCustomerById(id);
      const [bookings, orders] = await Promise.all([
        staffCustomerService.getCustomerBookings(id),
        staffCustomerService.getCustomerOrders(id)
      ]);

      const customerBookings = Array.isArray(bookings.bookings)
        ? bookings.bookings.filter(b => b.user_id === id || b.userId === id)
        : [];

      setCustomerDetails({ ...customer, bookings: customerBookings, orders: orders.orders || [] });
      setIsModalOpen(true);

      if (newCustomerIds.has(id)) {
        removeNewCustomerId(id);
        if (newCustomerIds.size <= 1) clearCustomerNotifications();
      }
      if (customer.isNew) {
        setCustomers(prev => prev.map(c => c._id === id ? { ...c, isNew: false } : c));
      }
    } catch (err) {
      console.error('Error fetching customer details:', err);
      alert('Failed to load customer details. Please try again.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCustomerDetails(null);
  };

  return (
    <div className="container mt-4">
      <h2>Manage Customers</h2>

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <div className="row mb-4 mt-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Customers</span>
              <form className="input-group" style={{ width: '300px' }} onSubmit={handleSearch}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-outline-secondary btn-sm" type="submit">Search</button>
              </form>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingSpinner />
              ) : customers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th><th>Name</th><th>Email</th><th>Phone</th>
                        <th>Registered</th><th>Bookings</th><th>Orders</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer._id} className={newCustomerIds.has(customer._id) ? 'table-warning' : ''}>
                          <td>
                            <div className="d-flex align-items-center">
                              {formatShortId(customer._id)}
                              {newCustomerIds.has(customer._id) && (
                                <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">
                                  <i className="fas fa-star me-1"></i>NEW
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{customer.name || 'N/A'}</td>
                          <td>{customer.email}</td>
                          <td>{customer.phone || 'N/A'}</td>
                          <td>{formatDate(customer.createdAt)}</td>
                          <td>{customer.bookingsCount || 0}</td>
                          <td>{customer.ordersCount || 0}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleViewCustomer(customer._id)}
                              title="View customer details"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  message={searchTerm ? 'No customers found matching your search.' : 'No customers found.'}
                  icon="bi-people"
                />
              )}

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          </div>
        </div>
      </div>

      <CustomerDetailModal
        customer={customerDetails}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default StaffCustomers;