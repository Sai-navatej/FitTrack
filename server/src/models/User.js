const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customSplitDaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  exercises: [{
    type: String,
    trim: true,
  }],
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Never return password hash in queries unless explicitly requested
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [10, 'Age must be at least 10'],
    max: [120, 'Age cannot exceed 120'],
  },
  height: {
    type: Number,
    required: [true, 'Height is required (in cm)'],
    min: [50, 'Height must be at least 50 cm'],
    max: [300, 'Height cannot exceed 300 cm'],
  },
  currentWeight: {
    type: Number,
    required: [true, 'Current weight is required'],
    min: [20, 'Weight must be at least 20'],
    max: [500, 'Weight cannot exceed 500'],
  },
  weightUnit: {
    type: String,
    enum: ['kg', 'lbs'],
    default: 'kg',
  },
  fitnessGoal: {
    type: String,
    enum: ['muscle_gain', 'fat_loss', 'maintenance'],
    default: 'maintenance',
  },
  preferredSplit: {
    type: String,
    enum: ['ppl', 'upper_lower', 'bro_split', 'full_body', 'custom'],
    default: 'ppl',
  },
  customSplit: {
    days: [customSplitDaySchema],
  },
  dailyCalorieTarget: {
    type: Number,
    default: 2200,
    min: [500, 'Calorie target must be at least 500 kcal'],
    max: [10000, 'Calorie target cannot exceed 10000 kcal'],
  },
  dailyWaterTarget: {
    type: Number,
    default: 2500, // in milliliters
    min: [500, 'Water target must be at least 500 ml'],
    max: [10000, 'Water target cannot exceed 10000 ml'],
  },
  reminderPreferences: {
    enabled: {
      type: Boolean,
      default: true,
    },
    intervalMinutes: {
      type: Number,
      default: 120, // 2 hours
      min: 15,
      max: 720,
    },
    wakingHourStart: {
      type: Number,
      default: 8, // 08:00
      min: 0,
      max: 23,
    },
    wakingHourEnd: {
      type: Number,
      default: 22, // 22:00
      min: 0,
      max: 23,
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Remove sensitive fields in JSON conversion
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
