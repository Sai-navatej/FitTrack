import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Plus,
  Trash2,
  Calendar,
  Bell,
  BellOff,
  Settings,
  Info,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { waterService } from '../services/waterService';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useWaterReminder } from '../context/WaterReminderContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';

const WaterPage = () => {
  const { user, updateUserData } = useAuth();
  const { showSuccess, showError } = useNotification();
  const { notificationPermission, requestPermission } = useWaterReminder();

  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState({
    totalConsumedMl: 0,
    targetMl: user?.dailyWaterTarget || 2500,
    remainingMl: 2500,
    percentage: 0,
    entries: [],
  });

  const [waterHistory, setWaterHistory] = useState([]);
  const [customMl, setCustomMl] = useState('250');

  // Reminder settings modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    enabled: user?.reminderPreferences?.enabled ?? true,
    intervalMinutes: user?.reminderPreferences?.intervalMinutes || 120,
    wakingHourStart: user?.reminderPreferences?.wakingHourStart ?? 8,
    wakingHourEnd: user?.reminderPreferences?.wakingHourEnd ?? 22,
  });

  const loadWaterData = async () => {
    try {
      setLoading(true);
      const [dailyRes, histRes] = await Promise.all([
        waterService.getDailyWater(),
        waterService.getWaterHistory(7),
      ]);

      if (dailyRes.success) {
        setDailyData(dailyRes);
      }
      if (histRes.success) {
        setWaterHistory(histRes.history);
      }
    } catch (err) {
      showError('Failed to load water tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaterData();
  }, []);

  const handleLog = async (amount) => {
    const ml = Number(amount);
    if (!ml || ml <= 0) return;
    try {
      const res = await waterService.logWater(ml);
      if (res.success) {
        showSuccess(`+${ml} ml logged! Keep staying hydrated.`);
        loadWaterData();
      }
    } catch (err) {
      showError('Failed to log water');
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await waterService.deleteWaterEntry(id);
      showSuccess('Entry removed');
      loadWaterData();
    } catch (err) {
      showError('Failed to delete water entry');
    }
  };

  const handleSaveReminderSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await authService.updateReminderPreferences(reminderForm);
      if (res.success) {
        showSuccess('Hydration reminder settings saved to database!');
        if (user) {
          updateUserData({ ...user, reminderPreferences: reminderForm });
        }
        setIsReminderModalOpen(false);
      }
    } catch (err) {
      showError('Failed to update reminder settings');
    }
  };

  const chartData = waterHistory.map((item) => ({
    date: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    amountMl: item.amountMl,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
            <Droplets className="w-4 h-4" />
            <span>Hydration Tracker</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Water Intake & Reminders</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Maintain optimal hydration with scheduled intervals and intake logs.
          </p>
        </div>

        <button
          onClick={() => setIsReminderModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-bold transition-all"
        >
          <Settings className="w-4 h-4 text-cyan-400" />
          <span>Reminder Settings</span>
        </button>
      </div>

      {/* Main Hydration Progress Hero */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-neutral-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Today's Hydration</span>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-4xl sm:text-5xl font-black text-neutral-100">
                {dailyData.totalConsumedMl.toLocaleString()}
              </span>
              <span className="text-base font-semibold text-neutral-400">
                / {dailyData.targetMl.toLocaleString()} ml
              </span>
            </div>
            <p className="text-sm text-neutral-400 mt-2">
              {dailyData.remainingMl > 0 ? (
                <span>
                  <strong className="text-cyan-400">{dailyData.remainingMl.toLocaleString()} ml</strong> remaining to hit target
                </span>
              ) : (
                <span className="text-primary font-bold flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Daily hydration goal accomplished!
                </span>
              )}
            </p>
          </div>

          {/* Quick Serving Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            {[250, 500, 750, 1000].map((amt) => (
              <button
                key={amt}
                onClick={() => handleLog(amt)}
                className="px-4 py-3 bg-neutral-900 hover:bg-cyan-500/20 border border-neutral-800 hover:border-cyan-500/40 text-neutral-100 hover:text-cyan-300 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{amt} ml</span>
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2 relative z-10">
          <div className="w-full bg-neutral-900 h-4 rounded-full overflow-hidden border border-neutral-800 p-0.5">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${dailyData.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-neutral-400 font-medium">
            <span>0 ml</span>
            <span className="font-bold text-cyan-400">{dailyData.percentage}% Completed</span>
            <span>{dailyData.targetMl} ml</span>
          </div>
        </div>

        {/* Custom amount input */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-neutral-400 uppercase">Custom Quantity:</span>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="50"
              min="10"
              max="5000"
              value={customMl}
              onChange={(e) => setCustomMl(e.target.value)}
              className="w-28 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-xs focus:outline-none focus:border-cyan-500"
              placeholder="e.g. 350"
            />
            <span className="text-xs text-neutral-500 font-medium">ml</span>
            <button
              onClick={() => handleLog(Number(customMl))}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-xs rounded-xl transition-all"
            >
              Add Water
            </button>
          </div>
        </div>
      </div>

      {/* Reminder Status Card */}
      <div className="glass-panel p-6 rounded-3xl border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-100">2-Hour Water Reminders</h3>
            <p className="text-xs text-neutral-400 mt-0.5 max-w-xl leading-relaxed">
              Current schedule: Every{' '}
              <strong className="text-neutral-200">{reminderForm.intervalMinutes} minutes</strong> between{' '}
              <strong className="text-neutral-200">{reminderForm.wakingHourStart}:00</strong> and{' '}
              <strong className="text-neutral-200">{reminderForm.wakingHourEnd}:00</strong>.
              Notifications are silenced during quiet hours.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-center">
          {notificationPermission !== 'granted' ? (
            <button
              onClick={requestPermission}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all"
            >
              <BellOff className="w-4 h-4" />
              <span>Allow Browser Notifications</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Browser Notifications Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Technical architecture notice per Section 11 requirement */}
      <div className="flex items-start space-x-3 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-neutral-200">How Reminders Work:</strong> Modern browsers suspend background timers when tabs are closed or device is asleep. FitTrack activates high-priority browser notifications while the tab is active or upon returning, with fallback in-app alerts to prevent duplicate or missed reminders.
        </p>
      </div>

      {/* Water History Chart & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <h3 className="text-base font-bold text-neutral-100">7-Day Hydration History</h3>
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  formatter={(val) => [`${val} ml`, 'Water Consumed']}
                />
                <Bar dataKey="amountMl" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Log Entries */}
        <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
          <h3 className="text-base font-bold text-neutral-100">Today's Intake Log</h3>
          {loading ? (
            <LoadingSpinner text="Loading log..." />
          ) : dailyData.entries.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {dailyData.entries.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <Droplets className="w-4 h-4 text-cyan-400" />
                    <div>
                      <span className="font-bold text-neutral-100">+{entry.amountMl} ml</span>
                      <span className="text-neutral-500 ml-2">
                        {new Date(entry.createdAt || entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEntry(entry._id)}
                    className="p-1 rounded text-neutral-500 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic py-6 text-center">
              No water logged yet today. Use the buttons above to log your first glass!
            </p>
          )}
        </div>
      </div>

      {/* Reminder Settings Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Hydration Reminder Settings"
      >
        <form onSubmit={handleSaveReminderSettings} className="space-y-4">
          <div className="flex items-center justify-between p-3.5 bg-neutral-900 rounded-xl border border-neutral-800">
            <div>
              <span className="text-sm font-bold text-neutral-100 block">Enable Reminders</span>
              <span className="text-xs text-neutral-400">Receive periodic hydration check notifications</span>
            </div>
            <input
              type="checkbox"
              checked={reminderForm.enabled}
              onChange={(e) => setReminderForm({ ...reminderForm, enabled: e.target.checked })}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Reminder Interval (Minutes)
            </label>
            <select
              value={reminderForm.intervalMinutes}
              onChange={(e) => setReminderForm({ ...reminderForm, intervalMinutes: Number(e.target.value) })}
              className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 1 hour (60 mins)</option>
              <option value="90">Every 1.5 hours (90 mins)</option>
              <option value="120">Every 2 hours (120 mins) — Recommended</option>
              <option value="180">Every 3 hours (180 mins)</option>
              <option value="240">Every 4 hours (240 mins)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Waking Start (Hour: 00-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={reminderForm.wakingHourStart}
                onChange={(e) => setReminderForm({ ...reminderForm, wakingHourStart: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-neutral-500">e.g. 8 for 8:00 AM</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Waking End (Hour: 00-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={reminderForm.wakingHourEnd}
                onChange={(e) => setReminderForm({ ...reminderForm, wakingHourEnd: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-neutral-500">e.g. 22 for 10:00 PM</span>
            </div>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(false)}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold text-sm rounded-xl transition-all"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WaterPage;
