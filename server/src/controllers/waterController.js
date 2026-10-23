const WaterEntry = require('../models/WaterEntry');
const User = require('../models/User');

// @desc    Log water intake
// @route   POST /api/water
// @access  Private
const logWater = async (req, res, next) => {
  try {
    const { amountMl, date = new Date() } = req.body;

    if (!amountMl || Number(amountMl) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Water amount in ml must be greater than 0.',
      });
    }

    const entry = await WaterEntry.create({
      user: req.user.id,
      amountMl: Number(amountMl),
      date: new Date(date),
    });

    res.status(201).json({
      success: true,
      message: 'Water logged successfully',
      entry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily water total and progress
// @route   GET /api/water/daily
// @access  Private
const getDailyWater = async (req, res, next) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await WaterEntry.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ createdAt: -1 });

    const totalConsumedMl = entries.reduce((sum, item) => sum + item.amountMl, 0);

    const user = await User.findById(req.user.id);
    const targetMl = user ? user.dailyWaterTarget : 2500;
    const remainingMl = Math.max(0, targetMl - totalConsumedMl);
    const percentage = Math.min(100, Math.round((totalConsumedMl / targetMl) * 100));

    res.status(200).json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      totalConsumedMl,
      targetMl,
      remainingMl,
      percentage,
      entries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get water intake history for past days
// @route   GET /api/water/history
// @access  Private
const getWaterHistory = async (req, res, next) => {
  try {
    const days = Number(req.query.days) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const entries = await WaterEntry.find({
      user: req.user.id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    // Group by day (YYYY-MM-DD)
    const dailyMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split('T')[0];
      dailyMap[dateKey] = 0;
    }

    entries.forEach((e) => {
      const dateKey = new Date(e.date).toISOString().split('T')[0];
      if (dailyMap[dateKey] !== undefined) {
        dailyMap[dateKey] += e.amountMl;
      }
    });

    const history = Object.keys(dailyMap).map((date) => ({
      date,
      amountMl: dailyMap[date],
    }));

    res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a water entry
// @route   DELETE /api/water/:id
// @access  Private
const deleteWaterEntry = async (req, res, next) => {
  try {
    const entry = await WaterEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({ success: false, message: 'Water entry not found' });
    }

    if (entry.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry' });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Water entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  logWater,
  getDailyWater,
  getWaterHistory,
  deleteWaterEntry,
};
