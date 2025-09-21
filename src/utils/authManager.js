// authManager.js - Улучшенный менеджер авторизации по образцу SocialSpace

class AuthManager {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'https://tuktuk-server.onrender.com/api';
  }

  // Получение токенов из localStorage и cookies
  getTokens() {
    const accessToken = localStorage.getItem('accessToken');
    
    // Получаем refresh token из cookies
    let refreshToken = null;
    try {
      const cookies = document.cookie.split(';');
      const refreshCookie = cookies.find(cookie => 
        cookie.trim().startsWith('refreshToken=')
      );
      if (refreshCookie) {
        refreshToken = refreshCookie.split('=')[1];
      }
    } catch (error) {
      console.error('❌ Error reading refresh token from cookies:', error);
    }
    
    return {
      accessToken,
      refreshToken
    };
  }

  // Сохранение токенов в localStorage и cookies
  setTokens(accessToken, refreshToken) {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      console.log('✅ Access token saved');
    }
    if (refreshToken) {
      // Сохраняем refresh token в cookies
      document.cookie = `refreshToken=${refreshToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
      console.log('✅ Refresh token saved to cookies');
    }
  }

  // Очистка всех токенов и данных пользователя
  clearTokens() {
    console.log('🧹 Clearing all authentication data');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Очищаем refresh token из cookies
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }

  // Проверка, авторизован ли пользователь
  isAuthenticated() {
    const { accessToken, refreshToken } = this.getTokens();
    return !!(accessToken || refreshToken);
  }

  // Проверка истечения срока действия токена
  isTokenExpired(token) {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      // Добавляем буферное время 30 секунд
      return payload.exp < (currentTime + 30);
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      return true;
    }
  }

  // Получение информации из токена
  getTokenPayload(token) {
    if (!token) return null;
    
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('❌ Error decoding token payload:', error);
      return null;
    }
  }

  // Обновление access токена
  async refreshAccessToken() {
    const { refreshToken } = this.getTokens();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (this.isTokenExpired(refreshToken)) {
      throw new Error('Refresh token expired');
    }

    try {
      console.log('🔄 Refreshing access token...');
      
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Важно для cookies
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data;
      
      this.setTokens(accessToken, newRefreshToken || refreshToken);
      console.log('✅ Token refreshed successfully');
      
      return accessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      this.clearTokens();
      throw error;
    }
  }

  // Получение валидного access токена (с автоматическим обновлением)
  async getValidAccessToken() {
    let { accessToken } = this.getTokens();
    
    if (!accessToken || this.isTokenExpired(accessToken)) {
      try {
        accessToken = await this.refreshAccessToken();
      } catch (error) {
        console.error('❌ Failed to get valid access token:', error);
        throw error;
      }
    }
    
    return accessToken;
  }

  // Выход из системы
  async logout() {
    const { refreshToken } = this.getTokens();
    
    if (refreshToken) {
      try {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ refreshToken })
        });
      } catch (error) {
        console.warn('⚠️ Logout request failed:', error);
      }
    }
    
    this.clearTokens();
  }

  // Настройка автоматической проверки токенов
  startTokenMonitoring(onTokenExpired) {
    // Проверка каждые 5 минут
    const interval = setInterval(() => {
      const { refreshToken } = this.getTokens();
      
      if (!refreshToken || this.isTokenExpired(refreshToken)) {
        console.log('⏰ Refresh token expired during monitoring');
        this.clearTokens();
        if (onTokenExpired) onTokenExpired();
        clearInterval(interval);
      }
    }, 5 * 60 * 1000);

    // Проверка при возвращении в приложение
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const { refreshToken } = this.getTokens();
        
        if (!refreshToken || this.isTokenExpired(refreshToken)) {
          console.log('👁️ Tokens expired while app was in background');
          this.clearTokens();
          if (onTokenExpired) onTokenExpired();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Возвращаем функцию для очистки
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }

  // Сохранение данных пользователя
  setUser(userData) {
    localStorage.setItem('user', JSON.stringify(userData));
  }

  // Получение данных пользователя
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }
}

// Создаем единственный экземпляр
const authManager = new AuthManager();

export default authManager;
