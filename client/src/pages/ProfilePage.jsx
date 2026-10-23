import React, { useState, useEffect } from 'react';
import {
  User,
  Scale,
  Target,
  Flame,
  Droplets,
  Bell,
  Save,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    age: user?.age || 25,
    height: user?.height || 175,
    currentWeight: user?.currentWeight || 75,
    weightUnit: user?.weightUnit || 'kg',
    fitnessGoal: user?.fitnessGoal || 'maintenance',
    preferredSplit: user?.preferredSplit || 'ppl',
    dailyCalorieTarget: user?.dailyCalorieTarget || 2200,
    dailyWaterTarget: user?.dailyWaterTarget || 2500,
    reminderEnabled: user?.reminderPreferences?.enabled ?? true,
    reminderInterval: user?.reminderPreferences?.intervalMinutes || 120,
    wakingStart: user?.reminderPreferences?.wakingHourStart ?? 8,
    wakingEnd: user?.reminderPreferences?.wakingHourEnd ?? 22,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        age: user.age || 25,
        height: user.height || 175,
        currentWeight: user.currentWeight || 75,
        weightUnit: user.weightUnit || 'kg',
        fitnessGoal: user.fitnessGoal || 'maintenance',
        preferredSplit: user.preferredSplit || 'ppl',
        dailyCalorieTarget: user.dailyCalorieTarget || 2200,
        dailyWaterTarget: user.dailyWaterTarget || 2500,
        reminderEnabled: user.reminderPreferences?.enabled ?? true,
        reminderInterval: user.reminderPreferences?.intervalMinutes || 120,
        wakingStart: user.reminderPreferences?.wakingHourStart ?? 8,
        wakingEnd: user.reminderPreferences?.wakingHourEnd ?? 22,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const payload = {
        fullName: formData.fullName,
        age: Number(formData.age),
        height: Number(formData.height),
        currentWeight: Number(formData.currentWeight),
        weightUnit: formData.weightUnit,
        fitnessGoal: formData.fitnessGoal,
        preferredSplit: formData.preferredSplit,
        dailyCalorieTarget: Number(formData.dailyCalorieTarget),
        dailyWaterTarget: Number(formData.dailyWaterTarget),
      };

      const res = await authService.updateProfile(payload);

      // Also update reminder preferences
      await authService.updateReminderPreferences({
        enabled: formData.reminderEnabled,
        intervalMinutes: Number(formData.reminderInterval),
        wakingHourStart: Number(formData.wakingStart),
        wakingHourEnd: Number(formData.wakingEnd),
      });

      if (res.success) {
        showSuccess('Profile and preferences updated successfully!');
        updateUserData({
          ...res.user,
          reminderPreferences: {
            enabled: formData.reminderEnabled,
            intervalMinutes: Number(formData.reminderInterval),
            wakingHourStart: Number(formData.wakingStart),
            wakingHourEnd: Number(formData.wakingEnd),
          },
        });
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
          <User className="w-4 h-4" />
          <span>User Profile & Settings</span>
        </div>
        <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Personalization</h1>
        <p className="text-sm text-neutral-400 mt-1">
          Manage your account info, body metrics, calorie benchmarks, and reminders.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account Info */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <h2 className="text-base font-bold text-neutral-100 flex items-center">
            <User className="w-4 h-4 mr-2 text-primary" />
            Account Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-2.5 bg-neutral-900/50 border border-neutral-800 rounded-xl text-neutral-400 text-sm cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Body Biometrics */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <h2 className="text-base font-bold text-neutral-100 flex items-center">
            <Scale className="w-4 h-4 mr-2 text-purple-400" />
            Body Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Age
              </label>
              <input
                type="number"
                name="age"
                min="10"
                max="120"
                value={formData.age}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Height (cm)
              </label>
              <input
                type="number"
                name="height"
                min="50"
                max="300"
                value={formData.height}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Current Weight
              </label>
              <input
                type="number"
                step="0.1"
                name="currentWeight"
                min="20"
                max="500"
                value={formData.currentWeight}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Measurement Unit
              </label>
              <select
                name="weightUnit"
                value={formData.weightUnit}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="lbs">lbs (Pounds)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Goals & Training Targets */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <h2 className="text-base font-bold text-neutral-100 flex items-center">
            <Target className="w-4 h-4 mr-2 text-amber-400" />
            Fitness Objectives & Daily Targets
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Primary Goal
              </label>
              <select
                name="fitnessGoal"
                value={formData.fitnessGoal}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              >
                <option value="muscle_gain">Muscle Gain (Hypertrophy)</option>
                <option value="fat_loss">Fat Loss (Deficit)</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Default Workout Split
              </label>
              <select
                name="preferredSplit"
                value={formData.preferredSplit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              >
                <option value="ppl">Push / Pull / Legs (PPL)</option>
                <option value="upper_lower">Upper / Lower Split</option>
                <option value="bro_split">Bro Split</option>
                <option value="full_body">Full Body</option>
                <option value="custom">Custom Split</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Daily Calorie Target (kcal)
              </label>
              <input
                type="number"
                name="dailyCalorieTarget"
                min="500"
                max="10000"
                value={formData.dailyCalorieTarget}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Daily Water Target (ml)
              </label>
              <input
                type="number"
                step="50"
                name="dailyWaterTarget"
                min="500"
                max="10000"
                value={formData.dailyWaterTarget}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Water Drinking Reminder Preferences */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <h2 className="text-base font-bold text-neutral-100 flex items-center">
            <Droplets className="w-4 h-4 mr-2 text-cyan-400" />
            Hydration Reminders Configuration
          </h2>

          <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
            <div>
              <span className="text-sm font-bold text-neutral-100 block">Hydration Reminders</span>
              <span className="text-xs text-neutral-400">Receive periodic browser / in-app hydration checks</span>
            </div>
            <input
              type="checkbox"
              name="reminderEnabled"
              checked={formData.reminderEnabled}
              onChange={handleChange}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Interval (Minutes)
              </label>
              <select
                name="reminderInterval"
                value={formData.reminderInterval}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
              >
                <option value="60">1 Hour (60m)</option>
                <option value="90">1.5 Hours (90m)</option>
                <option value="120">2 Hours (120m) — Recommended</option>
                <option value="180">3 Hours (180m)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Waking Start (Hour: 00-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                name="wakingStart"
                value={formData.wakingStart}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Waking End (Hour: 00-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                name="wakingEnd"
                value={formData.wakingEnd}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Profile...' : 'Save All Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
