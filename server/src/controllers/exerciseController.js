const Exercise = require('../models/Exercise');

// @desc    Get all available exercises (predefined + user's custom exercises)
// @route   GET /api/exercises
// @access  Private
const getExercises = async (req, res, next) => {
  try {
    const { search, muscleGroup, category, equipment, filter } = req.query;

    const query = {
      $or: [
        { user: null },
        { user: req.user.id },
      ],
    };

    if (filter === 'custom') {
      query.user = req.user.id;
      delete query.$or;
    } else if (filter === 'predefined') {
      query.user = null;
      delete query.$or;
    }

    if (search) {
      query.name = { $regex: search.trim(), $options: 'i' };
    }

    if (muscleGroup && muscleGroup !== 'all') {
      query.targetMuscleGroup = muscleGroup.toLowerCase();
    }

    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    if (equipment && equipment !== 'all') {
      query.equipmentRequired = equipment.toLowerCase();
    }

    const exercises = await Exercise.find(query).sort({ isCustom: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: exercises.length,
      exercises,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single exercise by ID
// @route   GET /api/exercises/:id
// @access  Private
const getExerciseById = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    // Check ownership if custom
    if (exercise.user && exercise.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this exercise' });
    }

    res.status(200).json({
      success: true,
      exercise,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a custom exercise for user
// @route   POST /api/exercises
// @access  Private
const createCustomExercise = async (req, res, next) => {
  try {
    const {
      name,
      targetMuscleGroup,
      category = 'hypertrophy',
      equipmentRequired = 'other',
      instructions = '',
    } = req.body;

    if (!name || !targetMuscleGroup) {
      return res.status(400).json({
        success: false,
        message: 'Exercise name and target muscle group are required.',
      });
    }

    // Check if user already created an exercise with this name
    const existing = await Exercise.findOne({
      user: req.user.id,
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a custom exercise with this name.',
      });
    }

    const exercise = await Exercise.create({
      name: name.trim(),
      targetMuscleGroup: targetMuscleGroup.toLowerCase().trim(),
      category: category.toLowerCase().trim(),
      equipmentRequired: equipmentRequired.toLowerCase().trim(),
      instructions: instructions.trim(),
      isCustom: true,
      user: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Custom exercise created successfully',
      exercise,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user's custom exercise
// @route   DELETE /api/exercises/:id
// @access  Private
const deleteCustomExercise = async (req, res, next) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ success: false, message: 'Exercise not found' });
    }

    if (!exercise.isCustom || !exercise.user) {
      return res.status(400).json({ success: false, message: 'Predefined exercises cannot be deleted' });
    }

    if (exercise.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this exercise' });
    }

    await exercise.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Custom exercise deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExercises,
  getExerciseById,
  createCustomExercise,
  deleteCustomExercise,
};
