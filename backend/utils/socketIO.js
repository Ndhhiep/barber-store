const socketIO = require('socket.io');

let io;

/**
 * Khởi tạo Socket.IO server và gắn vào HTTP server
 * @param {Object} server - HTTP server từ Express
 * @param {Object} corsOptions - Tuỳ chọn CORS từ Express
 * @returns {Object} - instance của Socket.IO server
 */
const initSocketIO = (server, corsOptions = {}) => {
  // Tạo Socket.IO server với cấu hình CORS
  io = socketIO(server, {
    cors: {
      origin: corsOptions.origin || ['http://localhost:3000', 'http://localhost:3001'],
      methods: corsOptions.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: corsOptions.allowedHeaders || ['Content-Type', 'Authorization'],
      credentials: corsOptions.credentials !== undefined ? corsOptions.credentials : true
    },
    transports: ['polling', 'websocket'], // Cho phép cả polling và websocket
    pingTimeout: 60000, // Tăng thời gian chờ ping
    pingInterval: 25000 // Giảm khoảng thời gian giữa các ping
  });

  // Xử lý sự kiện kết nối
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Xử lý sự kiện ngắt kết nối
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Xử lý sự kiện lỗi
    socket.on('error', (error) => {
      console.error(`Socket error on ${socket.id}:`, error);
    });
    
    // Xử lý sự kiện connect_error
    socket.on('connect_error', (err) => {
      console.error(`Socket connect_error on ${socket.id}:`, err);
    });
  });

  console.log('Socket.IO server initialized with CORS settings');
  return io;
};

/**
 * Phát sự kiện thay đổi tới tất cả các client đã kết nối
 * @param {string} event - Tên sự kiện
 * @param {any} data - Dữ liệu sự kiện
 */
const broadcastChange = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`Broadcasted ${event} event to all clients:`, data);
  } else {
    console.error('Socket.IO server not initialized. Cannot broadcast event.');
  }
};

/**
 * Lấy instance của Socket.IO server
 * @returns {Object} - instance của Socket.IO server
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Please call initSocketIO first.');
  }
  return io;
};

module.exports = {
  initSocketIO,
  broadcastChange,
  getIO
};