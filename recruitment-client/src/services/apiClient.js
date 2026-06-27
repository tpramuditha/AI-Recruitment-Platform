import axios from 'axios';

// Base URL for all API calls
const API_BASE_URL = 'https://localhost:7241/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 Unauthorized globally (optional)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid – clear storage and redirect?
      // We'll let the component handle it, but we can also logout.
      // For now, just reject so the calling code can handle it.
    }
    return Promise.reject(error);
  }
);

export default apiClient;