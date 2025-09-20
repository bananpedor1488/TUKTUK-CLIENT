import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from '../services/axiosConfig';
import { syncWithServer } from '../utils/timeUtils';
import AuthService from '../services/AuthService';
import authManager from '../utils/authManager';

const AuthContext = createContext();

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

  // Configure axios defaults and token monitoring
  useEffect(() => {
    console.log('🔧 Setting up axios interceptors and token monitoring...');
    
    // Синхронизируем время с сервером
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
  }, []);

  // Token monitoring
  useEffect(() => {
    if (!state.isAuthenticated) return;

    console.log('🔍 Starting token monitoring...');
    
    const stopMonitoring = authManager.startTokenMonitoring(() => {
      console.log('⏰ Tokens expired, logging out...');
      dispatch({ type: 'LOGOUT' });
    });

    return stopMonitoring;
  }, [state.isAuthenticated]);

  // Online status is now handled by WebSocket (peer-to-peer)
  const updateOnlineStatus = React.useCallback(async (isOnline) => {
    console.log('📡 Online status is now handled by WebSocket peer-to-peer system');
    // No need to update database - status is managed in memory via WebSocket
  }, []);

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
      console.log('🔍 Starting authentication check...');
      
      try {
        // Проверяем, есть ли токены
        if (!authManager.isAuthenticated()) {
          console.log('❌ No tokens found - user not authenticated');
          dispatch({ type: 'LOGOUT' });
          return;
        }

        // Проверяем валидность access token
        const { accessToken } = authManager.getTokens();
        if (!accessToken || authManager.isTokenExpired(accessToken)) {
          console.log('⚠️ Access token expired, trying to refresh...');
          try {
            await authManager.refreshAccessToken();
            console.log('✅ Token refreshed successfully');
          } catch (error) {
            console.log('❌ Token refresh failed, logging out:', error.message);
            dispatch({ type: 'LOGOUT' });
            return;
          }
        }

        // Получаем данные пользователя
        try {
          const response = await AuthService.checkAuth();
          if (response.data.isAuthenticated && response.data.user) {
            console.log('✅ User authenticated:', response.data.user?.email);
            authManager.setUser(response.data.user);
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: response.data.user,
                accessToken: authManager.getTokens().accessToken
              }
            });
          } else {
            throw new Error('Not authenticated');
          }
        } catch (error) {
          console.log('❌ Auth check failed:', error.message);
          dispatch({ type: 'LOGOUT' });
        }
      } catch (error) {
        console.error('💥 Authentication check error:', error);
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
        const { user, accessToken, refreshToken } = response;
        
        // Сохраняем токены через authManager
        authManager.setTokens(accessToken, refreshToken);
        authManager.setUser(user);
        
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
      await authManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const updateAvatar = async (avatarData) => {
    try {
      const response = await AuthService.updateAvatar(avatarData);
      if (response.user) {
        dispatch({ type: 'UPDATE_USER', payload: response.user });
        return { success: true, user: response.user };
      }
      return { success: false, error: 'Failed to update avatar' };
    } catch (error) {
      console.error('Avatar update error:', error);
      return { success: false, error: error.message };
    }
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
    updateAvatar,
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

