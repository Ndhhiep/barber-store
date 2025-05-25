const express = require('express');
const dotenv = require('dotenv');
const http = require('http'); // Added HTTP module
// Thiết lập múi giờ Việt Nam (UTC+7) cho toàn bộ ứng dụng
process.env.TZ = 'Asia/Ho_Chi_Minh';

const cors = require('cors');
const connectDB = require('./config/db');
const { initializeChangeStreams } = require('./utils/changeStreams');
const { initSocketIO } = require('./utils/socketIO'); // Added Socket.IO utility
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const barberRoutes = require('./routes/barberRoutes'); // Import barber routes
const userRoutes = require('./routes/userRoutes'); // Import user routes
const dashboardRoutes = require('./routes/dashboardRoutes'); // Import dashboard routes
const serviceRoutes = require('./routes/serviceRoutes'); // Import service routes
const contactRoutes = require('./routes/contactRoutes'); // Import contact routes

// Load environment variables
dotenv.config();

const app = express();

// Create HTTP server with Express app
const server = http.createServer(app);

// CORS configuration with specific options - định nghĩa một lần dùng chung
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://barber-store-tan.vercel.app'], // Allow both frontend origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Added PATCH method
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'], // Allow these headers
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Initialize Socket.IO with the HTTP server and pass the corsOptions
const io = initSocketIO(server, corsOptions);

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes); // Add auth routes
app.use('/api/barbers', barberRoutes); // Add barber routes
app.use('/api/users', userRoutes); // Add user routes
app.use('/api/dashboard', dashboardRoutes); // Add dashboard routes
app.use('/api/services', serviceRoutes); // Add service routes
app.use('/api/contacts', contactRoutes); // Updated route to match frontend

// Home route - enhanced with health check information
app.get('/', (req, res) => {
  res.json({
    message: 'API is running...',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Also add a health check endpoint at API root for frontend server status checks
app.get('/api', (req, res) => {
  res.json({
    message: 'API is running...',
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Connect to database
connectDB().then(async () => {
  // Initialize change streams after database connection is established
  try {
    await initializeChangeStreams();
    console.log('Change streams initialized for Orders and Bookings collections');
  } catch (error) {
    console.error('Failed to initialize change streams:', error);
  }
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// Start server with Socket.IO integration
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO support`);
});