const WorkoutSession = require('../models/WorkoutSession');
const WeightMeasurement = require('../models/WeightMeasurement');
const FoodEntry = require('../models/FoodEntry');
const WaterEntry = require('../models/WaterEntry');
const User = require('../models/User');

// Helper to calculate date cutoff based on time range filter
const getFilterDate = (range) => {
  if (!range || range === 'all') return null;
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : Number(range) || 30;
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
};

// @desc    Get dashboard summary cards (current weight, weight change, calories, water, workouts)
// @route   GET /api/progress/dashboard
// @access  Private
const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const user = await User.findById(userId);

    // Run parallel queries for maximum speed
    const [
      totalWorkouts,
      recentWorkouts,
      todayFoodEntries,
      todayWaterEntries,
      recentWeights,
    ] = await Promise.all([
      WorkoutSession.countDocuments({ user: userId }),
      WorkoutSession.find({ user: userId }).sort({ date: -1 }).limit(5),
      FoodEntry.find({ user: userId, date: { $gte: todayStart, $lte: todayEnd } }),
      WaterEntry.find({ user: userId, date: { $gte: todayStart, $lte: todayEnd } }),
      WeightMeasurement.find({ user: userId }).sort({ date: -1 }).limit(2),
    ]);

    // Nutrition today
    const caloriesConsumedToday = todayFoodEntries.reduce((sum, item) => sum + item.calories, 0);
    const dailyCalorieTarget = user ? user.dailyCalorieTarget : 2200;
    const caloriesRemaining = Math.max(0, dailyCalorieTarget - caloriesConsumedToday);

    // Water today
    const waterConsumedToday = todayWaterEntries.reduce((sum, item) => sum + item.amountMl, 0);
    const dailyWaterTarget = user ? user.dailyWaterTarget : 2500;
    const waterRemaining = Math.max(0, dailyWaterTarget - waterConsumedToday);

    // Weight difference
    const currentWeight = user ? user.currentWeight : (recentWeights[0]?.weight || 0);
    const weightUnit = user ? user.weightUnit : 'kg';
    let weightDiff = 0;
    if (recentWeights.length >= 2) {
      weightDiff = Math.round((recentWeights[0].weight - recentWeights[1].weight) * 100) / 100;
    }

    // Determine today's workout based on split and recent history
    const splitType = user ? user.preferredSplit : 'ppl';
    let suggestedWorkoutName = 'General Workout';
    if (splitType === 'ppl') {
      const lastSession = recentWorkouts[0];
      if (!lastSession || lastSession.title.toLowerCase().includes('leg')) {
        suggestedWorkoutName = 'Push Day';
      } else if (lastSession.title.toLowerCase().includes('push')) {
        suggestedWorkoutName = 'Pull Day';
      } else {
        suggestedWorkoutName = 'Leg Day';
      }
    } else if (splitType === 'upper_lower') {
      const lastSession = recentWorkouts[0];
      if (!lastSession || lastSession.title.toLowerCase().includes('lower')) {
        suggestedWorkoutName = 'Upper Body';
      } else {
        suggestedWorkoutName = 'Lower Body';
      }
    } else if (splitType === 'full_body') {
      suggestedWorkoutName = 'Full Body Day';
    } else if (splitType === 'bro_split') {
      suggestedWorkoutName = 'Chest Day';
    }

    res.status(200).json({
      success: true,
      data: {
        currentWeight,
        weightUnit,
        weightDiff,
        totalWorkouts,
        suggestedTodayWorkout: suggestedWorkoutName,
        caloriesConsumedToday,
        dailyCalorieTarget,
        caloriesRemaining,
        waterConsumedToday,
        dailyWaterTarget,
        waterRemaining,
        recentWorkouts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workout frequency statistics (completed workouts per week / day)
// @route   GET /api/progress/frequency
// @access  Private
const getWorkoutFrequency = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const filterDate = getFilterDate(range);

    const query = { user: req.user.id };
    if (filterDate) {
      query.date = { $gte: filterDate };
    }

    const workouts = await WorkoutSession.find(query).sort({ date: 1 });

    // Group workouts by week or day
    const frequencyMap = {};
    workouts.forEach((w) => {
      const d = new Date(w.date);
      // Format as YYYY-MM-DD
      const dateKey = d.toISOString().split('T')[0];
      frequencyMap[dateKey] = (frequencyMap[dateKey] || 0) + 1;
    });

    const frequencyData = Object.keys(frequencyMap).map((date) => ({
      date,
      count: frequencyMap[date],
    }));

    res.status(200).json({
      success: true,
      totalCount: workouts.length,
      frequency: frequencyData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get strength progression for a specific exercise over time
// @route   GET /api/progress/strength
// @access  Private
const getStrengthHistory = async (req, res, next) => {
  try {
    const { exerciseName, range = 'all' } = req.query;

    if (!exerciseName) {
      return res.status(400).json({
        success: false,
        message: 'exerciseName query parameter is required',
      });
    }

    const filterDate = getFilterDate(range);
    const query = {
      user: req.user.id,
      'exercises.name': { $regex: `^${exerciseName.trim()}$`, $options: 'i' },
    };

    if (filterDate) {
      query.date = { $gte: filterDate };
    }

    const sessions = await WorkoutSession.find(query).sort({ date: 1 });

    const strengthData = [];

    sessions.forEach((session) => {
      const match = session.exercises.find(
        (e) => e.name.toLowerCase() === exerciseName.trim().toLowerCase()
      );

      if (match && match.sets && match.sets.length > 0) {
        let maxWeight = 0;
        let totalVolume = 0;
        let bestSetReps = 0;

        match.sets.forEach((set) => {
          if (set.completed) {
            const w = Number(set.weight) || 0;
            const r = Number(set.reps) || 0;
            if (w > maxWeight) {
              maxWeight = w;
              bestSetReps = r;
            }
            totalVolume += w * r;
          }
        });

        strengthData.push({
          date: session.date.toISOString().split('T')[0],
          workoutTitle: session.title,
          maxWeight,
          repsAtMax: bestSetReps,
          totalVolume,
          isBodyweight: match.isBodyweight,
        });
      }
    });

    res.status(200).json({
      success: true,
      exerciseName,
      data: strengthData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get muscle group distribution
// @route   GET /api/progress/distribution
// @access  Private
const getMuscleDistribution = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const filterDate = getFilterDate(range);

    const query = { user: req.user.id };
    if (filterDate) {
      query.date = { $gte: filterDate };
    }

    const sessions = await WorkoutSession.find(query);

    const muscleCounts = {};
    let totalExerciseInstances = 0;

    sessions.forEach((s) => {
      (s.exercises || []).forEach((e) => {
        let group = e.targetMuscleGroup ? e.targetMuscleGroup.toLowerCase() : 'other';
        // Normalize sub-groups
        if (['biceps', 'triceps', 'forearms'].includes(group)) group = 'arms';
        if (['quads', 'hamstrings', 'calves', 'glutes'].includes(group)) group = 'legs';
        if (['abs', 'core'].includes(group)) group = 'core';

        muscleCounts[group] = (muscleCounts[group] || 0) + 1;
        totalExerciseInstances += 1;
      });
    });

    const distribution = Object.keys(muscleCounts).map((muscle) => ({
      muscle: muscle.charAt(0).toUpperCase() + muscle.slice(1),
      count: muscleCounts[muscle],
      percentage: totalExerciseInstances > 0 ? Math.round((muscleCounts[muscle] / totalExerciseInstances) * 100) : 0,
    })).sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      totalExercisesPerformed: totalExerciseInstances,
      distribution,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get total training volume over time
// @route   GET /api/progress/volume
// @access  Private
const getVolumeHistory = async (req, res, next) => {
  try {
    const { range = '30d' } = req.query;
    const filterDate = getFilterDate(range);

    const query = { user: req.user.id };
    if (filterDate) {
      query.date = { $gte: filterDate };
    }

    const sessions = await WorkoutSession.find(query).sort({ date: 1 });

    const volumeData = sessions.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      title: s.title,
      totalVolume: s.totalVolume || 0,
    }));

    res.status(200).json({
      success: true,
      note: 'Volume calculated as sets * reps * external weight (kg/lbs). For pure bodyweight exercises without added weight, external load is 0.',
      volumeData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getWorkoutFrequency,
  getStrengthHistory,
  getMuscleDistribution,
  getVolumeHistory,
};
