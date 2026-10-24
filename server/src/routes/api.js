const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const exerciseRoutes = require('./exerciseRoutes');
const workoutRoutes = require('./workoutRoutes');
const nutritionRoutes = require('./nutritionRoutes');
const weightRoutes = require('./weightRoutes');
const waterRoutes = require('./waterRoutes');
const progressRoutes = require('./progressRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/exercises', exerciseRoutes);
router.use('/workouts', workoutRoutes);
router.use('/nutrition', nutritionRoutes);
router.use('/weight', weightRoutes);
router.use('/water', waterRoutes);
router.use('/progress', progressRoutes);

const { isDatabaseConnected } = require('../config/db');

// Health check endpoint with real database status
router.get('/health', (req, res) => {
  const dbConnected = isDatabaseConnected();
  const statusCode = dbConnected ? 200 : 503;
  res.status(statusCode).json({
    status: dbConnected ? 'healthy' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
