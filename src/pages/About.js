import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const About = () => {
  useEffect(() => {
    // Добавляем классы к html, body и root для правильного фона
    document.documentElement.classList.add('about-page-html');
    document.body.classList.add('about-page-body');
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.classList.add('about-page-root');
    }
    
    // Убираем классы при размонтировании компонента
    return () => {
      document.documentElement.classList.remove('about-page-html');
      document.body.classList.remove('about-page-body');
      if (rootElement) {
        rootElement.classList.remove('about-page-root');
      }
    };
  }, []);
  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 12H8.01M12 12H12.01M16 12H16.01M21 12C21 16.9706 16.9706 21 12 21C10.4001 21 8.88837 20.6244 7.54704 19.9565L3 21L4.04348 16.453C3.37556 15.1116 3 13.5999 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Мгновенное общение",
      description: "Быстрые сообщения с доставкой в реальном времени"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2573 9.77251 19.9887C9.5799 19.7201 9.31074 19.5166 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.01062 9.77251C4.27925 9.5799 4.48278 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Анонимность",
      description: "Полная приватность и защита личных данных"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Безопасность",
      description: "End-to-end шифрование и защита от перехвата"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M13 2L3 14H12L11 22L21 10H12L13 2Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Скорость",
      description: "Молниеносная работа с оптимизированными алгоритмами"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.48 2 2 6.48 2 12S6.48 22 12 22 22 17.52 22 12 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Адаптивность",
      description: "Работает на всех устройствах и платформах"
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"
            stroke="#D0BCFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      title: "Современность",
      description: "Красивый дизайн и интуитивный интерфейс"
    }
  ];

  return (
    <div className="about-page">
      <div className="about-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="about-content"
        >
          {/* Header */}
          <div className="about-header">
            <div className="about-logo">
              <svg
                width="80"
                height="80"
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
            <h1 className="about-title">
              <span style={{ color: '#D0BCFF' }}>T</span>UKTUK
            </h1>
            <p className="about-subtitle">
              Современная платформа для безопасного и анонимного общения
            </p>
          </div>

          {/* Features */}
          <div className="about-features">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="feature-card"
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="security-section"
          >
            <div className="security-card">
              <div className="security-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22S2 18 2 12V5L12 2L22 5V12C22 18 12 22 12 22Z"
                    stroke="#D0BCFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="#4CAF50"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="security-content">
                <h2 className="security-title">Максимальная безопасность</h2>
                <p className="security-description">
                  TukTuk использует передовые технологии шифрования для защиты ваших данных. 
                  Все сообщения зашифрованы end-to-end, а ваша личность остается полностью анонимной.
                </p>
                <div className="security-features">
                  <div className="security-feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="#D0BCFF" strokeWidth="2"/>
                      <circle cx="12" cy="16" r="1" fill="#D0BCFF"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#D0BCFF" strokeWidth="2"/>
                    </svg>
                    End-to-end шифрование AES-256
                  </div>
                  <div className="security-feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#D0BCFF" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="#D0BCFF" strokeWidth="2"/>
                    </svg>
                    Полная анонимность пользователей
                  </div>
                  <div className="security-feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="#D0BCFF" strokeWidth="2"/>
                    </svg>
                    Отсутствие логирования сообщений
                  </div>
                  <div className="security-feature">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#D0BCFF" strokeWidth="2"/>
                    </svg>
                    Мгновенное самоуничтожение сообщений
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Actions */}
          <div className="about-actions">
            <Link to="/login" className="about-button primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Начать общение
            </Link>
            <Link to="/register" className="about-button secondary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Создать аккаунт
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;