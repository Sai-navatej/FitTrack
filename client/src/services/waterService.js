import api from './api';

export const waterService = {
  async logWater(amountMl, date) {
    const response = await api.post('/water', { amountMl, date });
    return response.data;
  },

  async getDailyWater(date) {
    const params = date ? { date } : {};
    const response = await api.get('/water/daily', { params });
    return response.data;
  },

  async getWaterHistory(days = 7) {
    const response = await api.get('/water/history', { params: { days } });
    return response.data;
  },

  async deleteWaterEntry(id) {
    const response = await api.delete(`/water/${id}`);
    return response.data;
  },
};
