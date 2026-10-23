const express = require('express');
const router = express.Router();
const {
  logWater,
  getDailyWater,
  getWaterHistory,
  deleteWaterEntry,
} = require('../controllers/waterController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', logWater);
router.get('/daily', getDailyWater);
router.get('/history', getWaterHistory);
router.delete('/:id', deleteWaterEntry);

module.exports = router;
