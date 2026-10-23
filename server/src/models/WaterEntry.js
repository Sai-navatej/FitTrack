const mongoose = require('mongoose');

const waterEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  amountMl: {
    type: Number,
    required: [true, 'Water amount in ml is required'],
    min: [10, 'Amount must be at least 10 ml'],
    max: [5000, 'Amount cannot exceed 5000 ml per entry'],
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for daily water aggregation and history
waterEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('WaterEntry', waterEntrySchema);
