import axios from 'axios';
import authManager from '../utils/authManager';

// Configure axios defaults
const apiUrl = process.env.REACT_APP_API_URL || 'https://tuktuk-server.onrender.com/api';
axios.defaults.baseURL = apiUrl;
axios.defaults.timeout = 10000; // 10 секунд таймаут
axios.defaults.withCredentials = true;

// Add request interceptor to include access token
axios.interceptors.request.use(
  async (config) => {
    try {
      const token = await authManager.getValidAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('❌ Failed to get valid token:', error.message);
    }
    return config;
  },
  (error) => {
    console.error('🔑 Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only retry if it's a 401 error, not already retried, and not an auth request
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      
      try {
        console.log('🔄 Attempting token refresh for:', originalRequest.url);
        await authManager.refreshAccessToken();
        
        // Retry original request
        const token = await authManager.getValidAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError.message);
        authManager.clearTokens();
        
        // Redirect to login or show error
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
