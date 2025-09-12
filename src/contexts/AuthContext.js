import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from '../services/axiosConfig';
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
    console.log('🔧 Настраиваем axios interceptors...');
    
    // Синхронизируем время с сервером (только если API доступен)
    try {
      syncWithServer();
      
      // Периодическая синхронизация времени (каждые 5 минут)
      const syncInterval = setInterval(() => {
        syncWithServer().catch(error => {
          console.warn('Синхронизация времени не удалась:', error);
        });
      }, 5 * 60 * 1000);
      
      return () => clearInterval(syncInterval);
    } catch (error) {
      console.warn('Не удалось синхронизировать время с сервером:', error);
    }
  }, []); // Remove dependencies to prevent infinite loop

  // Define updateOnlineStatus function before using it
  const updateOnlineStatus = React.useCallback(async (isOnline) => {
    console.log('📡 updateOnlineStatus вызвана:', isOnline, 'isAuthenticated:', state.isAuthenticated);
    
    // Проверяем, есть ли токен в localStorage
    const token = typeof window !== 'undefined' && window.localStorage && localStorage.getItem('accessToken');
    console.log('📡 Токен в localStorage:', token ? 'есть' : 'нет');
    if (token) {
      console.log('📡 Токен preview:', token.substring(0, 20) + '...');
    }
    
    if (!state.isAuthenticated || !token) {
      console.log('📡 Пользователь не авторизован или нет токена, пропускаем обновление статуса');
      return;
    }
    
    try {
      console.log('📡 Отправляем запрос на обновление статуса');
      console.log('📡 Axios defaults:', {
        baseURL: axios.defaults.baseURL,
        withCredentials: axios.defaults.withCredentials,
        timeout: axios.defaults.timeout
      });
      
      await axios.put('/user/status', { isOnline });
      dispatch({ type: 'UPDATE_USER', payload: { isOnline, lastSeen: new Date() } });
      console.log('📡 Статус обновлен успешно');
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }, [state.isAuthenticated]);

  // Handle online status based on page visibility and connection
  useEffect(() => {
    console.log('🔄 useEffect для online status, isAuthenticated:', state.isAuthenticated);
    if (!state.isAuthenticated) {
      console.log('🔄 Пользователь не авторизован, пропускаем настройку online status');
      return;
    }

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

    // Set initial online status with delay to ensure state is updated
    setTimeout(() => {
      if (state.isAuthenticated) {
        console.log('🔄 Устанавливаем начальный статус онлайн');
        updateOnlineStatus(true);
      }
    }, 100);

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
      console.log('🔍 Текущее состояние loading:', state.loading);
      
      // Проверяем localStorage сразу
      if (typeof window !== 'undefined' && window.localStorage) {
        const allKeys = Object.keys(localStorage);
        console.log('🔍 Все ключи в localStorage:', allKeys);
        const token = localStorage.getItem('accessToken');
        console.log('🔍 Токен в localStorage:', token ? 'есть' : 'нет');
        if (token) {
          console.log('🔍 Токен preview:', token.substring(0, 20) + '...');
        }
      }
      
      try {
        // Get stored access token
        const storedToken = typeof window !== 'undefined' && window.localStorage 
          ? localStorage.getItem('accessToken') 
          : null;
        console.log('📱 Токен в localStorage:', storedToken ? 'есть' : 'нет');
        
        if (!storedToken) {
          console.log('❌ Нет токена - пользователь не авторизован');
          dispatch({ type: 'LOGOUT' });
          return;
        }

        console.log('✅ Есть токен - проверяем его валидность...');
        console.log('🔍 Токен для проверки:', storedToken.substring(0, 20) + '...');
        // Есть токен - проверяем его валидность
        try {
          const response = await AuthService.checkAuth();
          console.log('✅ Ответ от checkAuth:', response.data);
          
          if (response.data.isAuthenticated && response.data.user) {
            console.log('✅ Токен действителен, пользователь авторизован:', response.data.user?.email);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.user,
                accessToken: storedToken
              }
            });
          } else {
            console.log('⚠️ Токен недействителен, пытаемся обновить...');
            throw new Error('Token invalid');
          }
        } catch (error) {
          console.log('⚠️ Токен недействителен, пытаемся обновить...', error.response?.status);
          // If token is invalid, try to refresh
          try {
            const refreshResponse = await AuthService.refreshToken();
            
            const { accessToken } = refreshResponse;
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('accessToken', accessToken);
            }
            console.log('🔄 Токен обновлен, получаем данные пользователя...');
            
            // Try to get user info again with new token
            const userResponse = await AuthService.checkAuth();
            console.log('✅ Ответ после обновления токена:', userResponse.data);
            
            if (userResponse.data.isAuthenticated && userResponse.data.user) {
              console.log('✅ Пользователь авторизован с новым токеном:', userResponse.data.user?.email);
              dispatch({
                type: 'LOGIN_SUCCESS',
                payload: {
                  user: userResponse.data.user,
                  accessToken
                }
              });
            } else {
              throw new Error('Still not authenticated after refresh');
            }
          } catch (refreshError) {
            console.log('❌ Обновление токена не удалось, выходим из системы:', refreshError.response?.status);
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.removeItem('accessToken');
            }
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch (error) {
        console.error('💥 Ошибка при проверке аутентификации:', error);
        // В случае любой ошибки - выходим из системы
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem('accessToken');
        }
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
        if (accessToken && typeof window !== 'undefined' && window.localStorage) {
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
        if (accessToken && typeof window !== 'undefined' && window.localStorage) {
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
        if (accessToken && typeof window !== 'undefined' && window.localStorage) {
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
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('accessToken');
      }
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

