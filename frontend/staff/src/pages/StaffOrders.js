import React, { useState, useEffect, useCallback } from 'react';
import staffOrderService from '../services/staffOrderService';
import { useNotifications } from '../context/NotificationContext';
import useSocketEvent from '../hooks/useSocketEvent';
import usePagination from '../hooks/usePagination';
import Pagination from '../components/common/Pagination';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import { formatDate, formatShortId, formatCurrency } from '../utils/formatters';

const STATUS_OPTIONS = ['All Orders', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('All Orders');
  const [viewOrder, setViewOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchId, setSearchId] = useState('');

  const { clearOrderNotifications, newOrderIds, removeNewOrderId } = useNotifications();
  const { currentPage, totalPages, setCurrentPage, setTotalPages, handlePageChange } = usePagination(10);

  useEffect(() => { clearOrderNotifications(); }, [clearOrderNotifications]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = selectedFilter === 'All Orders' ? '' : selectedFilter.toLowerCase();
      const res = await staffOrderService.getAllOrders(statusParam, currentPage, 10);
      setOrders(res.data || []);
      const pages = res.totalPages ?? Math.ceil(res.total / 10) ?? 1;
      setTotalPages(pages);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter, currentPage, setTotalPages]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Socket events
  useSocketEvent('newOrder', useCallback((data) => {
    console.log('Received new order event:', data);
    if (data.operationType === 'insert' && data.fullDocument) {
      setOrders(prev => [data.fullDocument, ...prev]);
    } else if (data.operationType === 'update' && data.documentId) {
      setOrders(prev =>
        prev.map(order =>
          order._id === data.documentId
            ? { ...order, ...(data.updateDescription?.updatedFields || {}) }
            : order
        )
      );
    }
  }, []));

  useSocketEvent('newBooking', useCallback((data) => {
    console.log('Received new booking event:', data);
    if (data.operationType === 'insert' && data.fullDocument) {
      console.log('New booking received but not processed in StaffOrders');
    }
  }, []));

  const handleFilterChange = useCallback((e) => {
    setSelectedFilter(e.target.value);
    setCurrentPage(1);
  }, [setCurrentPage]);

  const handleStatusUpdate = useCallback(async (id, newStatus) => {
    try {
      await staffOrderService.updateOrderStatus(id, newStatus);
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
      setViewOrder(prev => prev?._id === id ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert(`Failed to update order status: ${err.message}. Please try again.`);
    }
  }, []);

  const handleViewOrder = useCallback(async (id) => {
    try {
      const response = await staffOrderService.getOrderById(id);
      const orderDetails = response.data || response;
      if (!orderDetails?._id) throw new Error('Invalid order data received');
      if (newOrderIds.has(id)) removeNewOrderId(id);
      setViewOrder(orderDetails);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      alert(`Failed to load order details: ${err.message}. Please try again.`);
    }
  }, [newOrderIds, removeNewOrderId]);

  const handleSearch = useCallback(async () => {
    const trimmed = searchId.trim();
    if (trimmed.length !== 6) return;
    setLoading(true);
    try {
      console.log('Searching with short ID:', trimmed);
      const response = await staffOrderService.searchOrders(trimmed);
      setOrders(response.success && response.data.length > 0 ? response.data : []);
      setTotalPages(1);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error searching order by ID:', err);
      setOrders([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [searchId, setTotalPages, setCurrentPage]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchId(val);
    const trimmed = val.trim();
    if (!trimmed) { setSearchId(''); fetchOrders(); }
    else if (trimmed.length === 6) handleSearch();
    else if (trimmed.length < 6 && searchId.trim().length >= 6) fetchOrders();
  };

  return (
    <div className="container mt-4">
      <h2>Manage Orders</h2>
      <div className="row mb-4 mt-4">
        <div className="col">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>All Orders</span>
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search by Order ID"
                  value={searchId}
                  style={{ width: '200px' }}
                  onChange={handleSearchChange}
                  onKeyDown={e => { if (e.key === 'Enter' && searchId.trim().length === 6) handleSearch(); }}
                />
                <select
                  className="form-select form-select-sm ms-3"
                  style={{ width: '150px' }}
                  value={selectedFilter}
                  onChange={handleFilterChange}
                >
                  {STATUS_OPTIONS.map((opt, i) => (
                    <option key={`filter-option-${i}`} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <LoadingSpinner />
              ) : orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order._id} className={newOrderIds.has(order._id) ? 'table-warning' : ''}>
                          <td>
                            {order.orderNumber || formatShortId(order._id)}
                            {newOrderIds.has(order._id) && (
                              <span className="badge bg-danger ms-2 animate__animated animate__fadeIn animate__pulse animate__infinite">NEW</span>
                            )}
                          </td>
                          <td>{order.customerInfo?.name || 'N/A'}</td>
                          <td>{formatDate(order.createdAt)}</td>
                          <td>{formatCurrency(order.totalAmount)}</td>
                          <td>
                            <StatusBadge status={order.status} type="order" />
                          </td>
                          <td>
                            <button className="btn btn-sm btn-info" onClick={() => handleViewOrder(order._id)}>
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No orders found for the selected filter." icon="bi-bag-x" />
              )}

              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          </div>
        </div>
      </div>

      <OrderDetailModal
        order={viewOrder}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setViewOrder(null); }}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default StaffOrders;