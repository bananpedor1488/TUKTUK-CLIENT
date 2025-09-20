import React, { useState, useEffect } from 'react';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';
import styles from './Toast.module.css';

/**
 * Professional Toast Notification Component
 * Displays beautiful animated notifications
 */
const Toast = ({ 
  id,
  type = 'success', // 'success', 'error', 'warning', 'info'
  title,
  message,
  duration = 4000,
  onClose,
  position = 'top-right' // 'top-right', 'bottom-center'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Анимация появления
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Автоматическое закрытие
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Время анимации выхода
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck size={20} />;
      case 'error':
        return <FiX size={20} />;
      case 'warning':
        return <FiAlertCircle size={20} />;
      case 'info':
        return <FiInfo size={20} />;
      default:
        return <FiInfo size={20} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return styles.success;
      case 'error':
        return styles.error;
      case 'warning':
        return styles.warning;
      case 'info':
        return styles.info;
      default:
        return styles.info;
    }
  };

  return (
    <div 
      className={`${styles.toast} ${getTypeClass()} ${isVisible ? styles.visible : ''} ${isLeaving ? styles.leaving : ''} ${styles[position]}`}
      onClick={handleClose}
    >
      <div className={styles.toastContent}>
        <div className={styles.iconContainer}>
          {getIcon()}
        </div>
        
        <div className={styles.textContainer}>
          {title && (
            <div className={styles.title}>
              {title}
            </div>
          )}
          <div className={styles.message}>
            {message}
          </div>
        </div>
        
        <button 
          className={styles.closeButton}
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
        >
          <FiX size={16} />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{
            animationDuration: `${duration}ms`
          }}
        />
      </div>
    </div>
  );
};

export default Toast;
