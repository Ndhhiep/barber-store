const socketIO = require('socket.io');

let io;

/**
 * Initialize Socket.IO server and attach it to the HTTP server
 * @param {Object} server - HTTP server from Express
 * @param {Object} corsOptions - CORS options từ Express
 * @returns {Object} - Socket.IO server instance
 */
const initSocketIO = (server, corsOptions = {}) => {
  // Create Socket.IO server with CORS configuration
  io = socketIO(server, {
    cors: {
      origin: corsOptions.origin || ['http://localhost:3000', 'http://localhost:3001'],
      methods: corsOptions.methods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: corsOptions.allowedHeaders || ['Content-Type', 'Authorization'],
      credentials: corsOptions.credentials !== undefined ? corsOptions.credentials : true
    },
    transports: ['polling', 'websocket'], // Cho phép cả polling và websocket
    pingTimeout: 60000, // Tăng thời gian đợi ping timeout
    pingInterval: 25000 // Giảm khoảng thời gian giữa các ping
  });

  // Handle connection event
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Handle disconnect event
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Handle error event
    socket.on('error', (error) => {
      console.error(`Socket error on ${socket.id}:`, error);
    });
    
    // Handle connect_error event
    socket.on('connect_error', (err) => {
      console.error(`Socket connect_error on ${socket.id}:`, err);
    });
  });

  console.log('Socket.IO server initialized with CORS settings');
  return io;
};

/**
 * Broadcast a change event to all connected clients
 * @param {string} event - Event name
 * @param {any} data - Event data
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
 * Get the Socket.IO server instance
 * @returns {Object} - Socket.IO server instance
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