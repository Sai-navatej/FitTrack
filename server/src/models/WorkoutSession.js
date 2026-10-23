const mongoose = require('mongoose');

const workoutSetSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: true,
    min: 1,
  },
  reps: {
    type: Number,
    required: true,
    min: 0,
  },
  weight: {
    type: Number,
    default: 0,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: true,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
}, { _id: false });

const workoutExerciseSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  targetMuscleGroup: {
    type: String,
    trim: true,
    default: 'other',
  },
  isBodyweight: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  sets: [workoutSetSchema],
}, { _id: true });

const workoutSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Workout title is required'],
    trim: true,
    default: 'Workout Session',
  },
  splitType: {
    type: String,
    enum: ['ppl', 'upper_lower', 'bro_split', 'full_body', 'custom', 'other'],
    default: 'other',
  },
  date: {
    type: Date,
    default: Date.now,
    required: true,
  },
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
  durationMinutes: {
    type: Number,
    default: 0,
    min: 0,
  },
  exercises: [workoutExerciseSchema],
  totalVolume: {
    type: Number,
    default: 0, // external weight * reps * sets (where weight > 0)
  },
  notes: {
    type: String,
    trim: true,
    default: '',
  },
  isCompleted: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Calculate total volume pre-save if not explicitly set
workoutSessionSchema.pre('save', function (next) {
  let volume = 0;
  if (this.exercises && Array.isArray(this.exercises)) {
    this.exercises.forEach((ex) => {
      if (ex.sets && Array.isArray(ex.sets)) {
        ex.sets.forEach((set) => {
          if (set.completed && set.weight && set.reps) {
            volume += Number(set.weight) * Number(set.reps);
          }
        });
      }
    });
  }
  this.totalVolume = Math.round(volume * 100) / 100;
  next();
});

// Compound index for user workout history timeline queries
workoutSessionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
