import axios from 'axios';

// Configure axios defaults
const apiUrl = process.env.REACT_APP_API_URL || 'https://tuktuk-server.onrender.com/api';
axios.defaults.baseURL = apiUrl;
axios.defaults.timeout = 10000; // 10 секунд таймаут
axios.defaults.withCredentials = true;

// Add request interceptor to include access token
axios.interceptors.request.use(
  (config) => {
    // Проверяем, что мы в браузере
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('accessToken');
      console.log('🔑 Request interceptor:', {
        url: config.url,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        method: config.method
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('🔑 Добавлен заголовок Authorization для:', config.url);
      } else {
        console.log('🔑 Нет токена для запроса:', config.url);
      }
    } else {
      console.log('🔑 Не в браузере или нет localStorage');
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
    
    console.log('🚨 Ошибка запроса:', {
      status: error.response?.status,
      url: originalRequest.url,
      method: originalRequest.method,
      hasRetry: originalRequest._retry,
      errorMessage: error.message
    });
    
    // Only retry if it's a 401 error, not already retried, and not a refresh request
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url?.includes('/auth/refresh') &&
        !originalRequest.url?.includes('/auth/login') &&
        !originalRequest.url?.includes('/auth/register')) {
      originalRequest._retry = true;
      
      try {
        console.log('🔄 Пытаемся обновить токен...');
        const response = await axios.post('/auth/refresh', {}, {
          withCredentials: true
        });
        console.log('🔄 Ответ от refresh:', response);
        
        const { accessToken } = response.data;
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('accessToken', accessToken);
          console.log('🔄 Новый токен сохранен в localStorage');
        }
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log('🔄 Повторяем оригинальный запрос с новым токеном');
        return axios(originalRequest);
      } catch (refreshError) {
        console.log('❌ Refresh не удался, перенаправляем на логин:', refreshError.response?.status);
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('accessToken');
        }
        // Можно добавить перенаправление на страницу логина здесь
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default axios;
