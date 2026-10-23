import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Trash2,
  Dumbbell,
  Tag,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { exerciseService } from '../services/exerciseService';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const muscleGroups = [
  'all',
  'chest',
  'back',
  'legs',
  'shoulders',
  'biceps',
  'triceps',
  'abs',
  'full_body',
];

const categories = ['all', 'strength', 'hypertrophy', 'bodyweight', 'cardio'];

const ExerciseLibraryPage = () => {
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterType, setFilterType] = useState('all'); // all, predefined, custom

  // Create custom exercise modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    targetMuscleGroup: 'chest',
    category: 'hypertrophy',
    equipmentRequired: 'dumbbell',
    instructions: '',
  });

  // Selected exercise for instructions view
  const [viewExercise, setViewExercise] = useState(null);

  // Exercise deletion
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedMuscle !== 'all') params.muscleGroup = selectedMuscle;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (filterType !== 'all') params.filter = filterType;

      const res = await exerciseService.getExercises(params);
      if (res.success) {
        setExercises(res.exercises);
      }
    } catch (err) {
      showError('Failed to fetch exercise library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, [search, selectedMuscle, selectedCategory, filterType]);

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!customForm.name.trim()) {
      showError('Exercise name is required');
      return;
    }

    try {
      const res = await exerciseService.createCustomExercise(customForm);
      if (res.success) {
        showSuccess('Custom exercise added successfully!');
        setIsModalOpen(false);
        setCustomForm({
          name: '',
          targetMuscleGroup: 'chest',
          category: 'hypertrophy',
          equipmentRequired: 'dumbbell',
          instructions: '',
        });
        fetchExercises();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create exercise');
    }
  };

  const handleDeleteCustomExercise = async () => {
    if (!exerciseToDelete) return;
    try {
      const res = await exerciseService.deleteCustomExercise(exerciseToDelete._id);
      if (res.success) {
        showSuccess('Custom exercise removed');
        setExercises((prev) => prev.filter((e) => e._id !== exerciseToDelete._id));
        setExerciseToDelete(null);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete exercise');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Movement Database</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Exercise Library</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Browse predefined movements or add custom exercises tailored to your gym equipment.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Exercise</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-neutral-800 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search exercises by name (e.g. Bench Press, Squats, Lateral Raises)..."
            className="w-full pl-10 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Muscle Group Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Muscle:</span>
            <select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 capitalize focus:outline-none focus:border-primary font-medium"
            >
              {muscleGroups.map((m) => (
                <option key={m} value={m} className="capitalize">
                  {m.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 capitalize focus:outline-none focus:border-primary font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Predefined vs Custom Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-neutral-400 uppercase">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Movements</option>
              <option value="predefined">Predefined Library Only</option>
              <option value="custom">My Custom Exercises</option>
            </select>
          </div>

          {(search || selectedMuscle !== 'all' || selectedCategory !== 'all' || filterType !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedMuscle('all');
                setSelectedCategory('all');
                setFilterType('all');
              }}
              className="text-xs text-primary hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Exercise Grid */}
      {loading ? (
        <LoadingSpinner text="Searching exercise library..." />
      ) : exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((exercise) => (
            <div
              key={exercise._id}
              className="glass-card p-5 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-bold text-neutral-100 group-hover:text-primary transition-colors">
                    {exercise.name}
                  </h3>
                  {exercise.isCustom && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Custom
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 capitalize">
                    {exercise.targetMuscleGroup}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 capitalize">
                    {exercise.equipmentRequired}
                  </span>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 capitalize">
                    {exercise.category}
                  </span>
                </div>

                {exercise.instructions && (
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {exercise.instructions}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-800 flex items-center justify-between mt-3">
                <button
                  onClick={() => setViewExercise(exercise)}
                  className="text-xs text-cyan-400 hover:underline flex items-center font-medium"
                >
                  <Info className="w-3.5 h-3.5 mr-1" />
                  <span>Instructions</span>
                </button>

                {exercise.isCustom && (
                  <button
                    onClick={() => setExerciseToDelete(exercise)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                    title="Delete Custom Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Dumbbell}
          title="No Exercises Found"
          description="Try adjusting your search criteria, or add your own custom movement."
          actionText="Add Custom Exercise"
          onAction={() => setIsModalOpen(true)}
        />
      )}

      {/* Instructions Modal */}
      <Modal
        isOpen={!!viewExercise}
        onClose={() => setViewExercise(null)}
        title={viewExercise?.name || 'Exercise Details'}
      >
        {viewExercise && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-neutral-900 text-primary border border-neutral-800 capitalize">
                Target: {viewExercise.targetMuscleGroup}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 capitalize">
                Equipment: {viewExercise.equipmentRequired}
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 capitalize">
                Focus: {viewExercise.category}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Instructions:</h4>
              <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                {viewExercise.instructions || 'No special instructions recorded for this exercise.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Custom Exercise Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Custom Exercise"
      >
        <form onSubmit={handleCreateExercise} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Exercise Name *
            </label>
            <input
              type="text"
              value={customForm.name}
              onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
              placeholder="e.g. Incline Cable Flyes"
              required
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Target Muscle *
              </label>
              <select
                value={customForm.targetMuscleGroup}
                onChange={(e) => setCustomForm({ ...customForm, targetMuscleGroup: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary capitalize"
              >
                {muscleGroups.filter((m) => m !== 'all').map((m) => (
                  <option key={m} value={m} className="capitalize">
                    {m.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Equipment *
              </label>
              <select
                value={customForm.equipmentRequired}
                onChange={(e) => setCustomForm({ ...customForm, equipmentRequired: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary capitalize"
              >
                <option value="barbell">Barbell</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="cable">Cable Machine</option>
                <option value="machine">Plate Loaded Machine</option>
                <option value="bodyweight">Bodyweight</option>
                <option value="kettlebell">Kettlebell</option>
                <option value="bands">Resistance Bands</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Category
            </label>
            <select
              value={customForm.category}
              onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary capitalize"
            >
              <option value="hypertrophy">Hypertrophy</option>
              <option value="strength">Strength</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="cardio">Cardio</option>
              <option value="mobility">Mobility</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Form Instructions (optional)
            </label>
            <textarea
              rows="3"
              value={customForm.instructions}
              onChange={(e) => setCustomForm({ ...customForm, instructions: e.target.value })}
              placeholder="e.g. Set pulleys to chest level, maintain slight elbow bend..."
              className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold text-sm rounded-xl transition-all shadow-glow-sm"
            >
              Save Exercise
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!exerciseToDelete}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={handleDeleteCustomExercise}
        title="Delete Custom Exercise"
        message={`Are you sure you want to remove "${exerciseToDelete?.name}" from your custom exercises?`}
      />
    </div>
  );
};

export default ExerciseLibraryPage;
