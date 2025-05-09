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
  
  // Sử dụng Socket.IO context
  const { isConnected, registerHandler, unregisterHandler } = useSocketContext();

  // Handler cho sự kiện newOrder
  const handleNewOrder = useCallback((data) => {
    console.log('Thông báo đơn hàng mới/cập nhật nhận được:', data);
    setOrderNotifications((prev) => prev + 1);
  }, []);

  // Handler cho sự kiện newBooking
  const handleNewBooking = useCallback((data) => {
    console.log('Thông báo đặt lịch mới/cập nhật nhận được:', data);
    setBookingNotifications((prev) => prev + 1);
  }, []);

  // Đăng ký lắng nghe các sự kiện Socket.IO khi kết nối thành công
  useEffect(() => {
    if (!isConnected) return;

    // Đăng ký các handlers
    registerHandler('newOrder', handleNewOrder);
    registerHandler('newBooking', handleNewBooking);

    // Cleanup khi component unmount
    return () => {
      unregisterHandler('newOrder', handleNewOrder);
      unregisterHandler('newBooking', handleNewBooking);
    };
  }, [isConnected, registerHandler, unregisterHandler, handleNewOrder, handleNewBooking]);

  // Hàm để xóa thông báo khi người dùng click vào trang orders
  const clearOrderNotifications = useCallback(() => {
    setOrderNotifications(0);
  }, []);

  // Hàm để xóa thông báo khi người dùng click vào trang bookings
  const clearBookingNotifications = useCallback(() => {
    setBookingNotifications(0);
  }, []);

  // Giá trị được chia sẻ qua context
  const value = {
    orderNotifications,
    bookingNotifications,
    clearOrderNotifications,
    clearBookingNotifications
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