const WorkoutSession = require('../models/WorkoutSession');
const User = require('../models/User');
const { predefinedSplits } = require('../seeds/exerciseSeeds');

// @desc    Get available workout splits & current user's selected split
// @route   GET /api/workouts/splits
// @access  Private
const getSplits = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      predefinedSplits,
      currentSplit: user.preferredSplit,
      customSplit: user.customSplit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user's workout split preference
// @route   PUT /api/workouts/splits
// @access  Private
const updateSplit = async (req, res, next) => {
  try {
    const { preferredSplit, customSplit } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Validate custom split data when switching to custom
    if (preferredSplit === 'custom' || customSplit) {
      const splitData = customSplit || user.customSplit;

      if (preferredSplit === 'custom' && splitData) {
        // Validate routine name
        if (!splitData.routineName || !splitData.routineName.trim()) {
          return res.status(400).json({
            success: false,
            message: 'Custom routine name is required.',
          });
        }

        // Validate at least one training day
        if (!splitData.days || splitData.days.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'At least one training day is required.',
          });
        }

        // Validate each day
        for (let i = 0; i < splitData.days.length; i++) {
          const day = splitData.days[i];
          if (!day.name || !day.name.trim()) {
            return res.status(400).json({
              success: false,
              message: `Training day ${i + 1} must have a name.`,
            });
          }
          // Filter out empty exercise entries
          if (day.exercises) {
            day.exercises = day.exercises.filter((ex) => ex && ex.trim());
          }
        }
      }
    }

    if (preferredSplit) {
      user.preferredSplit = preferredSplit;
    }

    if (customSplit) {
      user.customSplit = customSplit;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Workout split updated successfully',
      preferredSplit: user.preferredSplit,
      customSplit: user.customSplit,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save/Finish a completed workout session
// @route   POST /api/workouts
// @access  Private
const saveWorkout = async (req, res, next) => {
  try {
    const {
      title,
      splitType = 'other',
      date = new Date(),
      startTime,
      endTime,
      durationMinutes,
      exercises = [],
      notes = '',
      clientRequestId, // For duplicate submission prevention
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Workout title is required.',
      });
    }

    if (!exercises || exercises.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please add at least one exercise to your workout session.',
      });
    }

    // Check for accidental duplicate submission within past 30 seconds with identical title
    const recentDuplicate = await WorkoutSession.findOne({
      user: req.user.id,
      title: title.trim(),
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Workout already recorded.',
        workout: recentDuplicate,
      });
    }

    // Calculate duration if start and end times are provided
    let calculatedDuration = durationMinutes;
    if (!calculatedDuration && startTime && endTime) {
      const diffMs = new Date(endTime) - new Date(startTime);
      calculatedDuration = Math.max(1, Math.round(diffMs / 60000));
    }

    // Sanitize exercises and sets
    const sanitizedExercises = exercises.map((ex) => ({
      exercise: ex.exercise || null,
      name: ex.name,
      targetMuscleGroup: ex.targetMuscleGroup || 'other',
      isBodyweight: Boolean(ex.isBodyweight),
      notes: ex.notes || '',
      sets: (ex.sets || []).map((s, idx) => ({
        setNumber: s.setNumber || idx + 1,
        reps: Number(s.reps) || 0,
        weight: ex.isBodyweight ? 0 : Number(s.weight) || 0,
        completed: s.completed !== undefined ? Boolean(s.completed) : true,
        notes: s.notes || '',
      })),
    }));

    const workout = await WorkoutSession.create({
      user: req.user.id,
      title: title.trim(),
      splitType,
      date: new Date(date),
      startTime: startTime ? new Date(startTime) : null,
      endTime: endTime ? new Date(endTime) : new Date(),
      durationMinutes: calculatedDuration || 0,
      exercises: sanitizedExercises,
      notes: notes.trim(),
      isCompleted: true,
    });

    res.status(201).json({
      success: true,
      message: 'Workout saved successfully',
      workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's workout history with filters
// @route   GET /api/workouts
// @access  Private
const getWorkoutHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, splitType, limit = 50, page = 1 } = req.query;

    const query = { user: req.user.id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (splitType && splitType !== 'all') {
      query.splitType = splitType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [workouts, total] = await Promise.all([
      WorkoutSession.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      WorkoutSession.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: workouts.length,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      workouts,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout session details by ID
// @route   GET /api/workouts/:id
// @access  Private
const getWorkoutById = async (req, res, next) => {
  try {
    const workout = await WorkoutSession.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (workout.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this workout' });
    }

    res.status(200).json({
      success: true,
      workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update workout session
// @route   PUT /api/workouts/:id
// @access  Private
const updateWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutSession.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (workout.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this workout' });
    }

    const { title, splitType, date, durationMinutes, exercises, notes } = req.body;

    if (title !== undefined) workout.title = title.trim();
    if (splitType !== undefined) workout.splitType = splitType;
    if (date !== undefined) workout.date = new Date(date);
    if (durationMinutes !== undefined) workout.durationMinutes = Number(durationMinutes);
    if (notes !== undefined) workout.notes = notes.trim();
    if (exercises !== undefined) workout.exercises = exercises;

    await workout.save();

    res.status(200).json({
      success: true,
      message: 'Workout updated successfully',
      workout,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete workout session
// @route   DELETE /api/workouts/:id
// @access  Private
const deleteWorkout = async (req, res, next) => {
  try {
    const workout = await WorkoutSession.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ success: false, message: 'Workout not found' });
    }

    if (workout.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this workout' });
    }

    await workout.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Workout deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSplits,
  updateSplit,
  saveWorkout,
  getWorkoutHistory,
  getWorkoutById,
  updateWorkout,
  deleteWorkout,
};
