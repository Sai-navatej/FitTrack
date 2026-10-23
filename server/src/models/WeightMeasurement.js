const mongoose = require('mongoose');

const weightMeasurementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  weight: {
    type: Number,
    required: [true, 'Weight measurement is required'],
    min: [20, 'Weight must be at least 20'],
    max: [500, 'Weight cannot exceed 500'],
  },
  unit: {
    type: String,
    enum: ['kg', 'lbs'],
    default: 'kg',
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

// Indexes for chronological weight queries and sorting
weightMeasurementSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('WeightMeasurement', weightMeasurementSchema);
