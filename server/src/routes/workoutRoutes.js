const express = require('express');
const router = express.Router();
const {
  getSplits,
  updateSplit,
  saveWorkout,
  getWorkoutHistory,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
} = require('../controllers/workoutController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/splits', getSplits);
router.put('/splits', updateSplit);
router.route('/')
  .get(getWorkoutHistory)
  .post(saveWorkout);

router.route('/:id')
  .get(getWorkoutById)
  .put(updateWorkout)
  .delete(deleteWorkout);

module.exports = router;
