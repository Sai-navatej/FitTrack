import api from './api';

export const progressService = {
  async getDashboardSummary() {
    const response = await api.get('/progress/dashboard');
    return response.data;
  },

  async getWorkoutFrequency(range = '30d') {
    const response = await api.get('/progress/frequency', { params: { range } });
    return response.data;
  },

  async getStrengthHistory(exerciseName, range = 'all') {
    const response = await api.get('/progress/strength', { params: { exerciseName, range } });
    return response.data;
  },

  async getMuscleDistribution(range = '30d') {
    const response = await api.get('/progress/distribution', { params: { range } });
    return response.data;
  },

  async getVolumeHistory(range = '30d') {
    const response = await api.get('/progress/volume', { params: { range } });
    return response.data;
  },
};
