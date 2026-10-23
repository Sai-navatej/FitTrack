const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
  },
  targetMuscleGroup: {
    type: String,
    required: [true, 'Target muscle group is required'],
    enum: [
      'chest',
      'back',
      'legs',
      'quads',
      'hamstrings',
      'calves',
      'shoulders',
      'biceps',
      'triceps',
      'arms',
      'core',
      'abs',
      'full_body',
      'cardio',
    ],
    lowercase: true,
    trim: true,
  },
  category: {
    type: String,
    required: [true, 'Exercise category is required'],
    enum: ['strength', 'hypertrophy', 'bodyweight', 'cardio', 'mobility', 'other'],
    default: 'strength',
  },
  equipmentRequired: {
    type: String,
    required: [true, 'Equipment is required'],
    enum: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'bands', 'other'],
    default: 'barbell',
  },
  instructions: {
    type: String,
    trim: true,
    default: '',
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null means predefined library exercise available to all users
  },
}, {
  timestamps: true,
});

// Indexes for high performance searches and user filters
exerciseSchema.index({ user: 1, name: 1 });
exerciseSchema.index({ targetMuscleGroup: 1 });
exerciseSchema.index({ isCustom: 1, user: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
