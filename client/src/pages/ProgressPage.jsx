import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Activity,
  Dumbbell,
  Scale,
  PieChart as PieChartIcon,
  Calendar,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { progressService } from '../services/progressService';
import { exerciseService } from '../services/exerciseService';
import { weightService } from '../services/weightService';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const COLORS = ['#84cc16', '#06b6d4', '#a855f7', '#f97316', '#ef4444', '#3b82f6', '#ec4899'];

const ProgressPage = () => {
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, all

  // Analytics states
  const [frequencyData, setFrequencyData] = useState([]);
  const [volumeData, setVolumeData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);

  // Strength progress exercise selection
  const [exercisesList, setExercisesList] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('Barbell Bench Press');
  const [strengthProgression, setStrengthProgression] = useState([]);
  const [loadingStrength, setLoadingStrength] = useState(false);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [freqRes, volRes, distRes, wtRes, exRes] = await Promise.all([
        progressService.getWorkoutFrequency(timeRange),
        progressService.getVolumeHistory(timeRange),
        progressService.getMuscleDistribution(timeRange),
        weightService.getWeightHistory({ days: timeRange === 'all' ? 'all' : timeRange.replace('d', '') }),
        exerciseService.getExercises(),
      ]);

      if (freqRes.success) setFrequencyData(freqRes.frequency);
      if (volRes.success) setVolumeData(volRes.volumeData);
      if (distRes.success) setDistributionData(distRes.distribution);
      if (wtRes.success) setWeightHistory(wtRes.measurements);
      if (exRes.success) {
        setExercisesList(exRes.exercises);
        if (!selectedExercise && exRes.exercises.length > 0) {
          setSelectedExercise(exRes.exercises[0].name);
        }
      }
    } catch (err) {
      showError('Failed to load fitness analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAnalytics();
  }, [timeRange]);

  // Load strength progression when selected exercise or time range changes
  useEffect(() => {
    const fetchStrength = async () => {
      if (!selectedExercise) return;
      try {
        setLoadingStrength(true);
        const res = await progressService.getStrengthHistory(selectedExercise, timeRange);
        if (res.success) {
          setStrengthProgression(res.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingStrength(false);
      }
    };

    fetchStrength();
  }, [selectedExercise, timeRange]);

  if (loading) {
    return <LoadingSpinner text="Computing fitness analytics & charts..." />;
  }

  const weightChartData = weightHistory.map((m) => ({
    date: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: m.weight,
  }));

  const volumeChartData = volumeData.map((v) => ({
    date: new Date(v.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    volume: v.totalVolume,
    title: v.title,
  }));

  const strengthChartData = strengthProgression.map((s) => ({
    date: new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    maxWeight: s.maxWeight,
    reps: s.repsAtMax,
    volume: s.totalVolume,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Global Time Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-primary mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Progress & Performance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Fitness Analytics</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Interactive metrics derived directly from your completed MongoDB logs.
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="flex items-center space-x-1.5 p-1 bg-neutral-900 border border-neutral-800 rounded-2xl">
          {[
            { label: '7 Days', val: '7d' },
            { label: '30 Days', val: '30d' },
            { label: '90 Days', val: '90d' },
            { label: 'All History', val: 'all' },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setTimeRange(item.val)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeRange === item.val
                  ? 'bg-primary text-dark-950 shadow-glow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row 1: Strength Progression (User Selectable Exercise) */}
      <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center">
              <Dumbbell className="w-5 h-5 mr-2 text-primary" />
              Exercise Strength Progression
            </h2>
            <p className="text-xs text-neutral-400">Track maximum load lifted (kg) over time for any movement</p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase text-neutral-400">Exercise:</span>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 font-semibold focus:outline-none focus:border-primary"
            >
              {exercisesList.map((ex) => (
                <option key={ex._id} value={ex.name}>
                  {ex.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingStrength ? (
          <LoadingSpinner size="sm" text="Updating strength curve..." />
        ) : strengthChartData.length > 0 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} unit="kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121215',
                    borderColor: '#2e2e38',
                    borderRadius: '12px',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                  formatter={(val, name) => [
                    `${val} ${name === 'maxWeight' ? 'kg (Max Load)' : ''}`,
                    'Peak Load',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  name="maxWeight"
                  stroke="#84cc16"
                  strokeWidth={3}
                  dot={{ fill: '#84cc16', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#bef264' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={Dumbbell}
            title={`No Data for ${selectedExercise}`}
            description="Complete a workout session including this exercise to generate its strength trajectory graph."
          />
        )}
      </div>

      {/* Row 2: Training Volume & Body Weight */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Training Volume */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-neutral-100 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-cyan-400" />
              Training Volume (kg)
            </h2>
            <p className="text-xs text-neutral-400">
              Volume = Sets &times; Reps &times; External Weight (pure bodyweight without added load is 0 kg external)
            </p>
          </div>

          {volumeChartData.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121215',
                      borderColor: '#2e2e38',
                      borderRadius: '12px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val.toLocaleString()} kg`, 'Session Volume']}
                  />
                  <Bar dataKey="volume" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No Volume Data"
              description="Record workouts to build your total tonnage graph."
            />
          )}
        </div>

        {/* Body Weight Progress */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-neutral-100 flex items-center">
              <Scale className="w-4 h-4 mr-2 text-purple-400" />
              Body Weight Trend
            </h2>
            <p className="text-xs text-neutral-400">Measured scale weight progression over the selected period</p>
          </div>

          {weightChartData.length > 1 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121215',
                      borderColor: '#2e2e38',
                      borderRadius: '12px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{ fill: '#a855f7', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Scale}
              title="Insufficient Weight Entries"
              description="Record at least 2 body weight measurements to view trendline."
            />
          )}
        </div>
      </div>

      {/* Row 3: Muscle Group Distribution & Workout Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Muscle Distribution Pie Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-neutral-100 flex items-center">
              <PieChartIcon className="w-4 h-4 mr-2 text-amber-400" />
              Muscle Group Training Distribution
            </h2>
            <p className="text-xs text-neutral-400">Relative training frequency across muscle anatomy</p>
          </div>

          {distributionData.length > 0 ? (
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="muscle"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121215',
                      borderColor: '#2e2e38',
                      borderRadius: '12px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                    }}
                    formatter={(val, name, props) => [`${val} exercises (${props.payload.percentage}%)`, name]}
                  />
                  <Legend
                    formatter={(val) => <span className="text-neutral-300 text-xs">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={PieChartIcon}
              title="No Muscle Distribution Data"
              description="Train different muscle groups to see your balanced workload distribution."
            />
          )}
        </div>

        {/* Workout Frequency / Consistency */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <div>
            <h2 className="text-base font-bold text-neutral-100 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              Workout Frequency & Consistency
            </h2>
            <p className="text-xs text-neutral-400">Number of completed training sessions per day/week</p>
          </div>

          {frequencyData.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={frequencyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#121215',
                      borderColor: '#2e2e38',
                      borderRadius: '12px',
                      color: '#f4f4f5',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val} session(s)`, 'Completed Workouts']}
                  />
                  <Bar dataKey="count" fill="#84cc16" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title="No Workout Frequency Records"
              description="Finish workout sessions to visualize your training frequency rhythm."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
