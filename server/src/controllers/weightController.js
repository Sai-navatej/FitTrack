const WeightMeasurement = require('../models/WeightMeasurement');
const User = require('../models/User');

// @desc    Add a new weight measurement
// @route   POST /api/weight
// @access  Private
const addWeight = async (req, res, next) => {
  try {
    const { weight, unit, date = new Date(), notes = '' } = req.body;

    if (!weight) {
      return res.status(400).json({
        success: false,
        message: 'Weight value is required.',
      });
    }

    const user = await User.findById(req.user.id);
    const weightUnit = unit || user.weightUnit || 'kg';

    const entry = await WeightMeasurement.create({
      user: req.user.id,
      weight: Number(weight),
      unit: weightUnit,
      date: new Date(date),
      notes: notes.trim(),
    });

    // Check if this newly added entry is the latest measurement chronologically
    const latest = await WeightMeasurement.findOne({ user: req.user.id }).sort({ date: -1 });
    if (latest && latest._id.toString() === entry._id.toString()) {
      user.currentWeight = Number(weight);
      user.weightUnit = weightUnit;
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Weight measurement logged successfully',
      measurement: entry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weight history with stats (difference from previous, change over time)
// @route   GET /api/weight
// @access  Private
const getWeightHistory = async (req, res, next) => {
  try {
    const { days } = req.query;
    const query = { user: req.user.id };

    if (days && days !== 'all') {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Number(days));
      query.date = { $gte: pastDate };
    }

    const measurements = await WeightMeasurement.find(query).sort({ date: 1 });

    const user = await User.findById(req.user.id);
    const currentWeight = user ? user.currentWeight : (measurements[measurements.length - 1]?.weight || 0);
    const unit = user ? user.weightUnit : 'kg';

    // Calculate difference between latest and previous
    let latestDifference = 0;
    if (measurements.length >= 2) {
      const latest = measurements[measurements.length - 1].weight;
      const prev = measurements[measurements.length - 2].weight;
      latestDifference = Math.round((latest - prev) * 100) / 100;
    }

    // Overall change in the selected period
    let periodChange = 0;
    if (measurements.length >= 2) {
      const first = measurements[0].weight;
      const last = measurements[measurements.length - 1].weight;
      periodChange = Math.round((last - first) * 100) / 100;
    }

    res.status(200).json({
      success: true,
      count: measurements.length,
      currentWeight,
      unit,
      latestDifference,
      periodChange,
      measurements,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a weight measurement
// @route   PUT /api/weight/:id
// @access  Private
const updateWeight = async (req, res, next) => {
  try {
    const measurement = await WeightMeasurement.findById(req.params.id);

    if (!measurement) {
      return res.status(404).json({ success: false, message: 'Weight measurement not found' });
    }

    if (measurement.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this measurement' });
    }

    const { weight, unit, date, notes } = req.body;

    if (weight !== undefined) measurement.weight = Number(weight);
    if (unit !== undefined) measurement.unit = unit;
    if (date !== undefined) measurement.date = new Date(date);
    if (notes !== undefined) measurement.notes = notes.trim();

    await measurement.save();

    // Sync latest user weight
    const latest = await WeightMeasurement.findOne({ user: req.user.id }).sort({ date: -1 });
    if (latest) {
      await User.findByIdAndUpdate(req.user.id, {
        currentWeight: latest.weight,
        weightUnit: latest.unit,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Weight measurement updated successfully',
      measurement,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a weight measurement
// @route   DELETE /api/weight/:id
// @access  Private
const deleteWeight = async (req, res, next) => {
  try {
    const measurement = await WeightMeasurement.findById(req.params.id);

    if (!measurement) {
      return res.status(404).json({ success: false, message: 'Weight measurement not found' });
    }

    if (measurement.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this measurement' });
    }

    await measurement.deleteOne();

    // Resync latest user weight
    const latest = await WeightMeasurement.findOne({ user: req.user.id }).sort({ date: -1 });
    if (latest) {
      await User.findByIdAndUpdate(req.user.id, {
        currentWeight: latest.weight,
        weightUnit: latest.unit,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Weight measurement deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addWeight,
  getWeightHistory,
  updateWeight,
  deleteWeight,
};
