import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import useIsMobile from '../hooks/useIsMobile';

const ToastContext = createContext();

/**
 * Toast Provider Component
 * Manages toast notifications globally
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const isMobile = useIsMobile();

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 4000,
      position: isMobile ? 'bottom-center' : 'top-right',
      ...toast
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, [isMobile]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message, title = 'Успешно!', options = {}) => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const error = useCallback((message, title = 'Ошибка!', options = {}) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 6000, // Longer duration for errors
      ...options
    });
  }, [addToast]);

  const warning = useCallback((message, title = 'Внимание!', options = {}) => {
    return addToast({
      type: 'warning',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const info = useCallback((message, title = 'Информация', options = {}) => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      
      {/* Toast Container */}
      <div style={{ position: 'fixed', zIndex: 10000, pointerEvents: 'none' }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto', marginBottom: '10px' }}>
            <Toast
              {...toast}
              onClose={removeToast}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
