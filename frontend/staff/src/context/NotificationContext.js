import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocketContext } from './SocketContext';

// Tạo context
const NotificationContext = createContext();

/**
 * Provider component để quản lý và chia sẻ thông báo từ Socket.IO
 */
export const NotificationProvider = ({ children }) => {  // Trạng thái cho thông báo
  const [orderNotifications, setOrderNotifications] = useState(0);
  const [bookingNotifications, setBookingNotifications] = useState(0);
  const [contactNotifications, setContactNotifications] = useState(0);
  const [customerNotifications, setCustomerNotifications] = useState(0);
  
  // Store IDs of new items for badge display
  const [newOrderIds, setNewOrderIds] = useState(new Set());
  const [newBookingIds, setNewBookingIds] = useState(new Set());
  const [newContactIds, setNewContactIds] = useState(new Set());
  const [newCustomerIds, setNewCustomerIds] = useState(new Set());
  
  // Sử dụng Socket.IO context
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();  // Handler cho sự kiện newOrder
  const handleNewOrder = useCallback((data) => {
    console.log('Thông báo đơn hàng mới/cập nhật nhận được:', data);
    // Chỉ tăng thông báo khi có order mới (insert), không tăng khi update
    if (data.operationType === 'insert' && data.fullDocument) {
      setOrderNotifications((prev) => prev + 1);
      
      // Store the new order ID in the set for badge display
      setNewOrderIds(prev => {
        const updated = new Set(prev);
        updated.add(data.fullDocument._id);
        return updated;
      });
      
      // Auto-remove the badge after 5 minutes
      setTimeout(() => {
        setNewOrderIds(prev => {
          const updated = new Set(prev);
          if (updated.has(data.fullDocument._id)) {
            updated.delete(data.fullDocument._id);
          }
          return updated;
        });
      }, 5 * 60 * 1000); // 5 minutes
    }
  }, []);
    // Handler cho sự kiện newBooking
  const handleNewBooking = useCallback((data) => {
    console.log('Thông báo đặt lịch mới/cập nhật nhận được:', data);
    // Chỉ tăng thông báo khi có booking mới (insert), không tăng khi update
    if (data.operationType === 'insert' && data.fullDocument) {
      setBookingNotifications((prev) => prev + 1);
      
      // Store the new booking ID in the set for badge display
      setNewBookingIds(prev => {
        const updated = new Set(prev);
        updated.add(data.fullDocument._id);
        return updated;
      });
      
      // Auto-remove the badge after 5 minutes
      setTimeout(() => {
        setNewBookingIds(prev => {
          const updated = new Set(prev);
          if (updated.has(data.fullDocument._id)) {
            updated.delete(data.fullDocument._id);
          }
          return updated;
        });
      }, 5 * 60 * 1000); // 5 minutes
    }
  }, []);
  
  // Handler cho sự kiện newContact
  const handleNewContact = useCallback((data) => {
    console.log('Thông báo liên hệ mới nhận được:', data);
    if (data.contact && data.contact._id) {
      setContactNotifications((prev) => prev + 1);
      
      // Store the new contact ID for badge display
      setNewContactIds(prev => {
        const updated = new Set(prev);
        updated.add(data.contact._id);
        return updated;
      });
      
      // Auto-remove after 5 minutes
      setTimeout(() => {
        setNewContactIds(prev => {
          const updated = new Set(prev);
          if (updated.has(data.contact._id)) {
            updated.delete(data.contact._id);
          }
          return updated;
        });
      }, 5 * 60 * 1000);
    }
  }, []);
    // Handler cho sự kiện newCustomer
  const handleNewCustomer = useCallback((data) => {
    console.log('Thông báo khách hàng mới nhận được:', data);
    // Check for both user and customer in data as the socket may emit either format
    const customerData = data.user || data.customer;
    if (customerData && customerData._id) {
      setCustomerNotifications((prev) => prev + 1);
      
      // Store the new customer ID for badge display
      setNewCustomerIds(prev => {
        const updated = new Set(prev);
        updated.add(customerData._id);
        return updated;
      });
      
      // Auto-remove after 5 minutes
      setTimeout(() => {
        setNewCustomerIds(prev => {
          const updated = new Set(prev);
          if (updated.has(customerData._id)) {
            updated.delete(customerData._id);
          }
          return updated;
        });
      }, 5 * 60 * 1000);
    }
  }, []);
  // Đăng ký lắng nghe các sự kiện Socket.IO khi kết nối thành công
  useEffect(() => {
    if (!isConnected) return;

    // Đăng ký các handlers
    registerHandler('newOrder', handleNewOrder);
    registerHandler('newBooking', handleNewBooking);
    registerHandler('newContact', handleNewContact);
    registerHandler('newCustomer', handleNewCustomer);

    // Cleanup khi component unmount
    return () => {
      unregisterHandler('newOrder', handleNewOrder);
      unregisterHandler('newBooking', handleNewBooking);
      unregisterHandler('newContact', handleNewContact);
      unregisterHandler('newCustomer', handleNewCustomer);
    };
  }, [
    isConnected, 
    registerHandler, 
    unregisterHandler, 
    handleNewOrder, 
    handleNewBooking,
    handleNewContact,
    handleNewCustomer
  ]);
  // Hàm để xóa thông báo khi người dùng click vào trang orders
  const clearOrderNotifications = useCallback(() => {
    setOrderNotifications(0);
  }, []);

  // Hàm để xóa thông báo khi người dùng click vào trang bookings
  const clearBookingNotifications = useCallback(() => {
    setBookingNotifications(0);
  }, []);
  
  // Hàm để xóa thông báo khi người dùng click vào trang contacts
  const clearContactNotifications = useCallback(() => {
    setContactNotifications(0);
  }, []);
  
  // Hàm để xóa thông báo khi người dùng click vào trang customers
  const clearCustomerNotifications = useCallback(() => {
    setCustomerNotifications(0);
  }, []);
    // Remove a specific order from the new orders set
  const removeNewOrderId = useCallback((id) => {
    setNewOrderIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, []);
  
  // Check if an order is new
  const isNewOrder = useCallback((id) => {
    return newOrderIds.has(id);
  }, [newOrderIds]);
  
  // Remove a specific booking from the new bookings set
  const removeNewBookingId = useCallback((id) => {
    setNewBookingIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, []);
  
  // Remove a specific contact from the new contacts set
  const removeNewContactId = useCallback((id) => {
    setNewContactIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, []);
  
  // Remove a specific customer from the new customers set
  const removeNewCustomerId = useCallback((id) => {
    setNewCustomerIds(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  }, []);  // Giá trị được chia sẻ qua context
  const value = {
    orderNotifications,
    bookingNotifications,
    contactNotifications,
    customerNotifications,
    clearOrderNotifications,
    clearBookingNotifications,
    clearContactNotifications,
    clearCustomerNotifications,
    newOrderIds,
    newBookingIds,
    newContactIds,
    newCustomerIds,
    removeNewOrderId,
    removeNewBookingId,
    removeNewContactId,
    removeNewCustomerId,
    setNewCustomerIds, // Add setter for customers
    isNewOrder
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook để sử dụng NotificationContext
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};