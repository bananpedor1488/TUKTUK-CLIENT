import axios from './axiosConfig';

const AuthService = {
  login: async (credentials) => {
    try {
      const { usernameOrEmail, password } = credentials;
      const response = await axios.post(
        '/auth/login',
        {
          username: usernameOrEmail,
          password,
        },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data && response.data.ban_info) {
        return {
          success: false,
          error: response.data.error || 'Аккаунт заблокирован',
          ban_info: response.data.ban_info,
        };
      }

      if (response.data && response.data.success) {
        return {
          success: true,
          user: response.data.user || null,
          accessToken: response.data.accessToken || null,
          refreshToken: response.data.refreshToken || null,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Неизвестная ошибка при входе',
        };
      }
    } catch (error) {
      if (error.response?.data?.ban_info) {
        return {
          success: false,
          error: error.response.data.error || 'Аккаунт заблокирован',
          ban_info: error.response.data.ban_info,
        };
      }

      return {
        success: false,
        error:
          error.response?.data?.error ||
          error.response?.data?.message ||
          'Ошибка при входе в систему',
      };
    }
  },

  register: async (userData) => {
    try {
      const { username, email, password } = userData;

      console.log('Отправляемые данные для регистрации:', {
        username,
        email,
        password: '[HIDDEN]',
      });

      const response = await axios.post('/auth/register', {
        username,
        email,
        password,
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      if (error.response) {
        console.error('Данные ответа:', error.response.data);
        console.error('Статус ответа:', error.response.status);
        console.error('Заголовки ответа:', error.response.headers);
        
        // Показываем детали ошибок валидации
        if (error.response.data.errors) {
          console.error('Детали ошибок валидации:', error.response.data.errors);
        }
      }
      throw error;
    }
  },

  registerProfile: async (profileData) => {
    try {
      const response = await axios.post(
        '/auth/register-profile',
        profileData,
        {
          withCredentials: true,
          headers: {
            'Content-Type':
              profileData instanceof FormData
                ? 'multipart/form-data'
                : 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ошибка при регистрации профиля:', error);
      if (error.response) {
        console.error('Данные ответа:', error.response.data);
      }
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      const response = await axios.get('/auth/me', {
        withCredentials: true,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      return {
        data: {
          isAuthenticated: true,
          user: response.data.user,
          hasSession: true,
        },
      };
    } catch (error) {
      console.error('Error checking auth status:', error);
      return {
        data: {
          isAuthenticated: false,
          user: null,
          hasSession: false,
          error: error.response?.data?.error || error.message,
        },
      };
    }
  },

  logout: async () => {
    try {
      const response = await axios.post(
        '/auth/logout',
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  updateAvatar: async (avatarData) => {
    try {
      const response = await axios.put('/user/avatar', {
        avatar: avatarData
      }, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Ошибка при обновлении аватарки:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await axios.post('/auth/refresh', {}, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
};

export default AuthService;


