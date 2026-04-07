import React from 'react';
import StatusBadge from '../common/StatusBadge';
import { formatDate, formatCurrency } from '../../utils/formatters';

/**
 * OrderDetailModal — modal hiển thị chi tiết đơn hàng và actions thay đổi trạng thái.
 *
 * Props:
 *   order          {object}   - Order object đang xem
 *   isOpen         {boolean}  - Có hiển thị modal không
 *   onClose        {Function} - Callback đóng modal
 *   onStatusUpdate {Function} - (id, newStatus) => void
 */
const OrderDetailModal = ({ order, isOpen, onClose, onStatusUpdate }) => {
  if (!isOpen || !order) return null;

  const isFinal = ['delivered', 'cancelled'].includes(order.status);

  return (
    <div className="modal show d-block" tabIndex="1">
      <div className="modal-dialog mx-auto" style={{ zIndex: 1050, maxHeight: '70vh', marginTop: '10vh' }}>
        <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 20vh)' }}>
          <div className="modal-header" style={{ flexShrink: 0 }}>
            <h5 className="modal-title">Order Details</h5>
          </div>

          <div className="modal-body" style={{ overflowY: 'auto', flexGrow: 1 }}>
            {/* Customer Info */}
            <h6>Customer Information</h6>
            <div className="card mb-3">
              <div className="card-body">
                {[
                  ['Name', order.customerInfo?.name],
                  ['Email', order.customerInfo?.email],
                  ['Phone', order.customerInfo?.phone],
                ].map(([label, value]) => (
                  <div className="row" key={label}>
                    <div className="col-4 fw-bold">{label}:</div>
                    <div className="col-8 ps-3">{value || 'N/A'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Info */}
            <h6>Order Information</h6>
            <div className="card mb-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-4 fw-bold">Date:</div>
                  <div className="col-8 ps-3">{formatDate(order.createdAt)}</div>
                </div>
                <div className="row">
                  <div className="col-4 fw-bold">Payment:</div>
                  <div className="col-8 ps-3">{order.paymentMethod || 'N/A'}</div>
                </div>
                <div className="row">
                  <div className="col-4 fw-bold">Status:</div>
                  <div className="col-8 ps-3">
                    <StatusBadge status={order.status} type="order" />
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <h6>Shipping Address</h6>
            <div className="card mb-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-8 ps-3">{order.shippingAddress || 'Address not provided'}</div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <h6>Order Items</h6>
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, index) => (
                          <tr key={index}>
                            <td>{item.productId?.name || 'Product'}</td>
                            <td>{formatCurrency(item.priceAtPurchase || 0)}</td>
                            <td>{item.quantity || 1}</td>
                            <td>{formatCurrency((item.priceAtPurchase || 0) * (item.quantity || 1))}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="mt-3">
              {[
                ['Subtotal', order.totalAmount],
                ['Shipping', 0],
              ].map(([label, amount]) => (
                <div className="row" key={label}>
                  <div className="col-8 text-end fw-bold">{label}:</div>
                  <div className="col-4 text-end" style={{ paddingLeft: '0.5rem' }}>{formatCurrency(amount || 0)}</div>
                </div>
              ))}
              <div className="row">
                <div className="col-8 text-end fw-bold">Total:</div>
                <div className="col-4 text-end" style={{ paddingLeft: '0.5rem' }}>
                  <strong>{formatCurrency(order.totalAmount || 0)}</strong>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            {isFinal ? (
              <div className={`alert ${order.status === 'delivered' ? 'alert-success' : 'alert-danger'} mt-4`} role="alert">
                This order has been {order.status}.
              </div>
            ) : (
              <div className="mt-4 d-flex justify-content-around">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onStatusUpdate(order._id, 'processing')}
                  disabled={order.status === 'processing'}
                >
                  Mark as Processing
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => onStatusUpdate(order._id, 'delivered')}
                >
                  Mark as Delivered
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => onStatusUpdate(order._id, 'cancelled')}
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ flexShrink: 0 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1040 }}></div>
    </div>
  );
};

export default OrderDetailModal;
