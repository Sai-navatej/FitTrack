const express = require('express');
const router = express.Router();
const {
  addWeight,
  getWeightHistory,
  updateWeight,
  deleteWeight,
} = require('../controllers/weightController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getWeightHistory)
  .post(addWeight);

router.route('/:id')
  .put(updateWeight)
  .delete(deleteWeight);

module.exports = router;
