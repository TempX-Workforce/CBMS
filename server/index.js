const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const departmentRoutes = require('./routes/departments');
const userRoutes = require('./routes/users');
const budgetHeadRoutes = require('./routes/budgetHeads');
const settingsRoutes = require('./routes/settings');
const allocationRoutes = require('./routes/allocations');
const expenditureRoutes = require('./routes/expenditures');
const fileRoutes = require('./routes/files');
const auditLogRoutes = require('./routes/auditLogs');
const reportRoutes = require('./routes/reports');
const systemRoutes = require('./routes/system');
const pushRoutes = require('./routes/pushRoutes');

// Import services
const { initReminderService } = require('./services/reminderService');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet());

// Rate limiting: 100 requests per 15 minutes
// Rate limiting: 1000 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Serve static files (for uploaded attachments)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const statusHandler = (req, res) => {
  res.json({
    success: true,
    message: 'CBMS Backend API is running!',
    version: '1.0.2',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      departments: '/api/departments',
      budgetHeads: '/api/budget-heads',
      allocations: '/api/allocations',
      expenditures: '/api/expenditures',
      notifications: '/api/notifications',
      reports: '/api/reports'
    }
  });
};

app.get('/', statusHandler);
app.get('/api', statusHandler);
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/budget-heads', budgetHeadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/expenditures', expenditureRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/push', pushRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');

    // Initialize reminder service after DB connection
    initReminderService();

    app.listen(PORT, () => {
      console.log(`🚀 CBMS Server is running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('\n🛑 MongoDB connection closed');
    console.log('🛑 Shutting down server...');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});
