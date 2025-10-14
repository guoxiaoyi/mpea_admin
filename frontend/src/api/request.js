import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

const service = axios.create({
  baseURL: apiBaseURL,
  timeout: 10000
});

service.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

service.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default service;
