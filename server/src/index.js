const path = require('node:path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Validate required environment variables
const validateEnvironment = () => {
  if (process.env.NODE_ENV === 'test') return;

  const missing = [];

  if (!process.env.MONGODB_URI?.trim()) {
    missing.push('MONGODB_URI');
  }

  if (!process.env.JWT_SECRET?.trim()) {
    missing.push('JWT_SECRET');
  }

  if (missing.length > 0) {
    console.error(
      `FATAL: Missing required environment variables: ${missing.join(', ')}`
    );
    process.exit(1);
  }
};

validateEnvironment();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { connectDB, disconnectDB } = require('./config/db');
const { seedExercises } = require('./seeds/seedRunner');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration
const devAllowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header (for example, curl).
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV === 'production') {
        if (origin === CLIENT_URL) {
          return callback(null, true);
        }

        console.error(`CORS blocked origin: ${origin}`);
        return callback(
          new Error(`Origin ${origin} is not permitted by CORS policy.`)
        );
      }

      if (
        devAllowedOrigins.includes(origin) ||
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origin ${origin} is not permitted by CORS policy.`)
      );
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`
      );
    });

    next();
  });
}

// Initialize the database before handling requests.
let dbBootstrapped = false;

app.use(async (req, res, next) => {
  if (dbBootstrapped) return next();

  try {
    await connectDB();
    await seedExercises();
    dbBootstrapped = true;
    next();
  } catch (error) {
    console.error('Database initialization failed:', error.message);

    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Database connection failed.',
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Diagnostic endpoint: confirms the deployed API and route configuration.
app.get('/api/diagnostics', (req, res) => {
  res.json({
    success: true,
    app: 'FitTrack API',
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: '/api',
    authPrefix: '/api/auth',
    registrationEndpoint: 'POST /api/auth/register',
    loginEndpoint: 'POST /api/auth/login',
  });
});

// Root health information
app.get('/', (req, res) => {
  res.json({
    app: 'FitTrack API',
    version: '1.0.0',
    status: 'Running',
    docs: '/api/health',
    diagnostics: '/api/diagnostics',
  });
});

// Centralized error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`,
  });
});

// Start the server
let server;

const startServer = async () => {
  try {
    await connectDB();
    await seedExercises();

    dbBootstrapped = true;

    server = app.listen(PORT, () => {
      console.log('========================================');
      console.log('FitTrack Backend Server Active!');
      console.log(`Port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);

  if (server) {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start only when this file is run directly.
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  startServer();
}

module.exports = { app, startServer };

