import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
// import AuthCard from '../components/AuthCard';
import useIsMobile from '../hooks/useIsMobile';

const Login = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, isAuthenticated } = useAuth();
  // const { theme } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/chat');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.usernameOrEmail || !formData.password) {
      setError('Пожалуйста, заполните все поля');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(formData.usernameOrEmail, formData.password);
      
      if (result.success) {
        navigate('/chat');
      } else {
        setError(result.error || 'Ошибка при входе в систему');
      }
    } catch (error) {
      setError('Произошла ошибка при входе в систему');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTelegramLogin = () => {
    setError('');

    const width = 550;
    const height = 650;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const telegramWindow = window.open(
      '/telegram-auth.html',
      'TelegramAuth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    if (!telegramWindow || telegramWindow.closed || typeof telegramWindow.closed === 'undefined') {
      setError('Не удалось открыть окно авторизации. Пожалуйста, проверьте настройки блокировки всплывающих окон в вашем браузере.');
      return;
    }

    // Слушаем сообщения от окна авторизации
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'TELEGRAM_AUTH_SUCCESS') {
        // Сохраняем токены
        if (event.data.tokens.accessToken) {
          localStorage.setItem('accessToken', event.data.tokens.accessToken);
        }
        if (event.data.tokens.refreshToken) {
          localStorage.setItem('refreshToken', event.data.tokens.refreshToken);
        }

        // Обновляем контекст аутентификации
        window.location.reload();
      }
    };

    window.addEventListener('message', handleMessage);

    // Очищаем слушатель через 5 минут
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
    }, 300000);
  };

  return (
    <div className="login-page">
      {/* Левая панель с брендингом - скрывается на мобильных */}
      {!isMobile && (
        <div className="login-branding">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="branding-content"
        >
          <div className="branding-logo">
            <svg
              width="180"
              height="180"
              viewBox="0 0 269 275"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M220.614 15.4742C218.098 4.71887 207.34 -1.9603 196.584 0.555831L163.663 8.25758C163.989 6.08586 164.328 3.8414 164.68 1.52132C164.328 3.84215 163.989 6.08731 163.657 8.25889L15.4743 42.9253C4.71895 45.4414 -1.96021 56.2 0.555918 66.9553L45.5619 259.335C48.078 270.091 58.8367 276.77 69.592 274.254L250.702 231.884C261.457 229.368 268.136 218.609 265.62 207.854L250.015 141.151C254.72 141.776 259.944 142.569 265.759 143.452L265.76 143.453L266.639 143.586C267.061 143.65 267.486 143.715 267.914 143.78C268.257 143.832 268.602 143.884 268.949 143.936C261.788 142.852 255.479 141.871 249.944 140.845L220.614 15.4742ZM217.343 82.3256C211.16 126.53 215.939 134.541 249.944 140.845L250.015 141.151C230.992 138.622 220.454 138.843 213.622 146.992C209.674 140.07 205.239 133.536 200.372 127.425C201.41 126.975 202.368 126.436 203.257 125.8C210.935 120.307 213.432 107.573 217.301 82.3196L217.343 82.3256ZM217.347 82.2964L217.343 82.3256C221.322 82.9129 225.548 83.5524 230.039 84.2321C225.548 83.5524 221.322 82.9128 217.347 82.2964ZM217.306 82.29L217.301 82.3196C186.826 77.823 170.854 76.4019 161.359 83.5659C159.258 85.1515 157.474 87.1576 155.92 89.6441C152.55 87.7585 149.106 86.0015 145.596 84.3772C145.027 83.1231 144.356 81.9592 143.575 80.8746C135.715 69.9579 116.692 67.079 77.7732 61.1894C116.692 67.079 135.715 69.9579 146.453 61.8556C156.037 54.6247 159.021 38.6477 163.657 8.25889L163.663 8.25758C159.1 38.6589 157.223 54.804 164.237 64.5469C171.187 74.1995 186.865 77.568 217.306 82.29ZM146.168 123.196C118.021 104.889 82.3156 98.3741 46.2417 108.08L43.1316 93.0097C41.1425 83.372 47.9436 73.6366 57.6217 72.1587C88.7506 67.4171 119.081 72.1092 145.596 84.3772C149.292 92.5229 148.701 104.473 146.168 123.196ZM146.168 123.196C146.227 123.235 146.287 123.273 146.346 123.312C145.328 129.4 144.293 136.238 143.133 143.9C144.298 136.201 145.337 129.335 146.168 123.196ZM146.346 123.312C172.748 140.551 192.472 168.18 199.562 202.532L214.42 198.532C223.923 195.973 229.572 185.529 226.539 176.22C223.159 165.858 218.811 156.089 213.622 146.992C207.469 154.332 204.324 168.104 200.694 192.092C205.245 162.018 207.456 147.409 201.228 139.207C195.345 131.46 181.933 129.43 155.85 125.483C179.002 128.987 192.171 130.98 200.372 127.425C188.032 111.932 172.916 99.1538 155.92 89.6441C151.553 96.6316 149.006 107.412 146.346 123.312ZM217.306 82.29L217.347 82.2964C217.667 80.0049 218.018 77.6162 218.394 75.1255C218.017 77.6187 217.656 80.0055 217.306 82.29ZM69.4629 220.596L66.1465 204.526C83.6499 199.813 100.806 210.382 104.47 228.134L88.6246 232.4C79.8753 234.768 71.2973 229.484 69.4629 220.596ZM59.5133 172.384L52.8801 140.243C105.399 126.091 156.881 157.806 167.863 211.078L136.173 219.61C128.855 184.151 94.4615 162.963 59.5133 172.384Z"
                fill="#D0BCFF"
              />
            </svg>
          </div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="branding-text"
          >
            <h1 className="branding-title">
              <span style={{ color: '#D0BCFF' }}>T</span>UKTUK
            </h1>
            <p className="branding-description">
              Присоединяйтесь к нашему сообществу и открывайте новые возможности
            </p>
            <Link to="/about" className="branding-link">
              <span>Узнать больше о TukTuk</span>
            </Link>
          </motion.div>

        </motion.div>

        {/* Pulsating dots at bottom of left panel */}
        <div className="branding-dots">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.8 + i * 0.2 }}
              className="dot"
              style={{
                width: 12 + i * 4,
                height: 12 + i * 4,
                background: `rgba(208, 188, 255, ${0.6 - i * 0.15})`
              }}
            />
          ))}
        </div>
        </div>
      )}

      {/* Правая панель с формой */}
      <div className="login-form-container">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="login-form-wrapper"
        >
          {/* Мобильный заголовок */}
          {isMobile && (
            <div className="mobile-header">
              <div className="mobile-logo-section">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 269 275"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M220.614 15.4742C218.098 4.71887 207.34 -1.9603 196.584 0.555831L163.663 8.25758C163.989 6.08586 164.328 3.8414 164.68 1.52132C164.328 3.84215 163.989 6.08731 163.657 8.25889L15.4743 42.9253C4.71895 45.4414 -1.96021 56.2 0.555918 66.9553L45.5619 259.335C48.078 270.091 58.8367 276.77 69.592 274.254L250.702 231.884C261.457 229.368 268.136 218.609 265.62 207.854L250.015 141.151C254.72 141.776 259.944 142.569 265.759 143.452L265.76 143.453L266.639 143.586C267.061 143.65 267.486 143.715 267.914 143.78C268.257 143.832 268.602 143.884 268.949 143.936C261.788 142.852 255.479 141.871 249.944 140.845L220.614 15.4742ZM217.343 82.3256C211.16 126.53 215.939 134.541 249.944 140.845L250.015 141.151C230.992 138.622 220.454 138.843 213.622 146.992C209.674 140.07 205.239 133.536 200.372 127.425C201.41 126.975 202.368 126.436 203.257 125.8C210.935 120.307 213.432 107.573 217.301 82.3196L217.343 82.3256ZM217.347 82.2964L217.343 82.3256C221.322 82.9129 225.548 83.5524 230.039 84.2321C225.548 83.5524 221.322 82.9128 217.347 82.2964ZM217.306 82.29L217.301 82.3196C186.826 77.823 170.854 76.4019 161.359 83.5659C159.258 85.1515 157.474 87.1576 155.92 89.6441C152.55 87.7585 149.106 86.0015 145.596 84.3772C145.027 83.1231 144.356 81.9592 143.575 80.8746C135.715 69.9579 116.692 67.079 77.7732 61.1894C116.692 67.079 135.715 69.9579 146.453 61.8556C156.037 54.6247 159.021 38.6477 163.657 8.25889L163.663 8.25758C159.1 38.6589 157.223 54.804 164.237 64.5469C171.187 74.1995 186.865 77.568 217.306 82.29ZM146.168 123.196C118.021 104.889 82.3156 98.3741 46.2417 108.08L43.1316 93.0097C41.1425 83.372 47.9436 73.6366 57.6217 72.1587C88.7506 67.4171 119.081 72.1092 145.596 84.3772C149.292 92.5229 148.701 104.473 146.168 123.196ZM146.168 123.196C146.227 123.235 146.287 123.273 146.346 123.312C145.328 129.4 144.293 136.238 143.133 143.9C144.298 136.201 145.337 129.335 146.168 123.196ZM146.346 123.312C172.748 140.551 192.472 168.18 199.562 202.532L214.42 198.532C223.923 195.973 229.572 185.529 226.539 176.22C223.159 165.858 218.811 156.089 213.622 146.992C207.469 154.332 204.324 168.104 200.694 192.092C205.245 162.018 207.456 147.409 201.228 139.207C195.345 131.46 181.933 129.43 155.85 125.483C179.002 128.987 192.171 130.98 200.372 127.425C188.032 111.932 172.916 99.1538 155.92 89.6441C151.553 96.6316 149.006 107.412 146.346 123.312ZM217.306 82.29L217.347 82.2964C217.667 80.0049 218.018 77.6162 218.394 75.1255C218.017 77.6187 217.656 80.0055 217.306 82.29ZM69.4629 220.596L66.1465 204.526C83.6499 199.813 100.806 210.382 104.47 228.134L88.6246 232.4C79.8753 234.768 71.2973 229.484 69.4629 220.596ZM59.5133 172.384L52.8801 140.243C105.399 126.091 156.881 157.806 167.863 211.078L136.173 219.61C128.855 184.151 94.4615 162.963 59.5133 172.384Z"
                    fill="#D0BCFF"
                  />
                </svg>
                <h1 className="mobile-title">
                  <span style={{ color: '#D0BCFF' }}>T</span>UKTUK
                </h1>
              </div>
              <Link to="/about" className="mobile-about-link">
                О TukTuk
              </Link>
            </div>
          )}

          <div className="login-form-card">
            <div className="form-header">
              <h2 className="form-title">Вход в аккаунт</h2>
              <p className="form-subtitle">Войдите в TukTuk для доступа к своему профилю</p>
            </div>

            {error && (
              <div className="error-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                    stroke="#f44336"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="usernameOrEmail" className="form-label">
                  Email или имя пользователя
                </label>
                <input
                  type="text"
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Введите ваш email или имя пользователя"
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Пароль
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Введите ваш пароль"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3802 15.0673 11.9762 15.0744C11.5723 15.0815 11.1702 15.0074 10.7956 14.8565C10.421 14.7056 10.0807 14.4811 9.79383 14.1962C9.50693 13.9113 9.28038 13.5728 9.12751 13.1999C8.97463 12.8271 8.89849 12.4268 8.90354 12.0239C8.90859 11.621 8.99474 11.2229 9.15672 10.8549C9.3187 10.4869 9.55309 10.1555 9.846 9.88M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5.27273 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06M9.9 4.24C10.5883 4.0789 11.2931 3.99836 12 4C18.7273 4 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12L9.9 4.24M14.12 14.12L20.84 15.19M9.9 4.24L20.84 15.19"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-actions">
                <Link to="/forgot-password" className="forgot-password-link">
                  Забыли пароль?
                </Link>
              </div>

              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner">
                    <div className="spinner"></div>
                  </div>
                ) : (
                  'Войти'
                )}
              </button>
            </form>

            <div className="form-divider">
              <span>или</span>
            </div>

            <div className="social-login">
              <button 
                type="button"
                className="social-button telegram-button"
                onClick={handleTelegramLogin}
                disabled={isLoading}
              >
                <svg width="24" height="24" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M120,0C53.73,0,0,53.73,0,120s53.73,120,120,120s120-53.73,120-120S186.27,0,120,0z M177.36,78.13l-20.52,97.21
                    c-1.55,6.99-5.61,8.71-11.36,5.42l-31.41-23.15l-15.15,14.59c-1.67,1.67-3.07,3.07-6.28,3.07l2.24-31.78l57.87-52.26
                    c2.51-2.24-0.55-3.49-3.89-1.26l-71.48,45.05l-30.78-9.61c-6.69-2.07-6.84-6.69,1.39-9.89l120.44-46.44
                    C173.26,66.55,179.35,70.1,177.36,78.13z"
                    fill="#0088cc"
                  />
                </svg>
                Войти через Telegram
              </button>
            </div>

            <div className="form-footer">
              <p>
                Ещё нет аккаунта?{' '}
                <Link to="/register" className="register-link">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
