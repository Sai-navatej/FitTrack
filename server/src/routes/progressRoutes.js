const express = require('express');
const router = express.Router();
const {
  getDashboardSummary,
  getWorkoutFrequency,
  getStrengthHistory,
  getMuscleDistribution,
  getVolumeHistory,
} = require('../controllers/progressController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/frequency', getWorkoutFrequency);
router.get('/strength', getStrengthHistory);
router.get('/distribution', getMuscleDistribution);
router.get('/volume', getVolumeHistory);

module.exports = router;
