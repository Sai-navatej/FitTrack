const path = require('node:path');
const dotenv = require('dotenv');

// Load environment variables from server/.env, falling back to root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Startup environment validation
const validateEnvironment = () => {
  if (process.env.NODE_ENV === 'test') return;
  const missing = [];
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.trim() === '') {
    missing.push('MONGODB_URI');
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.trim() === '') {
    missing.push('JWT_SECRET');
  }
  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error(`❌ FATAL: Missing required environment variable(s): ${missing.join(', ')}`);
    console.error('Please configure them in server/.env before launching FitTrack.');
    console.error('======================================================\n');
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

// Trust reverse proxies if in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Strict CORS setup
const devAllowedOrigins = [
  CLIENT_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);

    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      if (origin === CLIENT_URL) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} is not permitted by CORS policy in production.`));
    }

    // In dev, allow configured client URL and localhost variants
    if (devAllowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not permitted by CORS policy.`));
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

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Shutting down FitTrack server gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
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

// Start if not loaded by a test runner
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  startServer();
}

module.exports = { app, startServer };
