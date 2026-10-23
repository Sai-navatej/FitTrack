import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Calendar,
  Clock,
  Dumbbell,
  Trash2,
  Eye,
  Filter,
  Plus,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { workoutService } from '../services/workoutService';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import Modal from '../components/common/Modal';

const WorkoutHistoryPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [workouts, setWorkouts] = useState([]);
  const [filterSplit, setFilterSplit] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Selected workout for detail modal
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Deletion confirm dialog
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterSplit !== 'all') params.splitType = filterSplit;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await workoutService.getWorkoutHistory(params);
      if (res.success) {
        setWorkouts(res.workouts);
      }
    } catch (err) {
      showError('Failed to load workout history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [filterSplit, startDate, endDate]);

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;
    try {
      const res = await workoutService.deleteWorkout(workoutToDelete._id);
      if (res.success) {
        showSuccess('Workout session deleted successfully');
        setWorkouts((prev) => prev.filter((w) => w._id !== workoutToDelete._id));
        setWorkoutToDelete(null);
        if (selectedWorkout?._id === workoutToDelete._id) {
          setSelectedWorkout(null);
        }
      }
    } catch (err) {
      showError('Failed to delete workout');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <History className="w-4 h-4" />
            <span>Training Log</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Workout History</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Review past sessions, set loads, reps, and training volume.
          </p>
        </div>

        <button
          onClick={() => navigate('/workouts/active')}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>New Session</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel p-4 rounded-2xl border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-neutral-400" />
            <select
              value={filterSplit}
              onChange={(e) => setFilterSplit(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-primary font-medium"
            >
              <option value="all">All Splits</option>
              <option value="ppl">Push / Pull / Legs</option>
              <option value="upper_lower">Upper / Lower</option>
              <option value="bro_split">Bro Split</option>
              <option value="full_body">Full Body</option>
              <option value="custom">Custom</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-primary"
              title="From date"
            />
            <span className="text-neutral-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1 text-xs text-neutral-200 focus:outline-none focus:border-primary"
              title="To date"
            />
          </div>
        </div>

        {(filterSplit !== 'all' || startDate || endDate) && (
          <button
            onClick={() => {
              setFilterSplit('all');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* History List */}
      {loading ? (
        <LoadingSpinner text="Retrieving workout records..." />
      ) : workouts.length > 0 ? (
        <div className="space-y-4">
          {workouts.map((workout) => (
            <div
              key={workout._id}
              className="glass-card p-5 rounded-3xl border border-neutral-800/80 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-bold text-neutral-100">{workout.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400">
                      {workout.splitType}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 mt-1">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-neutral-500" />
                      {new Date(workout.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    {workout.durationMinutes > 0 && (
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-neutral-500" />
                        {workout.durationMinutes} mins
                      </span>
                    )}
                    <span>&bull;</span>
                    <span className="text-neutral-300 font-medium">
                      {workout.exercises?.length || 0} exercises performed
                    </span>
                    {workout.totalVolume > 0 && (
                      <span className="text-primary font-semibold">
                        {workout.totalVolume.toLocaleString()} kg total volume
                      </span>
                    )}
                  </div>

                  {workout.notes && (
                    <p className="text-xs text-neutral-400 mt-2 italic bg-neutral-900/40 px-3 py-1.5 rounded-lg border border-neutral-800/50">
                      "{workout.notes}"
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-neutral-800 w-full md:w-auto justify-end">
                <button
                  onClick={() => setSelectedWorkout(workout)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>View Details</span>
                </button>
                <button
                  onClick={() => setWorkoutToDelete(workout)}
                  className="p-2 rounded-xl bg-neutral-900 hover:bg-red-500/10 border border-neutral-800 text-neutral-400 hover:text-red-400 transition-colors"
                  title="Delete Workout"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={History}
          title="No Workout History Found"
          description="You haven't recorded any workouts matching your current filter. Record a session to start tracking your progress."
          actionText="Start Workout Session"
          onAction={() => navigate('/workouts/active')}
        />
      )}

      {/* Workout Detail Modal */}
      <Modal
        isOpen={!!selectedWorkout}
        onClose={() => setSelectedWorkout(null)}
        title={selectedWorkout?.title || 'Workout Details'}
        maxWidth="max-w-2xl"
      >
        {selectedWorkout && (
          <div className="space-y-5">
            <div className="flex items-center justify-between text-xs text-neutral-400 bg-neutral-900 p-3 rounded-xl border border-neutral-800">
              <span>Date: {new Date(selectedWorkout.date).toLocaleDateString()}</span>
              <span>Duration: {selectedWorkout.durationMinutes} mins</span>
              <span className="text-primary font-bold">
                Volume: {selectedWorkout.totalVolume ? `${selectedWorkout.totalVolume} kg` : 'Bodyweight'}
              </span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {selectedWorkout.exercises.map((ex, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-neutral-100">{ex.name}</h4>
                    <span className="text-xs text-neutral-400 capitalize">{ex.targetMuscleGroup}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    {ex.sets.map((set, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-center"
                      >
                        <span className="text-[10px] text-neutral-500 font-bold block uppercase">
                          Set {set.setNumber}
                        </span>
                        <span className="text-sm font-extrabold text-neutral-100">
                          {set.reps} reps
                        </span>
                        <span className="text-xs text-neutral-400 block font-medium">
                          {ex.isBodyweight ? 'Bodyweight' : `${set.weight} kg`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedWorkout.notes && (
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                <span className="font-bold text-neutral-400 block mb-1">Notes:</span>
                "{selectedWorkout.notes}"
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirm Deletion Dialog */}
      <ConfirmDialog
        isOpen={!!workoutToDelete}
        onClose={() => setWorkoutToDelete(null)}
        onConfirm={handleDeleteWorkout}
        title="Delete Workout Session"
        message={`Are you sure you want to permanently delete "${workoutToDelete?.title}"? This will update your volume graphs and completed workout counts.`}
        confirmText="Delete Workout"
      />
    </div>
  );
};

export default WorkoutHistoryPage;
