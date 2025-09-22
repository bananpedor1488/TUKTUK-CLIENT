import React, { useState } from 'react';
import { useThemeManager } from '../../hooks/useThemeManager';
import styles from './ThemeToggle.module.css';

const ThemeToggle = ({ variant = 'buttons' }) => {
  const { 
    currentTheme, 
    isApplying, 
    isInitialized,
    switchToDefaultTheme,
    switchToBlurTheme,
    switchToLightTheme,
    switchToMidnightTheme,
    switchToOceanTheme,
    switchToSunsetTheme,
    switchToForestTheme,
    switchToAuroraTheme,
    switchToCosmicTheme,
    switchToNeonTheme,
    switchToVintageTheme,
    switchToPickmeTheme
  } = useThemeManager();

  const [showAllThemes, setShowAllThemes] = useState(false);

  const handleThemeChange = async (themeType) => {
    const applyMetaThemeColor = () => {
      try {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        const root = document.documentElement;
        const cs = getComputedStyle(root);
        // Prefer themed card/background variables; fallback to body background
        let color = cs.getPropertyValue('--theme-card-background').trim() || cs.getPropertyValue('--theme-background').trim();
        if (!color) {
          const bodyBg = getComputedStyle(document.body).backgroundColor;
          color = bodyBg || '#0f0f12';
        }
        meta.setAttribute('content', color);
      } catch (_) {}
    };

    switch (themeType) {
      case 'default':
        await switchToDefaultTheme();
        applyMetaThemeColor();
        break;
      case 'blur':
        await switchToBlurTheme();
        applyMetaThemeColor();
        break;
      case 'light':
        await switchToLightTheme();
        applyMetaThemeColor();
        break;
      case 'midnight':
        await switchToMidnightTheme();
        applyMetaThemeColor();
        break;
      case 'ocean':
        await switchToOceanTheme();
        applyMetaThemeColor();
        break;
      case 'sunset':
        await switchToSunsetTheme();
        applyMetaThemeColor();
        break;
      case 'forest':
        await switchToForestTheme();
        applyMetaThemeColor();
        break;
      case 'aurora':
        await switchToAuroraTheme();
        applyMetaThemeColor();
        break;
      case 'cosmic':
        await switchToCosmicTheme();
        applyMetaThemeColor();
        break;
      case 'neon':
        await switchToNeonTheme();
        applyMetaThemeColor();
        break;
      case 'vintage':
        await switchToVintageTheme();
        applyMetaThemeColor();
        break;
      case 'pickme':
        await switchToPickmeTheme();
        applyMetaThemeColor();
        break;
    }
  };

  const getThemeIcon = (themeType) => {
    switch (themeType) {
      case 'default': return '🌙';
      case 'blur': return '✨';
      case 'light': return '☀️';
      case 'midnight': return '🌃';
      case 'ocean': return '🌊';
      case 'sunset': return '🌅';
      case 'forest': return '🌲';
      case 'aurora': return '🌌';
      case 'cosmic': return '🚀';
      case 'neon': return '⚡';
      case 'vintage': return '☕';
      case 'pickme': return '💖';
      default: return '🌙';
    }
  };

  const getThemeName = (themeType) => {
    switch (themeType) {
      case 'default': return 'Классическая';
      case 'blur': return 'Blur Glass';
      case 'light': return 'Light';
      case 'midnight': return 'Midnight';
      case 'ocean': return 'Ocean';
      case 'sunset': return 'Sunset';
      case 'forest': return 'Forest';
      case 'aurora': return 'Aurora';
      case 'cosmic': return 'Cosmic';
      case 'neon': return 'Neon';
      case 'vintage': return 'Vintage';
      case 'pickme': return 'Pickme';
      default: return 'Классическая';
    }
  };

  const themes = [
    { type: 'default', name: 'Классическая', icon: '🌙' },
    { type: 'blur', name: 'Blur Glass', icon: '✨' },
    { type: 'light', name: 'Light', icon: '☀️' },
    { type: 'midnight', name: 'Midnight', icon: '🌃' },
    { type: 'ocean', name: 'Ocean', icon: '🌊' },
    { type: 'sunset', name: 'Sunset', icon: '🌅' },
    { type: 'forest', name: 'Forest', icon: '🌲' },
    { type: 'aurora', name: 'Aurora', icon: '🌌' },
    { type: 'cosmic', name: 'Cosmic', icon: '🚀' },
    { type: 'neon', name: 'Neon', icon: '⚡' },
    { type: 'vintage', name: 'Vintage', icon: '☕' },
    { type: 'pickme', name: 'Pickme', icon: '💖' },
    { type: 'marble', name: 'Marble', icon: '🏛️' }
  ];

  if (!isInitialized) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Загрузка темы...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={styles.compactContainer}>
        <button 
          className={styles.compactButton}
          onClick={() => setShowAllThemes(!showAllThemes)}
          disabled={isApplying}
        >
          <span className={styles.themeIcon}>{getThemeIcon(currentTheme)}</span>
        </button>
        
        {showAllThemes && (
          <div className={styles.themeDropdown}>
            {themes.map((theme) => (
              <button
                key={theme.type}
                className={`${styles.themeOption} ${currentTheme === theme.type ? styles.active : ''}`}
                onClick={() => {
                  handleThemeChange(theme.type);
                  setShowAllThemes(false);
                }}
                disabled={isApplying}
              >
                <span className={styles.optionIcon}>{theme.icon}</span>
                <span className={styles.optionName}>{theme.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={styles.switchContainer}>
        <label className={styles.switch}>
          <input
            type="checkbox"
            checked={currentTheme === 'blur'}
            onChange={() => handleThemeChange(currentTheme === 'default' ? 'blur' : 'default')}
            disabled={isApplying}
          />
          <span className={styles.slider}></span>
        </label>
        <span className={styles.switchLabel}>
          {currentTheme === 'blur' ? 'Blur Glass' : 'Классическая'}
        </span>
      </div>
    );
  }

  // Default variant: buttons
  return (
    <div className={styles.container}>
      <div className={styles.themeGrid}>
        {themes.map((theme) => (
          <button
            key={theme.type}
            className={`${styles.themeButton} ${currentTheme === theme.type ? styles.active : ''}`}
            onClick={() => handleThemeChange(theme.type)}
            disabled={isApplying}
            title={theme.name}
          >
            <span className={styles.buttonIcon}>{theme.icon}</span>
            <span className={styles.buttonName}>{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ThemeToggle;
