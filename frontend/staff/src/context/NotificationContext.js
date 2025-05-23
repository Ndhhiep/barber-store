import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocketContext } from './SocketContext';

// Tạo context
const NotificationContext = createContext();

/**
 * Provider component để quản lý và chia sẻ thông báo từ Socket.IO
 */
export const NotificationProvider = ({ children }) => {
  // Trạng thái cho thông báo
  const [orderNotifications, setOrderNotifications] = useState(0);
  const [bookingNotifications, setBookingNotifications] = useState(0);
  const [contactNotifications, setContactNotifications] = useState(0);
  const [customerNotifications, setCustomerNotifications] = useState(0);
  
  // Sử dụng Socket.IO context
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();  // Handler cho sự kiện newOrder
  const handleNewOrder = useCallback((data) => {
    console.log('Thông báo đơn hàng mới/cập nhật nhận được:', data);
    // Chỉ tăng thông báo khi có order mới (insert), không tăng khi update
    if (data.operationType === 'insert') {
      setOrderNotifications((prev) => prev + 1);
    }
  }, []);
  
  // Handler cho sự kiện newBooking
  const handleNewBooking = useCallback((data) => {
    console.log('Thông báo đặt lịch mới/cập nhật nhận được:', data);
    // Chỉ tăng thông báo khi có booking mới (insert), không tăng khi update
    if (data.operationType === 'insert') {
      setBookingNotifications((prev) => prev + 1);
    }
  }, []);
  
  // Handler cho sự kiện newContact
  const handleNewContact = useCallback((data) => {
    console.log('Thông báo liên hệ mới nhận được:', data);
    setContactNotifications((prev) => prev + 1);
  }, []);
  
  // Handler cho sự kiện newCustomer
  const handleNewCustomer = useCallback((data) => {
    console.log('Thông báo khách hàng mới nhận được:', data);
    setCustomerNotifications((prev) => prev + 1);
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
  // Giá trị được chia sẻ qua context
  const value = {
    orderNotifications,
    bookingNotifications,
    contactNotifications,
    customerNotifications,
    clearOrderNotifications,
    clearBookingNotifications,
    clearContactNotifications,
    clearCustomerNotifications
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