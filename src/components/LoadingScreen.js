import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FiZap } from 'react-icons/fi';
import styles from './LoadingScreen.module.css';

const LoadingScreen = () => {
  const { loading, logout } = useAuth();
  const [loadingMessage, setLoadingMessage] = useState('Проверка аккаунта...');
  const [showResetButton, setShowResetButton] = useState(false);

  useEffect(() => {
    if (loading) {
      // Показываем разные сообщения во время загрузки
      const messages = [
        'Проверка аккаунта...',
        'Подключение к серверу...',
        'Проверка токенов...',
        'Загрузка данных...'
      ];
      
      let currentIndex = 0;
      const interval = setInterval(() => {
        currentIndex = (currentIndex + 1) % messages.length;
        setLoadingMessage(messages[currentIndex]);
      }, 2000);

      // Показываем кнопку сброса через 10 секунд
      const resetTimeout = setTimeout(() => {
        setShowResetButton(true);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(resetTimeout);
      };
    }
  }, [loading]);

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!loading) return null;

  return (
    <div className={styles.loadingScreen}>
      {/* Background particles */}
      <div className={styles.particles}>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
        <div className={styles.particle}></div>
      </div>
      
      <div className={styles.loadingContainer}>
        <div className={styles.loadingLogo}>
          <div className={styles.logoIcon}>
            <FiZap size={32} />
          </div>
          <h1 className={styles.logoText}>Tuktuk</h1>
        </div>
        
        <div className={styles.loadingContent}>
          <div className={styles.loadingSpinnerLarge}></div>
          <h2 className={styles.loadingTitle}>{loadingMessage}</h2>
          <p className={styles.loadingSubtitle}>Подождите, мы проверяем ваши данные...</p>
          
          {showResetButton && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#ff6b6b', marginBottom: '10px' }}>
                Загрузка занимает слишком много времени?
              </p>
              <button 
                onClick={handleReset}
                style={{
                  background: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Сбросить и начать заново
              </button>
            </div>
          )}
        </div>

        <div className={styles.loadingProgress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
