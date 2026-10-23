import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Calendar,
  Flame,
  Search,
  PieChart,
  Edit2,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { nutritionService } from '../services/nutritionService';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';

const mealCategories = ['breakfast', 'lunch', 'dinner', 'snack'];

const NutritionPage = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [nutritionData, setNutritionData] = useState({
    entries: [],
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    targetCalories: user?.dailyCalorieTarget || 2200,
    remainingCalories: 2200,
  });

  // Food logging modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [foodForm, setFoodForm] = useState({
    name: '',
    mealCategory: 'breakfast',
    servingQuantity: '1 serving',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  // Food Search Presets
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Deletion confirm
  const [entryToDelete, setEntryToDelete] = useState(null);

  const fetchNutrition = async () => {
    try {
      setLoading(true);
      const res = await nutritionService.getDailyNutrition(selectedDate);
      if (res.success) {
        setNutritionData(res);
      }
    } catch (err) {
      showError('Failed to load nutrition data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();
  }, [selectedDate]);

  // Food Preset Search
  useEffect(() => {
    const handleSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      try {
        setIsSearching(true);
        const res = await nutritionService.searchFood(searchQuery);
        if (res.success) {
          setSearchResults(res.results);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    };

    const delay = setTimeout(handleSearch, 300);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const handleSelectPreset = (preset) => {
    setFoodForm({
      ...foodForm,
      name: preset.name,
      servingQuantity: preset.servingQuantity,
      calories: preset.calories,
      protein: preset.protein,
      carbs: preset.carbs,
      fat: preset.fat,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenAdd = (category = 'breakfast') => {
    setEditingEntryId(null);
    setFoodForm({
      name: '',
      mealCategory: category,
      servingQuantity: '1 serving',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntryId(entry._id);
    setFoodForm({
      name: entry.name,
      mealCategory: entry.mealCategory,
      servingQuantity: entry.servingQuantity,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
    });
    setIsModalOpen(true);
  };

  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (!foodForm.name || foodForm.calories === '') {
      showError('Food item name and calories are required');
      return;
    }

    try {
      const payload = {
        ...foodForm,
        calories: Number(foodForm.calories),
        protein: Number(foodForm.protein) || 0,
        carbs: Number(foodForm.carbs) || 0,
        fat: Number(foodForm.fat) || 0,
        date: new Date(selectedDate),
      };

      if (editingEntryId) {
        await nutritionService.updateFoodEntry(editingEntryId, payload);
        showSuccess('Food entry updated!');
      } else {
        await nutritionService.addFoodEntry(payload);
        showSuccess('Food entry logged successfully!');
      }

      setIsModalOpen(false);
      fetchNutrition();
    } catch (err) {
      showError('Failed to save food entry');
    }
  };

  const handleDeleteEntry = async () => {
    if (!entryToDelete) return;
    try {
      await nutritionService.deleteFoodEntry(entryToDelete._id);
      showSuccess('Food entry removed');
      setNutritionData((prev) => ({
        ...prev,
        entries: prev.entries.filter((e) => e._id !== entryToDelete._id),
      }));
      setEntryToDelete(null);
      fetchNutrition();
    } catch (err) {
      showError('Failed to delete food entry');
    }
  };

  const totals = nutritionData.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const targetCal = nutritionData.targetCalories || user?.dailyCalorieTarget || 2200;
  const calPercent = Math.min(100, Math.round((totals.calories / targetCal) * 100));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-orange-400 mb-1">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Nutrition & Macro Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold text-neutral-100 tracking-tight">Daily Calorie Log</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track your caloric intake, protein synthesis targets, and macronutrient balance.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-1.5">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs text-neutral-200 outline-none font-medium"
            />
          </div>

          <button
            onClick={() => handleOpenAdd('breakfast')}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-hover text-dark-950 font-bold rounded-xl text-xs transition-all shadow-glow hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Log Food</span>
          </button>
        </div>
      </div>

      {/* Daily Macro & Calorie Summary Card */}
      <div className="glass-panel p-6 rounded-3xl border border-neutral-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Calories Summary</span>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-4xl font-black text-neutral-100">{totals.calories}</span>
              <span className="text-sm font-semibold text-neutral-400">/ {targetCal} kcal</span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {nutritionData.remainingCalories > 0 ? (
                <span>
                  <strong className="text-primary">{nutritionData.remainingCalories} kcal</strong> remaining for today
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">Daily calorie target reached</span>
              )}
            </p>
          </div>

          {/* Macro Pills */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Protein</span>
              <span className="text-xl font-black text-neutral-100">{totals.protein}g</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Carbs</span>
              <span className="text-xl font-black text-neutral-100">{totals.carbs}g</span>
            </div>
            <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Fat</span>
              <span className="text-xl font-black text-neutral-100">{totals.fat}g</span>
            </div>
          </div>
        </div>

        {/* Calorie Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden border border-neutral-800">
            <div
              className="bg-gradient-to-r from-lime-500 to-primary h-full rounded-full transition-all duration-700"
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400 font-medium">
            <span>0 kcal</span>
            <span>{calPercent}% of target</span>
            <span>{targetCal} kcal</span>
          </div>
        </div>
      </div>

      {/* Meals Grouped by Category */}
      {loading ? (
        <LoadingSpinner text="Loading food entries..." />
      ) : (
        <div className="space-y-6">
          {mealCategories.map((cat) => {
            const categoryEntries = (nutritionData.entries || []).filter(
              (item) => item.mealCategory === cat
            );
            const catCalories = categoryEntries.reduce((sum, item) => sum + item.calories, 0);

            return (
              <div key={cat} className="glass-card rounded-3xl border border-neutral-800/80 p-5 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-neutral-100 capitalize">{cat}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900 text-neutral-400 border border-neutral-800">
                      {catCalories} kcal
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenAdd(cat)}
                    className="flex items-center space-x-1 text-xs text-primary hover:underline font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {categoryEntries.length > 0 ? (
                  <div className="divide-y divide-neutral-800/60">
                    {categoryEntries.map((entry) => (
                      <div
                        key={entry._id}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-neutral-100">{entry.name}</h4>
                          <div className="flex items-center space-x-3 text-xs text-neutral-400 mt-0.5">
                            <span>{entry.servingQuantity}</span>
                            <span>&bull;</span>
                            <span className="text-neutral-300 font-medium">{entry.calories} kcal</span>
                            <span>&bull;</span>
                            <span>P: {entry.protein}g</span>
                            <span>C: {entry.carbs}g</span>
                            <span>F: {entry.fat}g</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end sm:self-center">
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEntryToDelete(entry)}
                            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500 py-2 italic">
                    No items logged for {cat} yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Informational Disclaimer */}
      <div className="flex items-start space-x-3 p-4 rounded-2xl bg-neutral-900/40 border border-neutral-800/80 text-xs text-neutral-400">
        <AlertCircle className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
        <p>
          FitTrack nutrition tracking provides general informational guidance based on your configured targets. It does not constitute medical advice or guaranteed weight loss outcomes.
        </p>
      </div>

      {/* Add / Edit Food Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingEntryId ? 'Edit Food Entry' : 'Log Food Entry'}
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Quick preset search if adding */}
          {!editingEntryId && (
            <div className="relative">
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1.5">
                Quick Preset Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search preset items (e.g. Chicken Breast, Rice, Eggs, Oatmeal)..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-dark-900 border border-neutral-800 rounded-xl shadow-2xl p-1 space-y-1">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectPreset(item)}
                      className="p-2 rounded-lg hover:bg-neutral-800 cursor-pointer flex justify-between items-center text-xs"
                    >
                      <span className="font-semibold text-neutral-200">{item.name}</span>
                      <span className="text-neutral-400">
                        {item.calories} kcal &bull; {item.servingQuantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSaveFood} className="space-y-3.5 pt-1">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">
                Food Item Name *
              </label>
              <input
                type="text"
                value={foodForm.name}
                onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                placeholder="e.g. Grilled Chicken Breast"
                required
                className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">
                  Meal Category
                </label>
                <select
                  value={foodForm.mealCategory}
                  onChange={(e) => setFoodForm({ ...foodForm, mealCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-neutral-100 text-sm focus:outline-none focus:border-orange-500 capitalize"
                >
                  {mealCategories.map((c) => (
                    <option key={c} value={c} className="capitalize">
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase mb-1">
                  Serving Quantity
                </label>
                <input
                  type="text"
                  value={foodForm.servingQuantity}
                  onChange={(e) => setFoodForm({ ...foodForm, servingQuantity: e.target.value })}
                  placeholder="e.g. 150g, 1 cup"
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
                  step="0.1"
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
                  step="0.1"
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
                  step="0.1"
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
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-dark-950 font-bold text-sm rounded-xl transition-all"
              >
                {editingEntryId ? 'Update Entry' : 'Log Food'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        onConfirm={handleDeleteEntry}
        title="Delete Food Entry"
        message={`Remove "${entryToDelete?.name}" (${entryToDelete?.calories} kcal) from today's log?`}
      />
    </div>
  );
};

export default NutritionPage;
