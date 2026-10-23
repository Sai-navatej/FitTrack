import api from './api';

export const nutritionService = {
  async getDailyNutrition(date) {
    const params = date ? { date } : {};
    const response = await api.get('/nutrition', { params });
    return response.data;
  },

  async addFoodEntry(entryData) {
    const response = await api.post('/nutrition', entryData);
    return response.data;
  },

  async updateFoodEntry(id, entryData) {
    const response = await api.put(`/nutrition/${id}`, entryData);
    return response.data;
  },

  async deleteFoodEntry(id) {
    const response = await api.delete(`/nutrition/${id}`);
    return response.data;
  },

  async searchFood(query) {
    const response = await api.get('/nutrition/search', { params: { q: query } });
    return response.data;
  },
};
