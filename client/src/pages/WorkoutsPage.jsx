import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Play,
  Plus,
  Settings,
  ChevronRight,
  Flame,
  Calendar,
  Layers,
  CheckCircle2,
  ListPlus,
} from 'lucide-react';
import { workoutService } from '../services/workoutService';
import { exerciseService } from '../services/exerciseService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

const WorkoutsPage = () => {
  const { user, updateUserData } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [splitsData, setSplitsData] = useState(null);
  const [selectedSplitKey, setSelectedSplitKey] = useState('ppl');

  // Change Split Modal
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [changingSplitKey, setChangingSplitKey] = useState('ppl');

  // Manual Log Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    title: '',
    splitType: 'other',
    date: new Date().toISOString().split('T')[0],
    durationMinutes: 45,
    exercises: [],
    notes: '',
  });

  const [allExercises, setAllExercises] = useState([]);
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [splitRes, exRes] = await Promise.all([
        workoutService.getSplits(),
        exerciseService.getExercises(),
      ]);

      if (splitRes.success) {
        setSplitsData(splitRes.predefinedSplits);
        setSelectedSplitKey(splitRes.currentSplit || 'ppl');
        setChangingSplitKey(splitRes.currentSplit || 'ppl');
      }

      if (exRes.success) {
        setAllExercises(exRes.exercises);
      }
    } catch (err) {
      showError('Failed to load workout split data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSplitChange = async () => {
    try {
      const res = await workoutService.updateSplit({ preferredSplit: changingSplitKey });
      if (res.success) {
        setSelectedSplitKey(changingSplitKey);
        if (user) {
          updateUserData({ ...user, preferredSplit: changingSplitKey });
        }
        showSuccess('Training split updated successfully!');
        setIsSplitModalOpen(false);
      }
    } catch (err) {
      showError('Failed to update training split');
    }
  };

  const handleStartWorkoutDay = (day) => {
    // Navigate to active workout page passing day info in state or query
    navigate('/workouts/active', {
      state: {
        title: day.name,
        splitType: selectedSplitKey,
        initialExercises: day.exercises.map((exName) => ({
          name: exName,
          targetMuscleGroup: 'other',
          isBodyweight: false,
          sets: [
            { setNumber: 1, reps: 10, weight: 0, completed: false },
            { setNumber: 2, reps: 10, weight: 0, completed: false },
            { setNumber: 3, reps: 10, weight: 0, completed: false },
          ],
        })),
      },
    });
  };

  // Manual Log Helpers
  const addExerciseToManual = () => {
    if (!selectedExerciseToAdd) return;
    const found = allExercises.find((e) => e.name === selectedExerciseToAdd);
    setManualForm((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          name: selectedExerciseToAdd,
          targetMuscleGroup: found?.targetMuscleGroup || 'other',
          isBodyweight: found?.equipmentRequired === 'bodyweight',
          sets: [
            { setNumber: 1, reps: 10, weight: 60, completed: true },
            { setNumber: 2, reps: 10, weight: 60, completed: true },
            { setNumber: 3, reps: 8, weight: 65, completed: true },
          ],
        },
      ],
    }));
    setSelectedExerciseToAdd('');
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.title.trim()) {
      showError('Please enter a workout title');
      return;
    }
    if (manualForm.exercises.length === 0) {
      showError('Please add at least one exercise');
      return;
    }

    try {
      const res = await workoutService.saveWorkout(manualForm);
      if (res.success) {
        showSuccess('Workout logged successfully!');
        setIsManualModalOpen(false);
        navigate('/history');
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to log workout');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading workout plans & splits..." />;
  }

  const currentSplit = splitsData ? splitsData[selectedSplitKey] : null;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <Layers className="w-4 h-4" />
            <span>Training Split Management</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Workouts & Routines</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Select a routine, customize your exercises, or start a live gym session.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition-all"
          >
            <ListPlus className="w-4 h-4 text-cyan-400" />
            <span>Log Workout Manually</span>
          </button>
          <button
            onClick={() => setIsSplitModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition-all"
          >
            <Settings className="w-4 h-4 text-primary" />
            <span>Switch Split</span>
          </button>
        </div>
      </div>

      {/* Current Split Overview Banner */}
      {currentSplit && (
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Active Split</span>
              <h2 className="text-2xl font-bold text-neutral-100 mt-0.5">{currentSplit.name}</h2>
              <p className="text-sm text-neutral-400 mt-1 max-w-2xl">{currentSplit.description}</p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-neutral-300 bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>{currentSplit.days?.length || 0} Scheduled Training Days</span>
            </div>
          </div>
        </div>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentSplit?.days?.map((day, idx) => (
          <div
            key={day.dayKey || idx}
            className="glass-card rounded-3xl border border-neutral-800/80 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Day {idx + 1}</span>
                <span className="text-[11px] font-semibold text-neutral-400 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800">
                  {day.focus}
                </span>
              </div>

              <h3 className="text-xl font-bold text-neutral-100 group-hover:text-primary transition-colors mb-4">
                {day.name}
              </h3>

              <div className="space-y-2 mb-6">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Recommended Exercises:</p>
                <div className="space-y-1.5">
                  {day.exercises.map((exName, exIdx) => (
                    <div
                      key={exIdx}
                      className="text-xs text-neutral-300 flex items-center bg-neutral-900/50 px-3 py-1.5 rounded-lg border border-neutral-800/50"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2" />
                      <span className="truncate">{exName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={() => handleStartWorkoutDay(day)}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-xs transition-all shadow-glow-sm hover:scale-[1.02]"
              >
                <Play className="w-3.5 h-3.5 fill-dark-950" />
                <span>Start {day.name}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Switch Split Modal */}
      <Modal isOpen={isSplitModalOpen} onClose={() => setIsSplitModalOpen(false)} title="Select Training Split">
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">
            Switching your routine changes suggested workout days without modifying or deleting your previous workout history.
          </p>

          <div className="space-y-2.5">
            {splitsData &&
              Object.keys(splitsData).map((splitKey) => {
                const s = splitsData[splitKey];
                const isSelected = changingSplitKey === splitKey;
                return (
                  <div
                    key={splitKey}
                    onClick={() => setChangingSplitKey(splitKey)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-neutral-100 shadow-glow-sm'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100">{s.name}</h4>
                      <p className="text-xs text-neutral-400 mt-0.5">{s.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 ml-3" />}
                  </div>
                );
              })}
          </div>

          <div className="pt-3 flex justify-end space-x-2">
            <button
              onClick={() => setIsSplitModalOpen(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSplitChange}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold text-sm rounded-xl transition-all shadow-glow-sm"
            >
              Apply Split
            </button>
          </div>
        </div>
      </Modal>

      {/* Manual Workout Log Modal */}
      <Modal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} title="Log Completed Workout" maxWidth="max-w-2xl">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Session Title *</label>
              <input
                type="text"
                value={manualForm.title}
                onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                placeholder="e.g. Heavy Push Day"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Date</label>
              <input
                type="date"
                value={manualForm.date}
                onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Add Exercises to Workout</label>
            <div className="flex space-x-2">
              <select
                value={selectedExerciseToAdd}
                onChange={(e) => setSelectedExerciseToAdd(e.target.value)}
                className="flex-1 px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              >
                <option value="">Select an exercise from library...</option>
                {allExercises.map((ex) => (
                  <option key={ex._id} value={ex.name}>
                    {ex.name} ({ex.targetMuscleGroup})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addExerciseToManual}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-primary border border-neutral-700 rounded-xl text-sm font-bold"
              >
                + Add
              </button>
            </div>
          </div>

          {/* List of Added Exercises */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {manualForm.exercises.map((ex, exIdx) => (
              <div key={exIdx} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-neutral-100">{ex.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setManualForm((prev) => ({
                        ...prev,
                        exercises: prev.exercises.filter((_, idx) => idx !== exIdx),
                      }))
                    }
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {ex.sets.map((set, sIdx) => (
                    <div key={sIdx} className="flex items-center space-x-1.5 text-xs bg-neutral-950 p-1.5 rounded-lg border border-neutral-800">
                      <span className="text-neutral-500 font-bold">S{set.setNumber}:</span>
                      <input
                        type="number"
                        min="1"
                        value={set.reps}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setManualForm((prev) => {
                            const updated = [...prev.exercises];
                            updated[exIdx].sets[sIdx].reps = val;
                            return { ...prev, exercises: updated };
                          });
                        }}
                        className="w-12 bg-transparent text-center border-b border-neutral-700 text-neutral-100"
                        title="Reps"
                      />
                      <span>reps @</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setManualForm((prev) => {
                            const updated = [...prev.exercises];
                            updated[exIdx].sets[sIdx].weight = val;
                            return { ...prev, exercises: updated };
                          });
                        }}
                        className="w-12 bg-transparent text-center border-b border-neutral-700 text-neutral-100"
                        title="Weight kg"
                      />
                      <span>kg</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Session Notes</label>
            <textarea
              rows="2"
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
              placeholder="e.g. Felt great energy, hit personal record on bench press."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsManualModalOpen(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold text-sm rounded-xl transition-all shadow-glow-sm"
            >
              Save Completed Workout
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkoutsPage;
