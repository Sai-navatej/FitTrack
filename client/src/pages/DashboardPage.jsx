import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Scale,
  UtensilsCrossed,
  Droplets,
  Flame,
  Plus,
  Play,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  Activity,
  Award,
} from 'lucide-react';
import { progressService } from '../services/progressService';
import { waterService } from '../services/waterService';
import { nutritionService } from '../services/nutritionService';
import { weightService } from '../services/weightService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const DashboardPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  // Quick Action Modals
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [waterAmount, setWaterAmount] = useState('250');

  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
  const [foodForm, setFoodForm] = useState({
    name: '',
    mealCategory: 'breakfast',
    servingQuantity: '1 serving',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await progressService.getDashboardSummary();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickWater = async (amount) => {
    try {
      await waterService.logWater(amount);
      showSuccess(`Logged +${amount} ml water!`);
      setIsWaterModalOpen(false);
      fetchDashboard();
    } catch (err) {
      showError('Failed to log water');
    }
  };

  const handleUpdateWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    try {
      await weightService.addWeight({
        weight: Number(newWeight),
        unit: user?.weightUnit || 'kg',
        notes: weightNotes,
      });
      showSuccess('Weight updated successfully!');
      setIsWeightModalOpen(false);
      setNewWeight('');
      setWeightNotes('');
      fetchDashboard();
    } catch (err) {
      showError('Failed to record weight');
    }
  };

  const handleLogFood = async (e) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.calories) return;
    try {
      await nutritionService.addFoodEntry({
        name: foodForm.name,
        mealCategory: foodForm.mealCategory,
        servingQuantity: foodForm.servingQuantity,
        calories: Number(foodForm.calories),
        protein: Number(foodForm.protein) || 0,
        carbs: Number(foodForm.carbs) || 0,
        fat: Number(foodForm.fat) || 0,
      });
      showSuccess(`Logged ${foodForm.name}!`);
      setIsFoodModalOpen(false);
      setFoodForm({
        name: '',
        mealCategory: 'breakfast',
        servingQuantity: '1 serving',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
      });
      fetchDashboard();
    } catch (err) {
      showError('Failed to log food entry');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading fitness dashboard..." />;
  }

  const d = dashboardData || {};
  const caloriePercent = Math.min(100, Math.round(((d.caloriesConsumedToday || 0) / (d.dailyCalorieTarget || 2200)) * 100));
  const waterPercent = Math.min(100, Math.round(((d.waterConsumedToday || 0) / (d.dailyWaterTarget || 2500)) * 100));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-6 sm:p-8 border border-neutral-800">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold mb-3">
              <Flame className="w-3.5 h-3.5 fill-primary" />
              <span>TRAINING SPLIT: {user?.preferredSplit?.toUpperCase() || 'PPL'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-100 tracking-tight">
              Ready to crush today's session?
            </h1>
            <p className="text-sm text-neutral-400 mt-1.5 max-w-xl">
              Suggested Focus Today: <span className="text-primary font-semibold">{d.suggestedTodayWorkout || "Push Day"}</span>. Track sets, weights, and nutrition in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/workouts/active')}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-3 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-dark-950" />
              <span>Start Workout</span>
            </button>
            <button
              onClick={() => navigate('/workouts')}
              className="flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/80 rounded-xl text-sm font-semibold transition-all"
            >
              <Dumbbell className="w-4 h-4 text-primary" />
              <span>Log Session</span>
            </button>
          </div>
        </div>

        {/* Quick-action buttons bar */}
        <div className="mt-6 pt-6 border-t border-neutral-800/80 flex flex-wrap gap-2.5 items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 mr-2">Quick Actions:</span>
          <button
            onClick={() => setIsFoodModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-all"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-orange-400" />
            <span>Log Food</span>
          </button>
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-all"
          >
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            <span>Update Weight</span>
          </button>
          <button
            onClick={() => setIsWaterModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium transition-all"
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Log Water</span>
          </button>
        </div>
      </div>

      {/* Main 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Body Weight */}
        <div
          onClick={() => navigate('/weight')}
          className="glass-card p-5 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Current Weight</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-neutral-100">{d.currentWeight || user?.currentWeight || 0}</span>
            <span className="text-sm font-semibold text-neutral-400">{d.weightUnit || 'kg'}</span>
          </div>
          <div className="mt-3 flex items-center text-xs">
            {d.weightDiff > 0 ? (
              <span className="text-purple-400 flex items-center font-semibold">
                <TrendingUp className="w-3.5 h-3.5 mr-1" /> +{d.weightDiff} {d.weightUnit}
              </span>
            ) : d.weightDiff < 0 ? (
              <span className="text-primary flex items-center font-semibold">
                <TrendingDown className="w-3.5 h-3.5 mr-1" /> {d.weightDiff} {d.weightUnit}
              </span>
            ) : (
              <span className="text-neutral-400">No recent weight change</span>
            )}
            <span className="text-neutral-400 ml-2">vs previous</span>
          </div>
        </div>

        {/* Card 2: Workouts Completed */}
        <div
          onClick={() => navigate('/history')}
          className="glass-card p-5 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Workouts</span>
            <div className="w-9 h-9 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-neutral-100">{d.totalWorkouts || 0}</span>
            <span className="text-xs font-medium text-neutral-400">Sessions</span>
          </div>
          <div className="mt-3 text-xs text-neutral-400 flex items-center justify-between">
            <span>View all sessions in history</span>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary transition-colors" />
          </div>
        </div>

        {/* Card 3: Calories Today */}
        <div
          onClick={() => navigate('/nutrition')}
          className="glass-card p-5 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Calories Today</span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-neutral-100">{d.caloriesConsumedToday || 0}</span>
            <span className="text-xs font-medium text-neutral-400">/ {d.dailyCalorieTarget || 2200} kcal</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${caloriePercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1.5 font-medium">
              <span>{d.caloriesRemaining || 0} kcal remaining</span>
              <span>{caloriePercent}%</span>
            </div>
          </div>
        </div>

        {/* Card 4: Water Today */}
        <div
          onClick={() => navigate('/water')}
          className="glass-card p-5 rounded-2xl border border-neutral-800/80 hover:border-neutral-700 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Hydration Today</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-neutral-100">{d.waterConsumedToday || 0}</span>
            <span className="text-xs font-medium text-neutral-400">/ {d.dailyWaterTarget || 2500} ml</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${waterPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1.5 font-medium">
              <span>{d.waterRemaining || 0} ml remaining</span>
              <span>{waterPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section: Recent Workouts & Workout Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Workouts */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-neutral-800">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-neutral-100">Recent Workout Sessions</h2>
              <p className="text-xs text-neutral-400">Your latest logged training history</p>
            </div>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-primary hover:underline font-semibold flex items-center"
            >
              <span>Full History</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          {d.recentWorkouts && d.recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {d.recentWorkouts.map((session) => (
                <div
                  key={session._id}
                  onClick={() => navigate('/history')}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-neutral-800 transition-all cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center space-x-3 mb-2 sm:mb-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Dumbbell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100 group-hover:text-primary transition-colors">
                        {session.title}
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-neutral-400 mt-0.5">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {session.durationMinutes > 0 && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {session.durationMinutes} min
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-800">
                    <div className="text-right">
                      <span className="text-xs font-semibold text-neutral-300">
                        {session.exercises?.length || 0} Exercises
                      </span>
                      <p className="text-[11px] text-neutral-400 font-medium">
                        Volume: {session.totalVolume ? `${session.totalVolume.toLocaleString()} kg` : 'Bodyweight'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Dumbbell}
              title="No Workouts Recorded Yet"
              description="Start your first gym session or log a completed workout to build your history and volume charts."
              actionText="Start Today's Workout"
              onAction={() => navigate('/workouts/active')}
            />
          )}
        </div>

        {/* Right Col: Workout Split & Fast Navigation Card */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-100">Training Routine</h2>
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold uppercase">
                {user?.preferredSplit || 'PPL'}
              </span>
            </div>

            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Your workouts follow the <strong className="text-neutral-200">{user?.preferredSplit?.replace('_', ' ').toUpperCase()}</strong> split. You can customize exercises, add custom movements, or change routines anytime.
            </p>

            <div className="space-y-3">
              <div
                onClick={() => navigate('/exercises')}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-neutral-200">Browse Exercise Library</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary" />
              </div>

              <div
                onClick={() => navigate('/progress')}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-neutral-200">View Strength Analytics</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary" />
              </div>

              <div
                onClick={() => navigate('/profile')}
                className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between hover:border-neutral-700 cursor-pointer group"
              >
                <div className="flex items-center space-x-3">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-neutral-200">Edit Goals & Targets</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-primary" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-800 text-center">
            <p className="text-xs text-neutral-400">
              Consistency is key &bull; Stay hydrated & hit your daily protein
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: Quick Log Water */}
      <Modal isOpen={isWaterModalOpen} onClose={() => setIsWaterModalOpen(false)} title="Quick Log Water">
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">Choose a standard serving or type a custom amount (ml):</p>
          <div className="grid grid-cols-3 gap-3">
            {[250, 500, 750].map((amt) => (
              <button
                key={amt}
                onClick={() => handleQuickWater(amt)}
                className="py-3 px-2 rounded-xl bg-neutral-900 hover:bg-cyan-500/10 border border-neutral-800 hover:border-cyan-500/30 text-neutral-100 font-bold text-sm transition-all"
              >
                +{amt} ml
              </button>
            ))}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Custom Quantity (ml)</label>
            <div className="flex space-x-2">
              <input
                type="number"
                step="50"
                min="10"
                value={waterAmount}
                onChange={(e) => setWaterAmount(e.target.value)}
                className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => handleQuickWater(Number(waterAmount))}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold rounded-xl text-sm transition-all"
              >
                Log
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL 2: Update Weight */}
      <Modal isOpen={isWeightModalOpen} onClose={() => setIsWeightModalOpen(false)} title="Record Body Weight">
        <form onSubmit={handleUpdateWeight} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Weight ({user?.weightUnit || 'kg'}) *
            </label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="500"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder={`Current: ${d.currentWeight || user?.currentWeight || ''}`}
              required
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={weightNotes}
              onChange={(e) => setWeightNotes(e.target.value)}
              placeholder="e.g. Morning fasted weigh-in"
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold text-sm rounded-xl transition-all shadow-glow-sm"
            >
              Save Measurement
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Log Food */}
      <Modal isOpen={isFoodModalOpen} onClose={() => setIsFoodModalOpen(false)} title="Log Food Item">
        <form onSubmit={handleLogFood} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Food Name *</label>
            <input
              type="text"
              value={foodForm.name}
              onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
              placeholder="e.g. Grilled Chicken Salad"
              required
              className="w-full px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Meal Category</label>
              <select
                value={foodForm.mealCategory}
                onChange={(e) => setFoodForm({ ...foodForm, mealCategory: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">Serving Size</label>
              <input
                type="text"
                value={foodForm.servingQuantity}
                onChange={(e) => setFoodForm({ ...foodForm, servingQuantity: e.target.value })}
                placeholder="e.g. 200g, 1 bowl"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Calories *</label>
              <input
                type="number"
                min="0"
                value={foodForm.calories}
                onChange={(e) => setFoodForm({ ...foodForm, calories: e.target.value })}
                placeholder="kcal"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Protein (g)</label>
              <input
                type="number"
                min="0"
                value={foodForm.protein}
                onChange={(e) => setFoodForm({ ...foodForm, protein: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Carbs (g)</label>
              <input
                type="number"
                min="0"
                value={foodForm.carbs}
                onChange={(e) => setFoodForm({ ...foodForm, carbs: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">Fat (g)</label>
              <input
                type="number"
                min="0"
                value={foodForm.fat}
                onChange={(e) => setFoodForm({ ...foodForm, fat: e.target.value })}
                placeholder="0"
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsFoodModalOpen(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-dark-950 font-bold text-sm rounded-xl transition-all"
            >
              Log Food
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
