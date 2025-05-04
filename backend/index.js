const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const timeSlotRoutes = require('./routes/timeSlotRoutes'); // Import time slot routes
const barberRoutes = require('./routes/barberRoutes'); // Thêm route barber

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// CORS configuration with specific options
const corsOptions = {
  origin: 'http://localhost:3000', // Allow frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow these methods
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'], // Allow these headers
  credentials: true, // Allow cookies
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Middleware
app.use(express.json());

// Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth', authRoutes); // Add auth routes
app.use('/api/timeslots', timeSlotRoutes); // Add time slot routes
app.use('/api/barbers', barberRoutes); // Thêm API endpoint cho barber

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});