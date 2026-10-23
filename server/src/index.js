require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const { seedExercises } = require('./seeds/seedRunner');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Trust reverse proxies if in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS setup
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    // In dev, allow localhost variants
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }
    
    if (origin === CLIENT_URL) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow during development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logger for debugging
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Mount REST API
app.use('/api', apiRoutes);

// Root greeting & status
app.get('/', (req, res) => {
  res.json({
    app: 'FitTrack API',
    version: '1.0.0',
    status: 'Running',
    docs: '/api/health',
  });
});

// Centralized error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`,
  });
});

// Start Server Function
let server;
const startServer = async () => {
  try {
    await connectDB();
    await seedExercises();

    server = app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`💪 FitTrack Backend Server Active!`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start if not loaded by a test runner
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  startServer();
}

module.exports = { app, startServer };
