import api from './api';

export const workoutService = {
  async getSplits() {
    const response = await api.get('/workouts/splits');
    return response.data;
  },

  async updateSplit(splitData) {
    const response = await api.put('/workouts/splits', splitData);
    return response.data;
  },

  async saveWorkout(workoutData) {
    const response = await api.post('/workouts', workoutData);
    return response.data;
  },

  async getWorkoutHistory(params = {}) {
    const response = await api.get('/workouts', { params });
    return response.data;
  },

  async getWorkoutById(id) {
    const response = await api.get(`/workouts/${id}`);
    return response.data;
  },

  async updateWorkout(id, workoutData) {
    const response = await api.put(`/workouts/${id}`, workoutData);
    return response.data;
  },

  async deleteWorkout(id) {
    const response = await api.delete(`/workouts/${id}`);
    return response.data;
  },
};
