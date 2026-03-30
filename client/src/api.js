import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Automatically redirect to login on 401 (but not for /auth endpoints)
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      // Don't redirect for auth endpoints (like /auth/me)
      const url = err.config?.url;
      if (url && !url.includes('/auth/')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
