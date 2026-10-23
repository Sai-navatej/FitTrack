const express = require('express');
const router = express.Router();
const {
  getExercises,
  getExerciseById,
  createCustomExercise,
  deleteCustomExercise,
} = require('../controllers/exerciseController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getExercises);
router.post('/', createCustomExercise);
router.get('/:id', getExerciseById);
router.delete('/:id', deleteCustomExercise);

module.exports = router;
