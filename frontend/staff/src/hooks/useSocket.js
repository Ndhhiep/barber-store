import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook để quản lý kết nối Socket.IO
 * @param {string} url - URL của Socket.IO server
 * @param {Object} options - Tùy chọn cấu hình cho Socket.IO client
 * @returns {Object} - Trả về đối tượng socket và trạng thái kết nối
 */
const useSocket = (url = 'http://localhost:5000', options = {}) => {
  // Sử dụng useRef để giữ tham chiếu đến socket giữa các lần render
  const socketRef = useRef(null);
  // Sử dụng useRef để lưu trữ các handlers đã đăng ký
  const handlersRef = useRef(new Map());
  // Sử dụng useRef để lưu trữ các trạng thái mà không gây re-render
  const stateRef = useRef({
    isConnected: false,
    isLoading: true,
    error: null,
    lastMessage: null
  });
    // State hiển thị trong UI - chỉ cập nhật khi cần thiết
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  
  // Sử dụng useRef để tránh re-connection mỗi khi render
  const urlRef = useRef(url);
  const optionsRef = useRef(options);

  // Cập nhật refs nếu url hoặc options thay đổi
  useEffect(() => {
    urlRef.current = url;
    optionsRef.current = options;
  }, [url, options]);

  // Khởi tạo kết nối Socket.IO - chỉ chạy một lần khi component mount
  useEffect(() => {
    // Đặt trạng thái loading khi bắt đầu kết nối
    stateRef.current.isLoading = true;
    stateRef.current.error = null;
    setIsLoading(true);
    setError(null);
    
    let socketInstance = null;
    
    try {
      console.log('Khởi tạo kết nối Socket.IO đến:', urlRef.current);
      
      // Khởi tạo kết nối Socket.IO
      socketInstance = io(urlRef.current, {
        ...optionsRef.current,
        // Thêm các tùy chọn mặc định
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        // Cấu hình transports để thử polling trước rồi mới dùng websocket
        transports: ['polling', 'websocket'],
        withCredentials: true,
        timeout: 10000, // Timeout sau 10 giây nếu không thể kết nối
      });
        // Lưu trữ socket instance
      socketRef.current = socketInstance;
      
      // Xử lý sự kiện kết nối
      const onConnect = () => {
        console.log(`Socket kết nối thành công với ID: ${socketInstance.id}`);
        stateRef.current.isConnected = true;
        stateRef.current.isLoading = false;
        stateRef.current.error = null;
        
        // Cập nhật UI state an toàn
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
      };
      
      // Xử lý sự kiện ngắt kết nối
      const onDisconnect = (reason) => {
        console.log(`Socket ngắt kết nối. Lý do: ${reason}`);
        stateRef.current.isConnected = false;
        
        // Cập nhật UI state an toàn
        setIsConnected(false);
        
        // Kiểm tra nếu là lỗi phía server
        if (reason === 'io server disconnect') {
          // Server ngắt kết nối, thử kết nối lại
          socketInstance.connect();
        }
      };
      
      // Xử lý sự kiện kết nối lỗi
      const onError = (error) => {
        console.error('Socket kết nối lỗi:', error);
        stateRef.current.isLoading = false;
        stateRef.current.error = `Không thể kết nối đến Socket.IO server: ${error.message}`;
        
        // Cập nhật UI state an toàn
        setIsLoading(false);
        setError(`Không thể kết nối đến Socket.IO server: ${error.message}`);
      };
      
      // Xử lý sự kiện timeout
      const onConnectTimeout = () => {
        console.error('Socket kết nối timeout');
        stateRef.current.isLoading = false;
        stateRef.current.error = 'Kết nối timeout: Không thể kết nối đến server sau thời gian chờ.';
        
        // Cập nhật UI state an toàn
        setIsLoading(false);
        setError('Kết nối timeout: Không thể kết nối đến server sau thời gian chờ.');
      };
      
      // Xử lý khi kết nối lại thất bại
      const onReconnectFailed = () => {
        console.error('Socket kết nối lại thất bại');
        stateRef.current.isLoading = false;
        stateRef.current.error = 'Không thể kết nối lại sau nhiều lần thử.';
        
        // Cập nhật UI state an toàn
        setIsLoading(false);
        setError('Không thể kết nối lại sau nhiều lần thử.');
      };
      
      // Xử lý khi đang kết nối lại
      const onReconnecting = (attemptNumber) => {
        console.log(`Đang thử kết nối lại lần thứ ${attemptNumber}...`);
        stateRef.current.isLoading = true;
        
        // Cập nhật UI state an toàn
        setIsLoading(true);
      };
      
      // Đăng ký các sự kiện system
      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);
      socketInstance.on('connect_error', onError);
      socketInstance.on('connect_timeout', onConnectTimeout);      socketInstance.on('reconnect_failed', onReconnectFailed);
      socketInstance.on('reconnecting', onReconnecting);        // Cleanup khi component unmount
      
      // Lưu trữ tham chiếu đến handlersRef.current tại thời điểm này
      // để tránh sử dụng phiên bản mới của ref trong cleanup function
      const currentHandlers = handlersRef.current;
      
      return () => {
        console.log('Đang đóng kết nối Socket.IO...');
        
        // Gỡ bỏ tất cả các handlers đã đăng ký
        // Sử dụng biến currentHandlers thay vì handlersRef.current để tránh warning
        const handlers = new Map(currentHandlers);
        if (handlers.size > 0) {
          handlers.forEach((callbacks, eventName) => {
            callbacks.forEach((wrappedCb, originalCb) => {
              if (socketInstance) {
                socketInstance.off(eventName, wrappedCb);
              }
            });
          });
          // Reset handlers map
          currentHandlers.clear();
        }
        
        // Gỡ bỏ các sự kiện hệ thống
        if (socketInstance) {
          socketInstance.off('connect', onConnect);
          socketInstance.off('disconnect', onDisconnect);
          socketInstance.off('connect_error', onError);
          socketInstance.off('connect_timeout', onConnectTimeout);
          socketInstance.off('reconnect_failed', onReconnectFailed);
          socketInstance.off('reconnecting', onReconnecting);
          socketInstance.disconnect();
        }
        
        // Reset socket reference
        socketRef.current = null;
      };
    } catch (err) {
      console.error('Lỗi khởi tạo socket:', err);
      stateRef.current.isLoading = false;
      stateRef.current.error = `Lỗi khởi tạo Socket.IO: ${err.message}`;
      
      // Cập nhật UI state an toàn
      setIsLoading(false);
      setError(`Lỗi khởi tạo Socket.IO: ${err.message}`);
    }
  }, []); // Empty dependency array - chỉ chạy một lần

  /**
   * Hàm đăng ký lắng nghe một sự kiện
   * @param {string} eventName - Tên sự kiện
   * @param {Function} callback - Hàm callback xử lý sự kiện
   */
  const registerHandler = useCallback((eventName, callback) => {
    if (!socketRef.current) return;
    
    // Kiểm tra xem callback này đã được đăng ký chưa
    if (handlersRef.current.has(eventName) &&
        handlersRef.current.get(eventName).has(callback)) {
      // Callback đã được đăng ký trước đó, không cần đăng ký lại
      return;
    }
    
    // Tạo một wrapper function để xử lý sự kiện và cập nhật lastMessage
    const wrappedCallback = (data) => {
      try {
        // Gọi callback gốc
        callback(data);
        
        // Cập nhật lastMessage thông qua ref
        const messageData = { event: eventName, data, timestamp: new Date() };
        stateRef.current.lastMessage = messageData;
        
        // Chỉ cập nhật UI state nếu cần thiết
        setLastMessage(messageData);
      } catch (err) {
        console.error(`Lỗi xử lý sự kiện ${eventName}:`, err);
        
        // Lưu lỗi
        stateRef.current.error = `Lỗi xử lý sự kiện ${eventName}: ${err.message}`;
        
        // Cập nhật UI state
        setError(`Lỗi xử lý sự kiện ${eventName}: ${err.message}`);
      }
    };
    
    // Lưu trữ mapping giữa callback gốc và wrapped callback
    if (!handlersRef.current.has(eventName)) {
      handlersRef.current.set(eventName, new Map());
    }
    handlersRef.current.get(eventName).set(callback, wrappedCallback);
    
    // Đăng ký event listener
    socketRef.current.on(eventName, wrappedCallback);
    
    console.log(`Đã đăng ký handler cho sự kiện "${eventName}"`);
  }, []);

  /**
   * Hàm gỡ bỏ lắng nghe một sự kiện
   * @param {string} eventName - Tên sự kiện
   * @param {Function} callback - Hàm callback đã đăng ký
   */
  const unregisterHandler = useCallback((eventName, callback) => {
    if (!socketRef.current) return;
    
    // Kiểm tra xem callback này đã được đăng ký chưa
    if (!handlersRef.current.has(eventName) ||
        !handlersRef.current.get(eventName).has(callback)) {
      // Callback chưa được đăng ký, không cần gỡ bỏ
      return;
    }
    
    // Lấy wrapped callback từ Map
    const wrappedCallback = handlersRef.current.get(eventName).get(callback);
    
    // Gỡ bỏ event listener
    socketRef.current.off(eventName, wrappedCallback);
    
    // Xóa khỏi Map
    handlersRef.current.get(eventName).delete(callback);
    
    // Nếu Map rỗng, xóa luôn entry cho eventName này
    if (handlersRef.current.get(eventName).size === 0) {
      handlersRef.current.delete(eventName);
    }
    
    console.log(`Đã gỡ bỏ handler cho sự kiện "${eventName}"`);
  }, []);

  /**
   * Hàm phát một sự kiện
   * @param {string} eventName - Tên sự kiện
   * @param {any} data - Dữ liệu gửi đi
   * @returns {boolean} - Kết quả gửi sự kiện
   */
  const emitEvent = useCallback((eventName, data) => {
    if (socketRef.current) {
      try {
        socketRef.current.emit(eventName, data);
        return true;
      } catch (err) {
        console.error(`Lỗi gửi sự kiện ${eventName}:`, err);
        
        // Lưu lỗi
        stateRef.current.error = `Lỗi gửi sự kiện ${eventName}: ${err.message}`;
        
        // Cập nhật UI state
        setError(`Lỗi gửi sự kiện ${eventName}: ${err.message}`);
        return false;
      }
    }
    return false;
  }, []);

  /**
   * Thử kết nối lại nếu đã ngắt kết nối
   */
  const reconnect = useCallback(() => {
    if (socketRef.current && !stateRef.current.isConnected) {
      console.log('Đang thử kết nối lại...');
      
      // Cập nhật state refs
      stateRef.current.isLoading = true;
      stateRef.current.error = null;
      
      // Cập nhật UI state
      setIsLoading(true);
      setError(null);
      
      // Thử kết nối lại
      socketRef.current.connect();
    }
  }, []);
  return {
    socketRef, // Return the ref instead of the state variable that's not used
    isConnected,
    isLoading,
    error,
    lastMessage,
    registerHandler,
    unregisterHandler,
    emitEvent,
    reconnect
  };
};

export default useSocket;