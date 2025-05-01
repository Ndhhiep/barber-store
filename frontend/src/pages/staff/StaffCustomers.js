import React, { useState, useEffect } from 'react';
import staffCustomerService from '../../services/staff_services/staffCustomerService';

const StaffCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  
  // Fetch customers when page loads or search/pagination changes
  useEffect(() => {
    fetchCustomers();
  }, [searchTerm, currentPage]);
  
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await staffCustomerService.getAllCustomers(searchTerm, currentPage, 10);
      setCustomers(response.users || []);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    fetchCustomers();
  };
  
  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  // View customer details
  const handleViewCustomer = async (id) => {
    try {
      const customer = await staffCustomerService.getCustomerById(id);
      setCustomerDetails(customer);
      
      // Fetch both bookings and orders for this customer
      const [bookings, orders] = await Promise.all([
        staffCustomerService.getCustomerBookings(id),
        staffCustomerService.getCustomerOrders(id)
      ]);
      
      setCustomerDetails({
        ...customer,
        bookings: bookings.bookings || [],
        orders: orders.orders || []
      });
      
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching customer details:', err);
      alert('Failed to load customer details. Please try again.');
    }
  };
  
  // Edit customer
  const handleEditCustomer = async (id) => {
    try {
      const customer = await staffCustomerService.getCustomerById(id);
      setCustomerDetails({
        ...customer,
        isEditing: true
      });
      setActiveTab('info');
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching customer for editing:', err);
      alert('Failed to load customer information for editing. Please try again.');
    }
  };
  
  // Save edited customer
  const handleSaveCustomer = async () => {
    try {
      const { _id, name, email, phone, address } = customerDetails;
      
      await staffCustomerService.updateCustomer(_id, {
        name,
        email,
        phone,
        address
      });
      
      // Refresh the customers list
      fetchCustomers();
      
      // Close the modal and reset state
      closeModal();
      alert('Customer information updated successfully!');
    } catch (err) {
      console.error('Error updating customer:', err);
      alert('Failed to update customer information. Please try again.');
    }
  };
  
  // Close modal and reset state
  const closeModal = () => {
    setIsModalOpen(false);
    setCustomerDetails(null);
    setActiveTab('info');
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      // Handle nested address field
      const addressField = name.split('.')[1];
      setCustomerDetails({
        ...customerDetails,
        address: {
          ...customerDetails.address,
          [addressField]: value
        }
      });
    } else {
      // Handle top-level field
      setCustomerDetails({
        ...customerDetails,
        [name]: value
      });
    }
  };
  
  // Format date to display in a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="container mt-4">
      <h2>Manage Customers</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="row mb-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Customers</span>
              <form className="input-group" style={{width: '300px'}} onSubmit={handleSearch}>
                <input 
                  type="text" 
                  className="form-control form-control-sm" 
                  placeholder="Search by name or email..." 
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
                <button className="btn btn-outline-secondary btn-sm" type="submit">Search</button>
              </form>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center my-3"><div className="spinner-border" role="status"></div></div>
              ) : customers.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Registered</th>
                        <th>Bookings</th>
                        <th>Orders</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map(customer => (
                        <tr key={customer._id}>
                          <td>#{customer._id.slice(-6).toUpperCase()}</td>
                          <td>{customer.name || 'N/A'}</td>
                          <td>{customer.email}</td>
                          <td>{customer.phone || 'N/A'}</td>
                          <td>{formatDate(customer.createdAt)}</td>
                          <td>{customer.bookingsCount || 0}</td>
                          <td>{customer.ordersCount || 0}</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-info me-1" 
                              onClick={() => handleViewCustomer(customer._id)}
                            >
                              View
                            </button>
                            <button 
                              className="btn btn-sm btn-primary me-1"
                              onClick={() => handleEditCustomer(customer._id)}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center">{searchTerm ? 'No customers found matching your search.' : 'No customers found.'}</p>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <nav>
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    
                    {[...Array(totalPages)].map((_, i) => (
                      <li 
                        key={i} 
                        className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button 
                          className="page-link" 
                          onClick={() => handlePageChange(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Customer Details Modal */}
      {isModalOpen && customerDetails && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {customerDetails.isEditing ? 'Edit Customer' : 'Customer Details'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                {/* Tabs for different sections */}
                <ul className="nav nav-tabs mb-3">
                  <li className="nav-item">
                    <button 
                      className={`nav-link ${activeTab === 'info' ? 'active' : ''}`}
                      onClick={() => setActiveTab('info')}
                    >
                      Personal Information
                    </button>
                  </li>
                  {!customerDetails.isEditing && (
                    <>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'bookings' ? 'active' : ''}`}
                          onClick={() => setActiveTab('bookings')}
                        >
                          Bookings
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                          onClick={() => setActiveTab('orders')}
                        >
                          Orders
                        </button>
                      </li>
                    </>
                  )}
                </ul>
                
                {/* Personal Information */}
                {activeTab === 'info' && (
                  <div>
                    {customerDetails.isEditing ? (
                      <form onSubmit={(e) => { e.preventDefault(); handleSaveCustomer(); }}>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="name" className="form-label">Full Name</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="name" 
                              name="name" 
                              value={customerDetails.name || ''} 
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="email" className="form-label">Email Address</label>
                            <input 
                              type="email" 
                              className="form-control" 
                              id="email" 
                              name="email" 
                              value={customerDetails.email || ''} 
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="phone" className="form-label">Phone Number</label>
                            <input 
                              type="tel" 
                              className="form-control" 
                              id="phone" 
                              name="phone" 
                              value={customerDetails.phone || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <h6 className="mt-3">Address Information</h6>
                        <div className="row">
                          <div className="col-md-12 mb-3">
                            <label htmlFor="address.street" className="form-label">Street Address</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="address.street" 
                              name="address.street" 
                              value={customerDetails.address?.street || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="address.city" className="form-label">City</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="address.city" 
                              name="address.city" 
                              value={customerDetails.address?.city || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="address.state" className="form-label">State/Province</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="address.state" 
                              name="address.state" 
                              value={customerDetails.address?.state || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label htmlFor="address.zipCode" className="form-label">Zip/Postal Code</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="address.zipCode" 
                              name="address.zipCode" 
                              value={customerDetails.address?.zipCode || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label htmlFor="address.country" className="form-label">Country</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              id="address.country" 
                              name="address.country" 
                              value={customerDetails.address?.country || ''} 
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="row">
                          <div className="col-md-6">
                            <h6>Personal Details</h6>
                            <p><strong>Name:</strong> {customerDetails.name || 'N/A'}</p>
                            <p><strong>Email:</strong> {customerDetails.email}</p>
                            <p><strong>Phone:</strong> {customerDetails.phone || 'N/A'}</p>
                            <p><strong>Member Since:</strong> {formatDate(customerDetails.createdAt)}</p>
                          </div>
                          <div className="col-md-6">
                            <h6>Address</h6>
                            {customerDetails.address ? (
                              <address>
                                {customerDetails.address.street && <p>{customerDetails.address.street}</p>}
                                {customerDetails.address.city && customerDetails.address.state && (
                                  <p>{customerDetails.address.city}, {customerDetails.address.state} {customerDetails.address.zipCode}</p>
                                )}
                                {customerDetails.address.country && <p>{customerDetails.address.country}</p>}
                              </address>
                            ) : (
                              <p>No address on file</p>
                            )}
                          </div>
                        </div>
                        <div className="row mt-3">
                          <div className="col-md-6">
                            <h6>Order Statistics</h6>
                            <p><strong>Total Orders:</strong> {customerDetails.orders?.length || 0}</p>
                            <p><strong>Total Spent:</strong> ${customerDetails.orders?.reduce((total, order) => total + (order.totalAmount || 0), 0).toFixed(2)}</p>
                          </div>
                          <div className="col-md-6">
                            <h6>Booking Statistics</h6>
                            <p><strong>Total Bookings:</strong> {customerDetails.bookings?.length || 0}</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                  <div>
                    <h6>Customer Bookings</h6>
                    {customerDetails.bookings?.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Booking ID</th>
                              <th>Service</th>
                              <th>Date</th>
                              <th>Time</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.bookings.map(booking => (
                              <tr key={booking._id}>
                                <td>#{booking._id.slice(-6).toUpperCase()}</td>
                                <td>{booking.serviceName}</td>
                                <td>{formatDate(booking.date)}</td>
                                <td>{booking.time}</td>
                                <td>
                                  <span className={`badge bg-${
                                    booking.status === 'pending' ? 'warning' : 
                                    booking.status === 'confirmed' ? 'success' : 
                                    booking.status === 'cancelled' ? 'danger' : 
                                    booking.status === 'completed' ? 'info' : 'secondary'
                                  }`}>
                                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>This customer has no bookings.</p>
                    )}
                  </div>
                )}
                
                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <div>
                    <h6>Customer Orders</h6>
                    {customerDetails.orders?.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Total</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {customerDetails.orders.map(order => (
                              <tr key={order._id}>
                                <td>#{order.orderNumber || order._id.slice(-6).toUpperCase()}</td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>${order.totalAmount?.toFixed(2)}</td>
                                <td>
                                  <span className={`badge bg-${
                                    order.status === 'processing' ? 'info' : 
                                    order.status === 'shipped' ? 'primary' : 
                                    order.status === 'delivered' ? 'success' : 
                                    order.status === 'cancelled' ? 'danger' : 'secondary'
                                  }`}>
                                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>This customer has no orders.</p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {customerDetails.isEditing ? (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={handleSaveCustomer}
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      type="button" 
                      className="btn btn-primary me-auto"
                      onClick={() => handleEditCustomer(customerDetails._id)}
                    >
                      Edit Customer
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={closeModal}
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </div>
      )}
    </div>
  );
};

export default StaffCustomers;