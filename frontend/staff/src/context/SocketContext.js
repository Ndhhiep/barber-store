import React, { createContext, useContext } from 'react';
import useSocket from '../hooks/useSocket';

// Tạo context để lưu trữ và chia sẻ socket
const SocketContext = createContext(null);

/**
 * Provider component cung cấp kết nối Socket.IO cho các component con
 */
export const SocketProvider = ({ children }) => {
  const socketState = useSocket(); // Sử dụng hook useSocket đã tạo
  
  return (
    <SocketContext.Provider value={socketState}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Hook để sử dụng Socket.IO trong các component
 * @returns {Object} - Trả về đối tượng socket và các phương thức
 */
export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
};