import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Pagination from '../common/Pagination';
import EmptyState from '../common/EmptyState';
import { formatDate, formatCurrency, formatShortId } from '../../utils/formatters';

const ITEMS_PER_PAGE = 5;

/**
 * CustomerDetailModal — hiển thị chi tiết khách hàng với 3 tabs:
 * Info, Bookings, Orders. Có sub-pagination cho bookings và orders.
 */
const CustomerDetailModal = ({ customer, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [bookingsPage, setBookingsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);

  if (!isOpen || !customer) return null;

  const bookingsTotalPages = Math.ceil((customer.bookings?.length || 0) / ITEMS_PER_PAGE);
  const ordersTotalPages = Math.ceil((customer.orders?.length || 0) / ITEMS_PER_PAGE);

  const currentBookings = (customer.bookings || []).slice(
    (bookingsPage - 1) * ITEMS_PER_PAGE,
    bookingsPage * ITEMS_PER_PAGE
  );
  const currentOrders = (customer.orders || []).slice(
    (ordersPage - 1) * ITEMS_PER_PAGE,
    ordersPage * ITEMS_PER_PAGE
  );

  const totalSpent = (customer.orders || []).reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <>
      <div
        className="modal-backdrop fade show"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }}
      ></div>
      <div
        className="modal show d-block"
        tabIndex="-1"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 2000, overflow: 'auto', display: 'flex',
          alignItems: 'flex-start', justifyContent: 'center', paddingTop: '80px',
        }}
      >
        <div
          className="modal-dialog modal-lg"
          style={{ margin: '0 auto', zIndex: 2010, width: '100%', maxWidth: '800px', position: 'relative' }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-user me-2"></i>Customer Details
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>

            <div className="modal-body" style={{ height: '600px', overflowY: 'auto' }}>
              {/* Tabs */}
              <ul className="nav nav-tabs nav-fill mb-4">
                {[
                  { id: 'info', label: 'Personal Information', icon: 'fa-user', color: 'text-primary' },
                  { id: 'bookings', label: 'Bookings', icon: 'fa-calendar-alt', color: 'text-warning' },
                  { id: 'orders', label: 'Orders', icon: 'fa-shopping-bag', color: 'text-success' },
                ].map(tab => (
                  <li className="nav-item" key={tab.id}>
                    <button
                      className={`nav-link ${activeTab === tab.id ? `active ${tab.color}` : ''}`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === 'bookings') setBookingsPage(1);
                        if (tab.id === 'orders') setOrdersPage(1);
                      }}
                    >
                      <i className={`fas ${tab.icon} me-2`}></i>{tab.label}
                    </button>
                  </li>
                ))}
              </ul>

              {/* Info Tab */}
              {activeTab === 'info' && (
                <div>
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="card h-100 border-left border-primary">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 text-primary"><i className="fas fa-user me-2"></i>Personal Details</h6>
                        </div>
                        <div className="card-body">
                          <p><strong>Name:</strong> {customer.name || 'N/A'}</p>
                          <p><strong>Email:</strong> {customer.email}</p>
                          <p><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
                          <p><strong>Member Since:</strong> {formatDate(customer.createdAt)}</p>
                          <p className="mt-2 text-success"><strong>Total Spent:</strong> {formatCurrency(totalSpent)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card h-100 border-left border-info">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 text-info"><i className="fas fa-map-marker-alt me-2"></i>Address</h6>
                        </div>
                        <div className="card-body">
                          {customer.address ? (
                            <address>
                              {customer.address.street && <p>{customer.address.street}</p>}
                              {customer.address.city && customer.address.state && (
                                <p>{customer.address.city}, {customer.address.state} {customer.address.zipCode}</p>
                              )}
                              {customer.address.country && <p>{customer.address.country}</p>}
                            </address>
                          ) : <p>No address on file</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="card h-100 border-left border-success">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 text-success"><i className="fas fa-shopping-cart me-2"></i>Order Statistics</h6>
                        </div>
                        <div className="card-body">
                          <p><strong>Total Orders:</strong> {customer.orders?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="card h-100 border-left border-warning">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 text-warning"><i className="fas fa-calendar-check me-2"></i>Booking Statistics</h6>
                        </div>
                        <div className="card-body">
                          <p><strong>Total Bookings:</strong> {customer.bookings?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <div className="card border-left border-warning mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 text-warning"><i className="fas fa-calendar-alt me-2"></i>Customer Bookings</h6>
                  </div>
                  <div className="card-body">
                    {customer.bookings?.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover">
                            <thead>
                              <tr><th>Booking ID</th><th>Service</th><th>Date</th><th>Time</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {currentBookings.map(booking => (
                                <tr key={booking._id}>
                                  <td>{formatShortId(booking._id)}</td>
                                  <td>{booking.serviceName}</td>
                                  <td>{formatDate(booking.date)}</td>
                                  <td>{booking.time}</td>
                                  <td><StatusBadge status={booking.status} type="booking" /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <Pagination
                          currentPage={bookingsPage}
                          totalPages={bookingsTotalPages}
                          onPageChange={setBookingsPage}
                        />
                      </>
                    ) : (
                      <EmptyState message="This customer has no bookings." icon="bi-calendar-x" />
                    )}
                  </div>
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="card border-left border-success mb-3">
                  <div className="card-header bg-light">
                    <h6 className="mb-0 text-success"><i className="fas fa-shopping-bag me-2"></i>Customer Orders</h6>
                  </div>
                  <div className="card-body">
                    {customer.orders?.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="table table-sm table-hover">
                            <thead>
                              <tr><th>Order ID</th><th>Date</th><th>Total</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {currentOrders.map(order => (
                                <tr key={order._id}>
                                  <td>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                                  <td>{formatDate(order.createdAt)}</td>
                                  <td>{formatCurrency(order.totalAmount)}</td>
                                  <td><StatusBadge status={order.status} type="order" /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <Pagination
                          currentPage={ordersPage}
                          totalPages={ordersTotalPages}
                          onPageChange={setOrdersPage}
                        />
                      </>
                    ) : (
                      <EmptyState message="This customer has no orders." icon="bi-bag-x" />
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                <i className="fas fa-times me-2"></i>Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerDetailModal;
