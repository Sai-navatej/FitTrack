import axios from 'axios';

const api = axios.create({
  baseURL: `${(import.meta.env.VITE_API_URL || '').replace(/\/$/, '')}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if stored in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fittrack_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401s gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on a protected call
      // (and not already on login/register page)
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        localStorage.removeItem('fittrack_token');
        localStorage.removeItem('fittrack_user');
      }
    }

    return Promise.reject(error);
  }
);

export default api;

