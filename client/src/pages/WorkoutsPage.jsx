import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2,
  PenLine,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { workoutService } from '../services/workoutService';
import { exerciseService } from '../services/exerciseService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

// Available muscle groups matching the Exercise model enum
const MUSCLE_GROUPS = [
  'chest', 'back', 'legs', 'quads', 'hamstrings', 'calves',
  'shoulders', 'biceps', 'triceps', 'arms', 'core', 'abs',
  'full_body', 'cardio',
];

const WorkoutsPage = () => {
  const { user, updateUserData } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [splitsData, setSplitsData] = useState(null);
  const [selectedSplitKey, setSelectedSplitKey] = useState('ppl');
  const [userCustomSplit, setUserCustomSplit] = useState(null);

  // Change Split Modal
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [changingSplitKey, setChangingSplitKey] = useState('ppl');

  // Custom Split Builder
  const [isCustomBuilderOpen, setIsCustomBuilderOpen] = useState(false);
  const [customBuilderSaving, setCustomBuilderSaving] = useState(false);
  const [customForm, setCustomForm] = useState({
    routineName: '',
    days: [
      { name: '', muscleGroups: [], exercises: [] },
    ],
  });

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
        if (splitRes.customSplit) {
          setUserCustomSplit(splitRes.customSplit);
        }
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
      // If selecting custom but no custom split exists yet, open the builder
      if (changingSplitKey === 'custom') {
        const hasExistingCustom = userCustomSplit && userCustomSplit.days && userCustomSplit.days.length > 0;
        if (!hasExistingCustom) {
          // Open builder instead of saving
          openCustomBuilder();
          return;
        }
      }

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
      showError(err.response?.data?.message || 'Failed to update training split');
    }
  };

  const openCustomBuilder = (editExisting = false) => {
    if (editExisting && userCustomSplit && userCustomSplit.days && userCustomSplit.days.length > 0) {
      setCustomForm({
        routineName: userCustomSplit.routineName || '',
        days: userCustomSplit.days.map((d) => ({
          name: d.name || '',
          muscleGroups: d.muscleGroups || [],
          exercises: d.exercises || [],
        })),
      });
    } else {
      setCustomForm({
        routineName: '',
        days: [{ name: '', muscleGroups: [], exercises: [] }],
      });
    }
    setIsSplitModalOpen(false);
    setIsCustomBuilderOpen(true);
  };

  const handleCancelCustomBuilder = () => {
    setIsCustomBuilderOpen(false);
    // Discard all unsaved changes by resetting the form
    setCustomForm({
      routineName: '',
      days: [{ name: '', muscleGroups: [], exercises: [] }],
    });
  };

  // Custom builder helpers
  const addTrainingDay = () => {
    if (customForm.days.length >= 7) {
      showError('Maximum 7 training days per week');
      return;
    }
    setCustomForm((prev) => ({
      ...prev,
      days: [...prev.days, { name: '', muscleGroups: [], exercises: [] }],
    }));
  };

  const removeTrainingDay = (dayIdx) => {
    if (customForm.days.length <= 1) {
      showError('At least one training day is required');
      return;
    }
    setCustomForm((prev) => ({
      ...prev,
      days: prev.days.filter((_, i) => i !== dayIdx),
    }));
  };

  const updateDayName = (dayIdx, value) => {
    setCustomForm((prev) => {
      const updated = [...prev.days];
      updated[dayIdx] = { ...updated[dayIdx], name: value };
      return { ...prev, days: updated };
    });
  };

  const toggleMuscleGroup = (dayIdx, mg) => {
    setCustomForm((prev) => {
      const updated = [...prev.days];
      const current = updated[dayIdx].muscleGroups || [];
      if (current.includes(mg)) {
        updated[dayIdx] = { ...updated[dayIdx], muscleGroups: current.filter((g) => g !== mg) };
      } else {
        updated[dayIdx] = { ...updated[dayIdx], muscleGroups: [...current, mg] };
      }
      return { ...prev, days: updated };
    });
  };

  const addExerciseToDay = (dayIdx, exerciseName) => {
    if (!exerciseName || !exerciseName.trim()) return;
    setCustomForm((prev) => {
      const updated = [...prev.days];
      if (updated[dayIdx].exercises.includes(exerciseName)) {
        showError('Exercise already added to this day');
        return prev;
      }
      updated[dayIdx] = {
        ...updated[dayIdx],
        exercises: [...updated[dayIdx].exercises, exerciseName],
      };
      return { ...prev, days: updated };
    });
  };

  const removeExerciseFromDay = (dayIdx, exIdx) => {
    setCustomForm((prev) => {
      const updated = [...prev.days];
      updated[dayIdx] = {
        ...updated[dayIdx],
        exercises: updated[dayIdx].exercises.filter((_, i) => i !== exIdx),
      };
      return { ...prev, days: updated };
    });
  };

  const validateCustomForm = () => {
    if (!customForm.routineName.trim()) {
      showError('Please enter a routine name');
      return false;
    }
    if (customForm.days.length === 0) {
      showError('At least one training day is required');
      return false;
    }
    for (let i = 0; i < customForm.days.length; i++) {
      if (!customForm.days[i].name.trim()) {
        showError(`Day ${i + 1} must have a name`);
        return false;
      }
    }
    return true;
  };

  const handleSaveCustomSplit = async () => {
    if (!validateCustomForm()) return;

    setCustomBuilderSaving(true);
    try {
      const payload = {
        preferredSplit: 'custom',
        customSplit: {
          routineName: customForm.routineName.trim(),
          days: customForm.days.map((d) => ({
            name: d.name.trim(),
            muscleGroups: d.muscleGroups,
            exercises: d.exercises.filter((ex) => ex && ex.trim()),
          })),
        },
      };

      const res = await workoutService.updateSplit(payload);
      if (res.success) {
        setUserCustomSplit(res.customSplit);
        setSelectedSplitKey('custom');
        setChangingSplitKey('custom');
        if (user) {
          updateUserData({
            ...user,
            preferredSplit: 'custom',
            customSplit: res.customSplit,
          });
        }
        showSuccess('Custom routine saved successfully!');
        setIsCustomBuilderOpen(false);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save custom routine');
    } finally {
      setCustomBuilderSaving(false);
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

  // Determine what to display: predefined split or custom split
  const isCustomActive = selectedSplitKey === 'custom';
  const currentSplit = isCustomActive
    ? (userCustomSplit && userCustomSplit.days && userCustomSplit.days.length > 0
        ? {
            name: userCustomSplit.routineName || 'Custom Split',
            description: `Your custom ${userCustomSplit.days.length}-day training routine.`,
            days: userCustomSplit.days.map((d, idx) => ({
              dayKey: `custom_day_${idx}`,
              name: d.name,
              focus: d.muscleGroups && d.muscleGroups.length > 0
                ? d.muscleGroups.map((mg) => mg.charAt(0).toUpperCase() + mg.slice(1)).join(', ')
                : 'Custom',
              exercises: d.exercises || [],
            })),
          }
        : null)
    : (splitsData ? splitsData[selectedSplitKey] : null);

  // Build the custom split option for the modal
  const customSplitOption = {
    name: 'Custom Split',
    description: userCustomSplit?.routineName
      ? `"${userCustomSplit.routineName}" — ${userCustomSplit.days?.length || 0} day(s)`
      : 'Build your own personalized training routine with custom days, muscle groups, and exercises.',
  };

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
            <div className="flex items-center space-x-3">
              {isCustomActive && (
                <button
                  onClick={() => openCustomBuilder(true)}
                  className="flex items-center space-x-2 text-xs font-medium text-neutral-300 bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800 hover:border-primary/50 transition-all"
                >
                  <PenLine className="w-3.5 h-3.5 text-primary" />
                  <span>Edit Routine</span>
                </button>
              )}
              <div className="flex items-center space-x-2 text-xs font-medium text-neutral-300 bg-neutral-900/80 px-4 py-2 rounded-xl border border-neutral-800">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>{currentSplit.days?.length || 0} Scheduled Training Days</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No custom split configured message */}
      {isCustomActive && !currentSplit && (
        <div className="glass-panel p-8 rounded-3xl border border-neutral-800 text-center">
          <Dumbbell className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-neutral-300 mb-2">No Custom Routine Configured</h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-md mx-auto">
            Create your own personalized training routine with custom days, muscle groups, and exercises.
          </p>
          <button
            onClick={() => openCustomBuilder(false)}
            className="px-6 py-3 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow-sm hover:scale-[1.02] inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Custom Routine</span>
          </button>
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
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  {day.exercises.length > 0 ? 'Recommended Exercises:' : 'No exercises assigned yet'}
                </p>
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

            {/* Custom Split Option */}
            <div
              onClick={() => setChangingSplitKey('custom')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                changingSplitKey === 'custom'
                  ? 'bg-primary/10 border-primary text-neutral-100 shadow-glow-sm'
                  : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <PenLine className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-neutral-100">{customSplitOption.name}</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">{customSplitOption.description}</p>
                </div>
              </div>
              {changingSplitKey === 'custom' && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 ml-3" />}
            </div>
          </div>

          {/* Edit / Create custom split link when custom is selected */}
          {changingSplitKey === 'custom' && (
            <div className="pt-1">
              <button
                onClick={() => openCustomBuilder(
                  userCustomSplit && userCustomSplit.days && userCustomSplit.days.length > 0
                )}
                className="text-xs font-semibold text-primary hover:text-primary-light transition-colors inline-flex items-center space-x-1"
              >
                <PenLine className="w-3.5 h-3.5" />
                <span>
                  {userCustomSplit && userCustomSplit.days && userCustomSplit.days.length > 0
                    ? 'Edit Custom Routine'
                    : 'Create Custom Routine'}
                </span>
              </button>
            </div>
          )}

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

      {/* Custom Split Builder Modal */}
      <Modal
        isOpen={isCustomBuilderOpen}
        onClose={handleCancelCustomBuilder}
        title="Custom Split Builder"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Routine Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Routine Name *
            </label>
            <input
              type="text"
              value={customForm.routineName}
              onChange={(e) => setCustomForm((prev) => ({ ...prev, routineName: e.target.value }))}
              placeholder="e.g. My PPL Variant, 4-Day Powerbuilding..."
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Training Days Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-neutral-200">Training Days</h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                {customForm.days.length} day{customForm.days.length !== 1 ? 's' : ''} configured
              </p>
            </div>
            <button
              type="button"
              onClick={addTrainingDay}
              disabled={customForm.days.length >= 7}
              className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-primary text-xs font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Day</span>
            </button>
          </div>

          {/* Days List */}
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            {customForm.days.map((day, dayIdx) => (
              <CustomDayCard
                key={dayIdx}
                day={day}
                dayIdx={dayIdx}
                totalDays={customForm.days.length}
                allExercises={allExercises}
                onUpdateName={(val) => updateDayName(dayIdx, val)}
                onToggleMuscleGroup={(mg) => toggleMuscleGroup(dayIdx, mg)}
                onAddExercise={(exName) => addExerciseToDay(dayIdx, exName)}
                onRemoveExercise={(exIdx) => removeExerciseFromDay(dayIdx, exIdx)}
                onRemoveDay={() => removeTrainingDay(dayIdx)}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-800 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancelCustomBuilder}
              className="px-4 py-2.5 text-sm text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCustomSplit}
              disabled={customBuilderSaving}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold text-sm rounded-xl transition-all shadow-glow-sm disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center space-x-2"
            >
              {customBuilderSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Custom Routine</span>
              )}
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

// ─── Custom Day Card Sub-Component ────────────────────────────────────────────
const CustomDayCard = ({
  day,
  dayIdx,
  totalDays,
  allExercises,
  onUpdateName,
  onToggleMuscleGroup,
  onAddExercise,
  onRemoveExercise,
  onRemoveDay,
}) => {
  const [exerciseDropdown, setExerciseDropdown] = useState('');

  // Filter exercises by selected muscle groups for this day
  const filteredExercises = day.muscleGroups && day.muscleGroups.length > 0
    ? allExercises.filter((ex) => day.muscleGroups.includes(ex.targetMuscleGroup))
    : allExercises;

  return (
    <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-wider">Day {dayIdx + 1}</span>
        <button
          type="button"
          onClick={onRemoveDay}
          disabled={totalDays <= 1}
          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          title="Remove this day"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Day Name */}
      <div>
        <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1">
          Workout Name *
        </label>
        <input
          type="text"
          value={day.name}
          onChange={(e) => onUpdateName(e.target.value)}
          placeholder="e.g. Push Day, Upper Body A, Chest & Triceps..."
          className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Muscle Groups */}
      <div>
        <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1.5">
          Target Muscle Groups
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MUSCLE_GROUPS.map((mg) => {
            const isActive = day.muscleGroups?.includes(mg);
            return (
              <button
                key={mg}
                type="button"
                onClick={() => onToggleMuscleGroup(mg)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                  isActive
                    ? 'bg-primary/15 border-primary/40 text-primary'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'
                }`}
              >
                {mg.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exercises */}
      <div>
        <label className="block text-[11px] font-semibold text-neutral-500 uppercase mb-1.5">
          Exercises ({day.exercises.length})
        </label>

        {/* Add exercise dropdown */}
        <div className="flex space-x-2 mb-2">
          <select
            value={exerciseDropdown}
            onChange={(e) => setExerciseDropdown(e.target.value)}
            className="flex-1 px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:border-primary"
          >
            <option value="">
              {filteredExercises.length > 0 ? 'Select exercise to add...' : 'No exercises for selected muscles'}
            </option>
            {filteredExercises.map((ex) => (
              <option key={ex._id} value={ex.name}>
                {ex.name} ({ex.targetMuscleGroup})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (exerciseDropdown) {
                onAddExercise(exerciseDropdown);
                setExerciseDropdown('');
              }
            }}
            disabled={!exerciseDropdown}
            className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-primary border border-neutral-700 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add
          </button>
        </div>

        {/* Exercise list */}
        {day.exercises.length > 0 && (
          <div className="space-y-1">
            {day.exercises.map((exName, exIdx) => (
              <div
                key={exIdx}
                className="flex items-center justify-between px-3 py-1.5 bg-neutral-950/70 rounded-lg border border-neutral-800/50 group"
              >
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-neutral-300">{exName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveExercise(exIdx)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-red-400 transition-all"
                  title="Remove exercise"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutsPage;
