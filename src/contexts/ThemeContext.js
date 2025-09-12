import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedTheme = localStorage.getItem('tuktuk-theme');
      return savedTheme || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('tuktuk-theme', theme);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      switch (prevTheme) {
        case 'light':
          return 'dark';
        case 'dark':
          return 'blur';
        case 'blur':
          return 'light';
        default:
          return 'dark';
      }
    });
  };

  const setThemeDirectly = (newTheme) => {
    if (['light', 'dark', 'blur'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    setTheme: setThemeDirectly,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isBlur: theme === 'blur'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

