const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Food item name is required'],
    trim: true,
  },
  mealCategory: {
    type: String,
    required: [true, 'Meal category is required'],
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    default: 'breakfast',
  },
  servingQuantity: {
    type: String,
    trim: true,
    default: '1 serving',
  },
  calories: {
    type: Number,
    required: [true, 'Calories count is required'],
    min: [0, 'Calories cannot be negative'],
  },
  protein: {
    type: Number,
    default: 0,
    min: [0, 'Protein cannot be negative'],
  },
  carbs: {
    type: Number,
    default: 0,
    min: [0, 'Carbohydrates cannot be negative'],
  },
  fat: {
    type: Number,
    default: 0,
    min: [0, 'Fat cannot be negative'],
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for fast daily totals and date range queries
foodEntrySchema.index({ user: 1, date: -1 });
foodEntrySchema.index({ user: 1, mealCategory: 1 });

module.exports = mongoose.model('FoodEntry', foodEntrySchema);
