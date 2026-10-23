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

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
