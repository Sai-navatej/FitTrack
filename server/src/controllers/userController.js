const User = require('../models/User');
const WeightMeasurement = require('../models/WeightMeasurement');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      fullName,
      age,
      height,
      currentWeight,
      weightUnit,
      fitnessGoal,
      preferredSplit,
      customSplit,
      dailyCalorieTarget,
      dailyWaterTarget,
    } = req.body;

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (age !== undefined) user.age = Number(age);
    if (height !== undefined) user.height = Number(height);
    if (weightUnit !== undefined) user.weightUnit = weightUnit;
    if (fitnessGoal !== undefined) user.fitnessGoal = fitnessGoal;
    if (preferredSplit !== undefined) user.preferredSplit = preferredSplit;
    if (customSplit !== undefined) user.customSplit = customSplit;
    if (dailyCalorieTarget !== undefined) user.dailyCalorieTarget = Number(dailyCalorieTarget);
    if (dailyWaterTarget !== undefined) user.dailyWaterTarget = Number(dailyWaterTarget);

    // If current weight changed, save new measurement to history rather than overwriting past history
    if (currentWeight !== undefined && Number(currentWeight) !== user.currentWeight) {
      const newWeight = Number(currentWeight);
      user.currentWeight = newWeight;

      await WeightMeasurement.create({
        user: user._id,
        weight: newWeight,
        unit: weightUnit || user.weightUnit || 'kg',
        date: new Date(),
        notes: 'Profile weight update',
      });
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update water reminder preferences
// @route   PUT /api/users/reminder-preferences
// @access  Private
const updateReminderPreferences = async (req, res, next) => {
  try {
    const { enabled, intervalMinutes, wakingHourStart, wakingHourEnd } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.reminderPreferences = {
      enabled: enabled !== undefined ? Boolean(enabled) : user.reminderPreferences.enabled,
      intervalMinutes: intervalMinutes !== undefined ? Number(intervalMinutes) : user.reminderPreferences.intervalMinutes,
      wakingHourStart: wakingHourStart !== undefined ? Number(wakingHourStart) : user.reminderPreferences.wakingHourStart,
      wakingHourEnd: wakingHourEnd !== undefined ? Number(wakingHourEnd) : user.reminderPreferences.wakingHourEnd,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Reminder preferences updated successfully',
      reminderPreferences: user.reminderPreferences,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateReminderPreferences,
};
