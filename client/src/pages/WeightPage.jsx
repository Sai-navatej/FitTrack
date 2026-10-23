import React, { useState, useEffect } from 'react';
import {
  Scale,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  TrendingUp,
  TrendingDown,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { weightService } from '../services/weightService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const WeightPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [weightData, setWeightData] = useState({
    measurements: [],
    currentWeight: 0,
    unit: user?.weightUnit || 'kg',
    latestDifference: 0,
    periodChange: 0,
  });

  const [filterDays, setFilterDays] = useState('30');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    weight: '',
    unit: user?.weightUnit || 'kg',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Deletion confirm
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchWeightData = async () => {
    try {
      setLoading(true);
      const res = await weightService.getWeightHistory({ days: filterDays });
      if (res.success) {
        setWeightData(res);
      }
    } catch (err) {
      showError('Failed to load weight records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightData();
  }, [filterDays]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      weight: '',
      unit: weightData.unit || user?.weightUnit || 'kg',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingId(item._id);
    setForm({
      weight: item.weight,
      unit: item.unit,
      date: new Date(item.date).toISOString().split('T')[0],
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.weight) {
      showError('Weight value is required');
      return;
    }

    try {
      if (editingId) {
        await weightService.updateWeight(editingId, form);
        showSuccess('Weight measurement updated!');
      } else {
        await weightService.addWeight(form);
        showSuccess('Weight measurement logged!');
      }

      setIsModalOpen(false);
      fetchWeightData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save measurement');
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await weightService.deleteWeight(itemToDelete._id);
      showSuccess('Weight record deleted');
      setItemToDelete(null);
      fetchWeightData();
    } catch (err) {
      showError('Failed to delete weight entry');
    }
  };

  const chartData = (weightData.measurements || []).map((m) => ({
    date: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: m.weight,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-purple-400 mb-1">
            <Scale className="w-4 h-4" />
            <span>Body Composition</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Weight Tracking</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Record body measurements and monitor long-term weight trends.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-sm transition-all shadow-glow hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>Record Weight</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Latest Weight */}
        <div className="glass-card p-5 rounded-2xl border border-neutral-800">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Current Weight</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-3xl font-black text-neutral-100">{weightData.currentWeight || 0}</span>
            <span className="text-sm font-semibold text-neutral-400">{weightData.unit}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Latest verified record</p>
        </div>

        {/* Card 2: Latest Difference */}
        <div className="glass-card p-5 rounded-2xl border border-neutral-800">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Latest Difference</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className={`text-3xl font-black ${weightData.latestDifference > 0 ? 'text-purple-400' : weightData.latestDifference < 0 ? 'text-primary' : 'text-neutral-100'}`}>
              {weightData.latestDifference > 0 ? `+${weightData.latestDifference}` : weightData.latestDifference}
            </span>
            <span className="text-sm font-semibold text-neutral-400">{weightData.unit}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Change from previous measurement</p>
        </div>

        {/* Card 3: Period Change */}
        <div className="glass-card p-5 rounded-2xl border border-neutral-800">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Total Change in Period</span>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className={`text-3xl font-black ${weightData.periodChange > 0 ? 'text-purple-400' : weightData.periodChange < 0 ? 'text-primary' : 'text-neutral-100'}`}>
              {weightData.periodChange > 0 ? `+${weightData.periodChange}` : weightData.periodChange}
            </span>
            <span className="text-sm font-semibold text-neutral-400">{weightData.unit}</span>
          </div>
          <p className="text-xs text-neutral-500 mt-2">Across selected time window</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-neutral-100 flex items-center">
              <LineChartIcon className="w-5 h-5 mr-2 text-primary" />
              Weight Trend Over Time
            </h2>
            <p className="text-xs text-neutral-400">Interactive visual timeline of your body weight records</p>
          </div>

          <div className="flex items-center space-x-2">
            {['7', '30', '90', 'all'].map((range) => (
              <button
                key={range}
                onClick={() => setFilterDays(range)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterDays === range
                    ? 'bg-primary text-dark-950 shadow-glow-sm'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {range === 'all' ? 'All Time' : `${range} Days`}
              </button>
            ))}
          </div>
        </div>

        {chartData.length > 1 ? (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  domain={['dataMin - 1', 'dataMax + 1']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121215',
                    borderColor: '#2e2e38',
                    borderRadius: '12px',
                    color: '#f4f4f5',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} ${weightData.unit}`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
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
            icon={Scale}
            title="Insufficient Data for Chart"
            description="Log at least 2 weight measurements to view your progression line graph over time."
            actionText="Record Measurement"
            onAction={handleOpenAdd}
          />
        )}
      </div>

      {/* Measurements History Table */}
      <div className="glass-panel rounded-3xl border border-neutral-800 overflow-hidden">
        <div className="p-5 border-b border-neutral-800">
          <h3 className="text-base font-bold text-neutral-100">Weight Log Entries</h3>
          <p className="text-xs text-neutral-400">All historical measurements saved in your profile</p>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading measurements..." />
        ) : (weightData.measurements || []).length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-900/80 text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-800">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Weight</th>
                  <th className="px-5 py-3">Notes</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {[...weightData.measurements].reverse().map((item) => (
                  <tr key={item._id} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="px-5 py-3.5 text-neutral-200 font-medium">
                      {new Date(item.date).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-100 font-bold text-sm">
                      {item.weight} <span className="text-xs font-normal text-neutral-400">{item.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-neutral-400">
                      {item.notes || <span className="text-neutral-600 italic">No notes</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={Scale}
              title="No Weight Measurements Logged"
              description="Record your weight to begin monitoring your body composition changes."
              actionText="Add Measurement"
              onAction={handleOpenAdd}
            />
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Weight Entry' : 'Record Weight Entry'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Weight Value *
              </label>
              <input
                type="number"
                step="0.1"
                min="20"
                max="500"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="75.5"
                required
                className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Unit
              </label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="lbs">lbs (Pounds)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g. Fasted post-cardio"
              className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-primary"
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
              Save Entry
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Weight Entry"
        message={`Delete measurement of ${itemToDelete?.weight} ${itemToDelete?.unit}?`}
      />
    </div>
  );
};

export default WeightPage;
