import api from './api';

export const weightService = {
  async getWeightHistory(params = {}) {
    const response = await api.get('/weight', { params });
    return response.data;
  },

  async addWeight(data) {
    const response = await api.post('/weight', data);
    return response.data;
  },

  async updateWeight(id, data) {
    const response = await api.put(`/weight/${id}`, data);
    return response.data;
  },

  async deleteWeight(id) {
    const response = await api.delete(`/weight/${id}`);
    return response.data;
  },
};
