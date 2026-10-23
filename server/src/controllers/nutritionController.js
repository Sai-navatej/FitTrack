const FoodEntry = require('../models/FoodEntry');
const User = require('../models/User');

// Popular verified food items preset library for fast search and logging
const foodPresets = [
  { name: 'Chicken Breast (cooked)', servingQuantity: '100g', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: 'Brown Rice (cooked)', servingQuantity: '1 cup (195g)', calories: 218, protein: 4.5, carbs: 45.8, fat: 1.6 },
  { name: 'White Rice (cooked)', servingQuantity: '1 cup (158g)', calories: 205, protein: 4.2, carbs: 44.5, fat: 0.4 },
  { name: 'Whole Eggs (large)', servingQuantity: '2 eggs (100g)', calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5 },
  { name: 'Egg Whites', servingQuantity: '1 cup (243g)', calories: 126, protein: 26.5, carbs: 1.8, fat: 0.4 },
  { name: 'Oatmeal (rolled oats)', servingQuantity: '1/2 cup dry (40g)', calories: 154, protein: 5.3, carbs: 27.4, fat: 2.6 },
  { name: 'Whey Protein Powder', servingQuantity: '1 scoop (30g)', calories: 120, protein: 24, carbs: 3, fat: 1.5 },
  { name: 'Greek Yogurt (plain, 0% fat)', servingQuantity: '1 cup (200g)', calories: 120, protein: 20, carbs: 7, fat: 0 },
  { name: 'Salmon Fillet (baked)', servingQuantity: '150g', calories: 312, protein: 34, carbs: 0, fat: 18 },
  { name: 'Banana', servingQuantity: '1 medium (118g)', calories: 105, protein: 1.3, carbs: 27, fat: 0.3 },
  { name: 'Peanut Butter', servingQuantity: '2 tbsp (32g)', calories: 188, protein: 8, carbs: 7, fat: 16 },
  { name: 'Almonds', servingQuantity: '1 oz / 28g', calories: 164, protein: 6, carbs: 6.1, fat: 14.2 },
  { name: 'Broccoli (steamed)', servingQuantity: '1 cup (150g)', calories: 55, protein: 3.7, carbs: 11.2, fat: 0.6 },
  { name: 'Sweet Potato (baked)', servingQuantity: '1 medium (130g)', calories: 112, protein: 2, carbs: 26, fat: 0.1 },
  { name: 'Cottage Cheese (low fat)', servingQuantity: '1 cup (226g)', calories: 163, protein: 28, carbs: 6.1, fat: 2.3 },
  { name: 'Tuna (canned in water)', servingQuantity: '1 can drained (165g)', calories: 191, protein: 42, carbs: 0, fat: 1.4 },
  { name: 'Avocado', servingQuantity: '1/2 medium (100g)', calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: 'Olive Oil', servingQuantity: '1 tbsp (14g)', calories: 119, protein: 0, carbs: 0, fat: 13.5 },
];

// @desc    Add a new food entry
// @route   POST /api/nutrition
// @access  Private
const addFoodEntry = async (req, res, next) => {
  try {
    const {
      name,
      mealCategory = 'breakfast',
      servingQuantity = '1 serving',
      calories,
      protein = 0,
      carbs = 0,
      fat = 0,
      date = new Date(),
    } = req.body;

    if (!name || calories === undefined || calories === null) {
      return res.status(400).json({
        success: false,
        message: 'Food name and calories are required.',
      });
    }

    const foodEntry = await FoodEntry.create({
      user: req.user.id,
      name: name.trim(),
      mealCategory,
      servingQuantity: servingQuantity.trim(),
      calories: Number(calories),
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      date: new Date(date),
    });

    res.status(201).json({
      success: true,
      message: 'Food entry logged successfully',
      foodEntry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get food entries for a specific date
// @route   GET /api/nutrition
// @access  Private
const getFoodEntriesByDate = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await FoodEntry.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: 1 });

    // Calculate aggregated totals
    const totals = entries.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: Math.round((acc.protein + item.protein) * 10) / 10,
        carbs: Math.round((acc.carbs + item.carbs) * 10) / 10,
        fat: Math.round((acc.fat + item.fat) * 10) / 10,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    const user = await User.findById(req.user.id);
    const targetCalories = user ? user.dailyCalorieTarget : 2200;
    const remainingCalories = Math.max(0, targetCalories - totals.calories);

    res.status(200).json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      targetCalories,
      remainingCalories,
      totals,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a food entry
// @route   PUT /api/nutrition/:id
// @access  Private
const updateFoodEntry = async (req, res, next) => {
  try {
    const entry = await FoodEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Food entry not found' });
    }

    if (entry.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this entry' });
    }

    const { name, mealCategory, servingQuantity, calories, protein, carbs, fat, date } = req.body;

    if (name !== undefined) entry.name = name.trim();
    if (mealCategory !== undefined) entry.mealCategory = mealCategory;
    if (servingQuantity !== undefined) entry.servingQuantity = servingQuantity.trim();
    if (calories !== undefined) entry.calories = Number(calories);
    if (protein !== undefined) entry.protein = Number(protein);
    if (carbs !== undefined) entry.carbs = Number(carbs);
    if (fat !== undefined) entry.fat = Number(fat);
    if (date !== undefined) entry.date = new Date(date);

    await entry.save();

    res.status(200).json({
      success: true,
      message: 'Food entry updated successfully',
      foodEntry: entry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a food entry
// @route   DELETE /api/nutrition/:id
// @access  Private
const deleteFoodEntry = async (req, res, next) => {
  try {
    const entry = await FoodEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Food entry not found' });
    }

    if (entry.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Food entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search food items from verified preset nutrition library
// @route   GET /api/nutrition/search
// @access  Private
const searchFood = async (req, res, next) => {
  try {
    const query = req.query.q ? req.query.q.toLowerCase().trim() : '';
    if (!query) {
      return res.status(200).json({ success: true, results: foodPresets.slice(0, 10) });
    }

    const results = foodPresets.filter((food) =>
      food.name.toLowerCase().includes(query)
    );

    res.status(200).json({
      success: true,
      results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addFoodEntry,
  getFoodEntriesByDate,
  updateFoodEntry,
  deleteFoodEntry,
  searchFood,
};
