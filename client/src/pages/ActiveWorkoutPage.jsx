import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Timer,
  Play,
  CheckCircle2,
  Plus,
  Trash2,
  Dumbbell,
  AlertCircle,
  Save,
  ArrowLeft,
  X,
} from 'lucide-react';
import { workoutService } from '../services/workoutService';
import { exerciseService } from '../services/exerciseService';
import { useNotification } from '../context/NotificationContext';
import Modal from '../components/common/Modal';

const ActiveWorkoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [workoutTitle, setWorkoutTitle] = useState(
    location.state?.title || 'Push Day Session'
  );
  const [splitType, setSplitType] = useState(location.state?.splitType || 'ppl');
  const [exercises, setExercises] = useState(
    location.state?.initialExercises || [
      {
        name: 'Barbell Bench Press',
        targetMuscleGroup: 'chest',
        isBodyweight: false,
        sets: [
          { setNumber: 1, reps: 10, weight: 60, completed: false },
          { setNumber: 2, reps: 8, weight: 70, completed: false },
          { setNumber: 3, reps: 6, weight: 80, completed: false },
        ],
      },
      {
        name: 'Incline Dumbbell Press',
        targetMuscleGroup: 'chest',
        isBodyweight: false,
        sets: [
          { setNumber: 1, reps: 12, weight: 24, completed: false },
          { setNumber: 2, reps: 10, weight: 26, completed: false },
          { setNumber: 3, reps: 10, weight: 26, completed: false },
        ],
      },
      {
        name: 'Shoulder Press',
        targetMuscleGroup: 'shoulders',
        isBodyweight: false,
        sets: [
          { setNumber: 1, reps: 10, weight: 20, completed: false },
          { setNumber: 2, reps: 10, weight: 20, completed: false },
        ],
      },
    ]
  );

  const [notes, setNotes] = useState('');
  const [startTime] = useState(new Date());
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add Exercise Modal state
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [availableExercises, setAvailableExercises] = useState([]);
  const [searchExercise, setSearchExercise] = useState('');

  // Live workout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(secs)}`
      : `${pad(minutes)}:${pad(secs)}`;
  };

  // Load library exercises for the "Add Exercise" selector
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const res = await exerciseService.getExercises();
        if (res.success) {
          setAvailableExercises(res.exercises);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadExercises();
  }, []);

  // Set management
  const addSet = (exerciseIndex) => {
    setExercises((prev) => {
      const updated = [...prev];
      const currentSets = updated[exerciseIndex].sets;
      const lastSet = currentSets[currentSets.length - 1] || { reps: 10, weight: 20 };
      currentSets.push({
        setNumber: currentSets.length + 1,
        reps: lastSet.reps,
        weight: updated[exerciseIndex].isBodyweight ? 0 : lastSet.weight,
        completed: false,
      });
      return updated;
    });
  };

  const removeSet = (exerciseIndex, setIndex) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets = updated[exerciseIndex].sets
        .filter((_, idx) => idx !== setIndex)
        .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return updated;
    });
  };

  const updateSetField = (exerciseIndex, setIndex, field, value) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].sets[setIndex][field] = value;
      return updated;
    });
  };

  const toggleSetComplete = (exerciseIndex, setIndex) => {
    setExercises((prev) => {
      const updated = [...prev];
      const current = updated[exerciseIndex].sets[setIndex].completed;
      updated[exerciseIndex].sets[setIndex].completed = !current;
      return updated;
    });
  };

  const removeExercise = (exerciseIndex) => {
    setExercises((prev) => prev.filter((_, idx) => idx !== exerciseIndex));
  };

  const handleAddExerciseFromLibrary = (exercise) => {
    setExercises((prev) => [
      ...prev,
      {
        exercise: exercise._id,
        name: exercise.name,
        targetMuscleGroup: exercise.targetMuscleGroup,
        isBodyweight: exercise.equipmentRequired === 'bodyweight',
        sets: [
          { setNumber: 1, reps: 10, weight: exercise.equipmentRequired === 'bodyweight' ? 0 : 20, completed: false },
          { setNumber: 2, reps: 10, weight: exercise.equipmentRequired === 'bodyweight' ? 0 : 20, completed: false },
          { setNumber: 3, reps: 10, weight: exercise.equipmentRequired === 'bodyweight' ? 0 : 20, completed: false },
        ],
      },
    ]);
    setIsAddExerciseModalOpen(false);
    showSuccess(`Added ${exercise.name} to session`);
  };

  const handleFinishWorkout = async () => {
    if (exercises.length === 0) {
      showError('Please include at least one exercise in your workout.');
      return;
    }

    if (isSubmitting) return; // Prevent double submit

    try {
      setIsSubmitting(true);
      const endTime = new Date();
      const durationMinutes = Math.max(1, Math.round(secondsElapsed / 60));

      const payload = {
        title: workoutTitle.trim() || 'Gym Workout',
        splitType,
        date: new Date(),
        startTime,
        endTime,
        durationMinutes,
        exercises,
        notes,
      };

      const res = await workoutService.saveWorkout(payload);
      if (res.success) {
        showSuccess(`Workout Completed! Logged ${durationMinutes} mins.`);
        navigate('/history');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to finish workout');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Active Workout Header Bar */}
      <div className="sticky top-16 z-10 glass-panel p-4 rounded-2xl border border-primary/30 shadow-glow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/workouts')}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">LIVE WORKOUT IN PROGRESS</span>
            </div>
            <input
              type="text"
              value={workoutTitle}
              onChange={(e) => setWorkoutTitle(e.target.value)}
              className="text-xl font-black bg-transparent border-b border-transparent hover:border-neutral-700 focus:border-primary text-neutral-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center justify-between w-full sm:w-auto space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-mono font-bold text-neutral-200">
            <Timer className="w-4 h-4 text-primary" />
            <span>{formatTime(secondsElapsed)}</span>
          </div>

          <button
            onClick={handleFinishWorkout}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 fill-dark-950 text-primary" />
            <span>{isSubmitting ? 'Saving...' : 'Finish Workout'}</span>
          </button>
        </div>
      </div>

      {/* Exercises Section */}
      <div className="space-y-4">
        {exercises.map((exercise, exIdx) => (
          <div
            key={exIdx}
            className="glass-card rounded-3xl border border-neutral-800 p-5 space-y-4 transition-all"
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                  {exIdx + 1}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-100">{exercise.name}</h3>
                  <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
                    <span className="capitalize">{exercise.targetMuscleGroup}</span>
                    {exercise.isBodyweight && (
                      <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 text-[10px] font-bold">
                        Bodyweight
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeExercise(exIdx)}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                title="Remove exercise from workout"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Sets Table Header */}
            <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase text-neutral-400 px-2 tracking-wider">
              <div className="col-span-2 text-center">Set</div>
              <div className="col-span-4 text-center">Reps</div>
              <div className="col-span-4 text-center">Weight (kg)</div>
              <div className="col-span-2 text-center">Done</div>
            </div>

            {/* Sets Rows */}
            <div className="space-y-2">
              {exercise.sets.map((set, sIdx) => (
                <div
                  key={sIdx}
                  className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl transition-all ${
                    set.completed
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-neutral-900/60 border border-neutral-800'
                  }`}
                >
                  <div className="col-span-2 text-center font-bold text-xs text-neutral-400">
                    {set.setNumber}
                  </div>

                  <div className="col-span-4 flex justify-center">
                    <input
                      type="number"
                      min="0"
                      value={set.reps}
                      onChange={(e) => updateSetField(exIdx, sIdx, 'reps', Number(e.target.value))}
                      className="w-16 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-center text-sm font-semibold text-neutral-100 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="col-span-4 flex justify-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      disabled={exercise.isBodyweight}
                      value={exercise.isBodyweight ? 0 : set.weight}
                      onChange={(e) => updateSetField(exIdx, sIdx, 'weight', Number(e.target.value))}
                      placeholder={exercise.isBodyweight ? 'BW' : 'kg'}
                      className="w-16 px-2 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-center text-sm font-semibold text-neutral-100 focus:outline-none focus:border-primary disabled:opacity-40"
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-center space-x-1">
                    <button
                      type="button"
                      onClick={() => toggleSetComplete(exIdx, sIdx)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        set.completed
                          ? 'bg-primary text-dark-950 shadow-glow-sm'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                    {exercise.sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSet(exIdx, sIdx)}
                        className="text-neutral-500 hover:text-red-400 p-1"
                        title="Delete Set"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => addSet(exIdx)}
              className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-primary text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Set</span>
            </button>
          </div>
        ))}

        {/* Add Exercise Button */}
        <button
          type="button"
          onClick={() => setIsAddExerciseModalOpen(true)}
          className="w-full py-4 border-2 border-dashed border-neutral-800 hover:border-primary/50 rounded-3xl text-neutral-400 hover:text-primary flex items-center justify-center space-x-2 text-sm font-bold transition-all bg-neutral-950/40 hover:bg-neutral-900/40"
        >
          <Plus className="w-5 h-5" />
          <span>Add Exercise from Library</span>
        </button>
      </div>

      {/* Session Notes */}
      <div className="glass-panel p-5 rounded-3xl border border-neutral-800">
        <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
          Session Notes & Observations
        </label>
        <textarea
          rows="3"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How did you feel today? Any personal records or tweaks to form?"
          className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-primary"
        />
      </div>

      {/* Add Exercise Modal */}
      <Modal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        title="Add Exercise to Workout"
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={searchExercise}
            onChange={(e) => setSearchExercise(e.target.value)}
            placeholder="Search exercises by name..."
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-primary"
          />

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {availableExercises
              .filter((ex) =>
                ex.name.toLowerCase().includes(searchExercise.toLowerCase())
              )
              .map((ex) => (
                <div
                  key={ex._id}
                  onClick={() => handleAddExerciseFromLibrary(ex)}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-800 hover:border-primary/30 transition-all cursor-pointer group"
                >
                  <div>
                    <h4 className="text-sm font-bold text-neutral-100 group-hover:text-primary transition-colors">
                      {ex.name}
                    </h4>
                    <p className="text-xs text-neutral-400 capitalize">
                      {ex.targetMuscleGroup} &bull; {ex.equipmentRequired}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-neutral-400 group-hover:text-primary" />
                </div>
              ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActiveWorkoutPage;
