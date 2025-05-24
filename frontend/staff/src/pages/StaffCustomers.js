import React, { useState, useEffect, useCallback } from 'react';
import staffCustomerService from '../services/staffCustomerService';
import { useSocketContext } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';

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
  // Pagination states for bookings and orders
  const [bookingsPage, setBookingsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);  const ITEMS_PER_PAGE = 5;  // Tích hợp Socket.IO
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();
  const { clearCustomerNotifications, newCustomerIds, removeNewCustomerId } = useNotifications();

  // Định nghĩa hàm fetchCustomers trước khi sử dụng trong useEffect
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
  }, [searchTerm, currentPage]);

  // Lấy dữ liệu khách hàng khi trang tải hoặc khi tìm kiếm/đổi trang
  useEffect(() => {
    fetchCustomers();
    // Xóa thông báo khách hàng khi trang được tải
    clearCustomerNotifications();
  }, [searchTerm, currentPage, clearCustomerNotifications, fetchCustomers]);
    // Xử lý sự kiện khách hàng mới từ Socket.IO
  useEffect(() => {
    if (!isConnected) return;
    
    // Handler cho sự kiện khách hàng mới
    const handleNewCustomer = (data) => {
      console.log('New customer received via socket:', data);
      
      // Extract customer data - could be in data.user or data.customer
      const customerData = data.user || data.customer;
      
      if (!customerData || !customerData._id) {
        console.error('Invalid customer data received:', data);
        return;
      }
        // We'll use a different approach since we don't want to directly manipulate the Set
      // The customer is already being marked as new by NotificationContext's handleNewCustomer
      
      // If we're on the first page with no search filter, add to visible list
      if (currentPage === 1 && !searchTerm) {
        // Add to customer list
        setCustomers(prevCustomers => {
          // Thêm khách hàng mới vào đầu danh sách
          const newCustomers = [customerData, ...prevCustomers];
          // Nếu có nhiều hơn số lượng trang, loại bỏ khách hàng cuối cùng
          return newCustomers.length > 10 ? newCustomers.slice(0, 10) : newCustomers;
        });
      } else {
        // Nếu không ở trang đầu hoặc đang tìm kiếm, chỉ cập nhật log
        console.log('Khách hàng mới đã thêm nhưng không hiển thị do phân trang/tìm kiếm');
      }
    };
    
    // Đăng ký handler sự kiện khách hàng mới
    registerHandler('newCustomer', handleNewCustomer);
    
    // Dọn dẹp khi component unmount
    return () => {
      unregisterHandler('newCustomer', handleNewCustomer);
    };
  }, [isConnected, registerHandler, unregisterHandler, currentPage, searchTerm]);
  
  
  // Xử lý submit form tìm kiếm
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Đặt lại trang đầu khi tìm kiếm
    fetchCustomers();
  };
  
  // Xử lý thay đổi input tìm kiếm
  const handleSearchInputChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Xử lý chuyển trang phân trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
    // Hiển thị chi tiết khách hàng
  const handleViewCustomer = async (id) => {
    try {
      const customer = await staffCustomerService.getCustomerById(id);
      setCustomerDetails(customer);
      
      // Lấy cả bookings và orders cho khách hàng này
      const [bookings, orders] = await Promise.all([
        staffCustomerService.getCustomerBookings(id), // Hàm này nên được cập nhật để lọc theo user_id
        staffCustomerService.getCustomerOrders(id)
      ]);
      
      // Đảm bảo chỉ đặt bookings thuộc về khách hàng cụ thể này
      const customerBookings = Array.isArray(bookings.bookings) 
        ? bookings.bookings.filter(booking => booking.user_id === id || booking.userId === id)
        : [];
      
      setCustomerDetails({
        ...customer,
        bookings: customerBookings,
        orders: orders.orders || []
      });
      
      setIsModalOpen(true);        // Loại bỏ badge NEW nếu đã xem
      if (newCustomerIds.has(id)) {
        // Remove badge from this specific customer
        removeNewCustomerId(id);
        
        // If there are no more new customers, clear the notification in the nav button
        if (newCustomerIds.size <= 1) {
          clearCustomerNotifications();
        }
      }
      
      // Đánh dấu khách hàng đã xem (nếu cần)
      if (customer.isNew) {
        // Cập nhật state local để chỉ ra khách hàng này không còn mới
        setCustomers(prevCustomers => 
          prevCustomers.map(c => 
            c._id === id ? { ...c, isNew: false } : c
          )
        );
        
        // Bạn cũng có thể cập nhật điều này trên server nếu cần
        // await staffCustomerService.markCustomerAsViewed(id);
      }
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
    // Đóng modal chi tiết và reset state
  const closeModal = () => {
    setIsModalOpen(false);
    setCustomerDetails(null);
    setActiveTab('info');
    // Reset pagination for bookings and orders
    setBookingsPage(1);
    setOrdersPage(1);
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
  
  // Định dạng ngày để hiển thị dễ đọc
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="container mt-4">
      <h2>Manage Customers</h2>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="row mb-4 mt-4">
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
                      {customers.map(customer => (                        <tr key={customer._id} className={newCustomerIds.has(customer._id) ? 'table-warning' : ''}>
                          <td>
                            <div className="d-flex align-items-center">
                              {customer._id.slice(-6).toUpperCase()}
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
                          <td>{customer.ordersCount || 0}</td>                          <td>
                            <div className="d-flex gap-1">
                              <button 
                                className="btn btn-sm btn-info" 
                                onClick={() => handleViewCustomer(customer._id)}
                                title="View customer details"
                              >
                                View
                              </button>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => handleEditCustomer(customer._id)}
                                title="Edit customer"
                              >
                                Edit
                              </button>
                            </div>
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
        <>
          <div className="modal-backdrop fade show" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1040 }}></div>
          <div className="modal show d-block" tabIndex="-1" style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 2000, 
            overflow: 'auto', 
            display: 'flex', 
            alignItems: 'flex-start', 
            justifyContent: 'center',
            paddingTop: '80px'
          }}>
            <div className="modal-dialog modal-lg" style={{ 
              margin: '0 auto', 
              zIndex: 2010, 
              width: '100%', 
              maxWidth: '800px',
              position: 'relative'
            }}>              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className={`fas ${customerDetails.isEditing ? 'fa-user-edit' : 'fa-user'} me-2`}></i>
                    {customerDetails.isEditing ? 'Edit Customer' : 'Customer Details'}
                  </h5>
                  <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
                </div>                <div className="modal-body" style={{ height: '600px', overflowY: 'auto' }}>
                  {/* Tabs for different sections */}                {customerDetails.isEditing ? (
                    <div className="mb-4"></div>
                  ) : (
                    <ul className="nav nav-tabs nav-fill mb-4">
                      <li className="nav-item">                      
                        <button 
                          className={`nav-link ${activeTab === 'info' ? 'active text-primary' : ''}`}
                          onClick={() => setActiveTab('info')}
                        >
                          <i className="fas fa-user me-2"></i>Personal Information
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'bookings' ? 'active text-warning' : ''}`}
                          onClick={() => {
                            setActiveTab('bookings');
                            setBookingsPage(1);
                          }}
                        >
                          <i className="fas fa-calendar-alt me-2"></i>Bookings
                        </button>
                      </li>
                      <li className="nav-item">
                        <button 
                          className={`nav-link ${activeTab === 'orders' ? 'active text-success' : ''}`}
                          onClick={() => {
                            setActiveTab('orders');
                            setOrdersPage(1);
                          }}
                        >
                          <i className="fas fa-shopping-bag me-2"></i>Orders
                        </button>
                      </li>
                    </ul>
                  )}
                  
                  {/* Personal Information */}
                  {activeTab === 'info' && (
                    <div>
                      {customerDetails.isEditing ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveCustomer(); }}>
                          <div className="card border-left border-primary mb-4">
                            <div className="card-header bg-light">
                              <h6 className="mb-0 text-primary">
                                <i className="fas fa-user-edit me-2"></i>Personal Information
                              </h6>
                            </div>
                            <div className="card-body">
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
                              </div>                              <div className="row">
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
                            </div>
                          </div>
                          <div className="card border-left border-info mb-3">
                            <div className="card-header bg-light">
                              <h6 className="mb-0 text-info">
                                <i className="fas fa-map-marker-alt me-2"></i>Address Information
                              </h6>
                            </div>
                            <div className="card-body">
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
                            </div>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="row mb-4">
                            <div className="col-md-6">
                              <div className="card h-100 border-left border-primary">
                                <div className="card-header bg-light">
                                  <h6 className="mb-0 text-primary">
                                    <i className="fas fa-user me-2"></i>Personal Details
                                  </h6>
                                </div>                                <div className="card-body">
                                  <p><strong>Name:</strong> {customerDetails.name || 'N/A'}</p>
                                  <p><strong>Email:</strong> {customerDetails.email}</p>
                                  <p><strong>Phone:</strong> {customerDetails.phone || 'N/A'}</p>
                                  <p><strong>Member Since:</strong> {formatDate(customerDetails.createdAt)}</p>
                                  <p className="mt-2 text-success"><strong>Total Spent:</strong> ${customerDetails.orders?.reduce((total, order) => total + (order.totalAmount || 0), 0).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card h-100 border-left border-info">
                                <div className="card-header bg-light">
                                  <h6 className="mb-0 text-info">
                                    <i className="fas fa-map-marker-alt me-2"></i>Address
                                  </h6>
                                </div>
                                <div className="card-body">
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
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-6">
                              <div className="card h-100 border-left border-success">
                                <div className="card-header bg-light">
                                  <h6 className="mb-0 text-success">
                                    <i className="fas fa-shopping-cart me-2"></i>Order Statistics
                                  </h6>
                                </div>
                                <div className="card-body">
                                  <p><strong>Total Orders:</strong> {customerDetails.orders?.length || 0}</p>
                                  
                                </div>
                              </div>
                            </div>
                            <div className="col-md-6">
                              <div className="card h-100 border-left border-warning">
                                <div className="card-header bg-light">
                                  <h6 className="mb-0 text-warning">
                                    <i className="fas fa-calendar-check me-2"></i>Booking Statistics
                                  </h6>
                                </div>
                                <div className="card-body">
                                  <p><strong>Total Bookings:</strong> {customerDetails.bookings?.length || 0}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                    {/* Bookings Tab */}
                  {activeTab === 'bookings' && (
                    <div>
                      <div className="card border-left border-warning mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 text-warning">
                            <i className="fas fa-calendar-alt me-2"></i>Customer Bookings
                          </h6>
                        </div>
                        <div className="card-body">
                          {customerDetails.bookings?.length > 0 ? (
                            <>
                              <div className="table-responsive">
                                <table className="table table-sm table-hover">
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
                                    {customerDetails.bookings
                                      .slice(
                                        (bookingsPage - 1) * ITEMS_PER_PAGE,
                                        bookingsPage * ITEMS_PER_PAGE
                                      )
                                      .map(booking => (
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
                              {/* Bookings Pagination */}
                              {Math.ceil(customerDetails.bookings.length / ITEMS_PER_PAGE) > 1 && (
                                <nav aria-label="Bookings pagination" className="mt-3">
                                  <ul className="pagination pagination-sm justify-content-center">
                                    <li className={`page-item ${bookingsPage === 1 ? 'disabled' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => setBookingsPage(prev => Math.max(prev - 1, 1))}
                                        disabled={bookingsPage === 1}
                                      >
                                        <i className="fas fa-chevron-left"></i>
                                      </button>
                                    </li>
                                    
                                    {[...Array(Math.ceil(customerDetails.bookings.length / ITEMS_PER_PAGE))].map((_, i) => (
                                      <li 
                                        key={i} 
                                        className={`page-item ${bookingsPage === i + 1 ? 'active' : ''}`}
                                      >
                                        <button 
                                          className="page-link" 
                                          onClick={() => setBookingsPage(i + 1)}
                                        >
                                          {i + 1}
                                        </button>
                                      </li>
                                    ))}
                                    
                                    <li className={`page-item ${bookingsPage === Math.ceil(customerDetails.bookings.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => setBookingsPage(prev => Math.min(prev + 1, Math.ceil(customerDetails.bookings.length / ITEMS_PER_PAGE)))}
                                        disabled={bookingsPage === Math.ceil(customerDetails.bookings.length / ITEMS_PER_PAGE)}
                                      >
                                        <i className="fas fa-chevron-right"></i>
                                      </button>
                                    </li>
                                  </ul>
                                </nav>
                              )}
                            </>
                          ) : (
                            <p>This customer has no bookings.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                    {/* Orders Tab */}
                  {activeTab === 'orders' && (
                    <div>
                      <div className="card border-left border-success mb-3">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 text-success">
                            <i className="fas fa-shopping-bag me-2"></i>Customer Orders
                          </h6>
                        </div>
                        <div className="card-body">
                          {customerDetails.orders?.length > 0 ? (
                            <>
                              <div className="table-responsive">
                                <table className="table table-sm table-hover">
                                  <thead>
                                    <tr>
                                      <th>Order ID</th>
                                      <th>Date</th>
                                      <th>Total</th>
                                      <th>Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {customerDetails.orders
                                      .slice(
                                        (ordersPage - 1) * ITEMS_PER_PAGE,
                                        ordersPage * ITEMS_PER_PAGE
                                      )
                                      .map(order => (
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
                              {/* Orders Pagination */}
                              {Math.ceil(customerDetails.orders.length / ITEMS_PER_PAGE) > 1 && (
                                <nav aria-label="Orders pagination" className="mt-3">
                                  <ul className="pagination pagination-sm justify-content-center">
                                    <li className={`page-item ${ordersPage === 1 ? 'disabled' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => setOrdersPage(prev => Math.max(prev - 1, 1))}
                                        disabled={ordersPage === 1}
                                      >
                                        <i className="fas fa-chevron-left"></i>
                                      </button>
                                    </li>
                                    
                                    {[...Array(Math.ceil(customerDetails.orders.length / ITEMS_PER_PAGE))].map((_, i) => (
                                      <li 
                                        key={i} 
                                        className={`page-item ${ordersPage === i + 1 ? 'active' : ''}`}
                                      >
                                        <button 
                                          className="page-link" 
                                          onClick={() => setOrdersPage(i + 1)}
                                        >
                                          {i + 1}
                                        </button>
                                      </li>
                                    ))}
                                    
                                    <li className={`page-item ${ordersPage === Math.ceil(customerDetails.orders.length / ITEMS_PER_PAGE) ? 'disabled' : ''}`}>
                                      <button 
                                        className="page-link" 
                                        onClick={() => setOrdersPage(prev => Math.min(prev + 1, Math.ceil(customerDetails.orders.length / ITEMS_PER_PAGE)))}
                                        disabled={ordersPage === Math.ceil(customerDetails.orders.length / ITEMS_PER_PAGE)}
                                      >
                                        <i className="fas fa-chevron-right"></i>
                                      </button>
                                    </li>
                                  </ul>
                                </nav>
                              )}
                            </>
                          ) : (
                            <p>This customer has no orders.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>                <div className="modal-footer">
                  {customerDetails.isEditing ? (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={closeModal}
                      >
                        <i className="fas fa-times me-2"></i>Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-primary"
                        onClick={handleSaveCustomer}
                      >
                        <i className="fas fa-save me-2"></i>Save Changes
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        type="button" 
                        className="btn btn-outline-primary me-auto"
                        onClick={() => handleEditCustomer(customerDetails._id)}
                      >
                        <i className="fas fa-user-edit me-2"></i>Edit Customer
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={closeModal}
                      >
                        <i className="fas fa-times me-2"></i>Close
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StaffCustomers;