const express = require('express');
const router = express.Router();
const {
  addFoodEntry,
  getFoodEntriesByDate,
  updateFoodEntry,
  deleteFoodEntry,
  searchFood,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/search', searchFood);
router.route('/')
  .get(getFoodEntriesByDate)
  .post(addFoodEntry);

router.route('/:id')
  .put(updateFoodEntry)
  .delete(deleteFoodEntry);

module.exports = router;
