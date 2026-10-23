import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Flame, ArrowRight, User, Mail, Lock, Dumbbell, Target, Activity } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '25',
    height: '175',
    currentWeight: '72',
    weightUnit: 'kg',
    fitnessGoal: 'muscle_gain',
    preferredSplit: 'ppl',
    dailyCalorieTarget: '2400',
    dailyWaterTarget: '2500',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { register } = useAuth();
  const { showSuccess, showError } = useNotification();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        age: Number(formData.age),
        height: Number(formData.height),
        currentWeight: Number(formData.currentWeight),
        weightUnit: formData.weightUnit,
        fitnessGoal: formData.fitnessGoal,
        preferredSplit: formData.preferredSplit,
        dailyCalorieTarget: Number(formData.dailyCalorieTarget),
        dailyWaterTarget: Number(formData.dailyWaterTarget),
      });

      if (res.success) {
        showSuccess('Account registered successfully! Welcome to FitTrack.');
        navigate('/');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please check your fields.';
      setErrorMessage(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-lime-500 to-primary flex items-center justify-center text-dark-950 shadow-glow mb-4">
            <Flame className="w-8 h-8 fill-dark-950" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-100">
            Create Your <span className="text-primary">FitTrack</span> Account
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Configure your personal fitness targets & preferences</p>
        </div>

        {/* Form Card */}
        <div className="glass-panel p-8 rounded-3xl border border-neutral-800 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Credentials */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" /> 1. Account Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Marcus Vance"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="marcus@example.com"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Body Biometrics */}
            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center">
                <Activity className="w-4 h-4 mr-2" /> 2. Body Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Age (years) *
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
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Height (cm) *
                  </label>
                  <input
                    type="number"
                    name="height"
                    min="50"
                    max="280"
                    value={formData.height}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Weight *
                    </label>
                    <select
                      name="weightUnit"
                      value={formData.weightUnit}
                      onChange={handleChange}
                      className="bg-neutral-800 text-neutral-300 text-xs rounded px-1.5 py-0.5 border border-neutral-700"
                    >
                      <option value="kg">kg</option>
                      <option value="lbs">lbs</option>
                    </select>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    name="currentWeight"
                    min="20"
                    max="400"
                    value={formData.currentWeight}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Training Split & Daily Targets */}
            <div className="pt-4 border-t border-neutral-800">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3 flex items-center">
                <Target className="w-4 h-4 mr-2" /> 3. Fitness Goals & Routine
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Fitness Goal
                  </label>
                  <select
                    name="fitnessGoal"
                    value={formData.fitnessGoal}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="muscle_gain">Muscle Gain (Hypertrophy)</option>
                    <option value="fat_loss">Fat Loss (Cutting)</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Preferred Workout Split
                  </label>
                  <select
                    name="preferredSplit"
                    value={formData.preferredSplit}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="ppl">Push / Pull / Legs (PPL)</option>
                    <option value="upper_lower">Upper / Lower Split</option>
                    <option value="bro_split">Bro Split (Chest/Back/Arms/Legs/Shoulders)</option>
                    <option value="full_body">Full Body Routine</option>
                    <option value="custom">Custom Split</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                    Daily Calorie Target (kcal)
                  </label>
                  <input
                    type="number"
                    name="dailyCalorieTarget"
                    min="800"
                    max="8000"
                    value={formData.dailyCalorieTarget}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 text-dark-950 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all shadow-glow hover:shadow-lg text-sm mt-4"
            >
              <span>{loading ? 'Creating Account & Profile...' : 'Complete Registration & Start Training'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-800/80 text-center">
            <p className="text-sm text-neutral-400">
              Already registered?{' '}
              <Link to="/login" className="text-primary hover:underline font-semibold ml-1">
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
