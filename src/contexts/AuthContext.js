import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import { syncWithServer } from '../utils/timeUtils';
import AuthService from '../services/AuthService';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  loading: true, // Начинаем с true, чтобы показать экран загрузки
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configure axios defaults
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    console.log('🔧 API URL configured:', apiUrl);
    axios.defaults.baseURL = apiUrl;
    
    // Синхронизируем время с сервером
    syncWithServer();
    
    // Периодическая синхронизация времени (каждые 5 минут)
    const syncInterval = setInterval(() => {
      syncWithServer();
    }, 5 * 60 * 1000);
    
    // Add request interceptor to include access token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Only retry if it's a 401 error, not already retried, and not a refresh request
        if (error.response?.status === 401 && 
            !originalRequest._retry && 
            !originalRequest.url?.includes('/auth/refresh') &&
            !originalRequest.url?.includes('/auth/login') &&
            !originalRequest.url?.includes('/auth/register')) {
          originalRequest._retry = true;
          
          try {
            const response = await AuthService.refreshToken();
            
            const { accessToken } = response;
            localStorage.setItem('accessToken', accessToken);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user: state.user, accessToken } });
            
            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            console.log('Refresh failed, logging out user');
            localStorage.removeItem('accessToken');
            dispatch({ type: 'LOGOUT' });
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
      clearInterval(syncInterval);
    };
  }, [state.user]); // Add state.user dependency

  // Define updateOnlineStatus function before using it
  const updateOnlineStatus = React.useCallback(async (isOnline) => {
    if (!state.isAuthenticated) return;
    
    try {
      await axios.put('/user/status', { isOnline });
      dispatch({ type: 'UPDATE_USER', payload: { isOnline, lastSeen: new Date() } });
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }, [state.isAuthenticated]);

  // Handle online status based on page visibility and connection
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateOnlineStatus(false);
      } else {
        updateOnlineStatus(true);
      }
    };

    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };

    const handleOnline = () => {
      updateOnlineStatus(true);
    };

    const handleOffline = () => {
      updateOnlineStatus(false);
    };

    // Set initial online status
    updateOnlineStatus(true);

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      // Set offline status when component unmounts
      updateOnlineStatus(false);
    };
  }, [state.isAuthenticated, updateOnlineStatus]);

  // Check if user is already authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Начинаем проверку аутентификации...');
      
      // Временное решение: очищаем localStorage при первой загрузке
      // Это поможет избежать проблем с поврежденными токенами
      // ВРЕМЕННО ОТКЛЮЧЕНО - вызывает проблемы с загрузкой данных
      /*
      const isFirstLoad = !localStorage.getItem('appLoaded');
      if (isFirstLoad) {
        console.log('🔄 Первая загрузка - очищаем localStorage');
        localStorage.removeItem('accessToken');
        localStorage.setItem('appLoaded', 'true');
        dispatch({ type: 'LOGOUT' });
        return;
      }
      */
      
      try {
        // Get stored access token
        const storedToken = localStorage.getItem('accessToken');
        console.log('📱 Токен в localStorage:', storedToken ? 'есть' : 'нет');
        
        if (!storedToken) {
          console.log('❌ Нет токена - пользователь не авторизован');
          dispatch({ type: 'LOGOUT' });
          return;
        }

        console.log('✅ Есть токен - проверяем его валидность...');
        // Есть токен - проверяем его валидность
        try {
          const response = await AuthService.checkAuth();
          console.log('✅ Токен действителен, пользователь авторизован:', response.data.user?.email);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              accessToken: storedToken
            }
          });
        } catch (error) {
          console.log('⚠️ Токен недействителен, пытаемся обновить...', error.response?.status);
          // If token is invalid, try to refresh
          try {
            const refreshResponse = await AuthService.refreshToken();
            
            const { accessToken } = refreshResponse;
            localStorage.setItem('accessToken', accessToken);
            console.log('🔄 Токен обновлен, получаем данные пользователя...');
            
            // Try to get user info again with new token
            const userResponse = await AuthService.checkAuth();
            console.log('✅ Пользователь авторизован с новым токеном:', userResponse.data.user?.email);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: userResponse.data.user,
                accessToken
              }
            });
          } catch (refreshError) {
            console.log('❌ Обновление токена не удалось, выходим из системы:', refreshError.response?.status);
            localStorage.removeItem('accessToken');
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('💥 Ошибка при проверке аутентификации:', error);
        // В случае любой ошибки - выходим из системы
        localStorage.removeItem('accessToken');
        dispatch({ type: 'LOGOUT' });
      }
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await AuthService.login({
        usernameOrEmail: email,
        password
      });

      if (response.success) {
        const { user, accessToken } = response;
        
        // Store access token in localStorage
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken }
        });

        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await AuthService.register(userData);

      if (response.success) {
        const { user, accessToken } = response;
        
        // Store access token in localStorage
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken }
        });

        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const registerProfile = async (profileData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await AuthService.registerProfile(profileData);

      if (response.success) {
        const { user, accessToken } = response;
        
        // Store access token in localStorage
        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
        }
        
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, accessToken }
        });

        return { success: true };
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: response.error });
        return { success: false, error: response.error };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile registration failed';
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Set offline status before logout
      await updateOnlineStatus(false);
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = React.useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    login,
    register,
    registerProfile,
    logout,
    updateUser,
    clearError,
    updateOnlineStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

