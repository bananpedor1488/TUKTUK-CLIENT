import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUser, FiBell, FiShield, FiLogOut, FiEdit3, FiSave, FiSettings, FiEye, FiVolume2, FiVolumeX, FiBellOff, FiEyeOff } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import styles from './MobileProfilePage.module.css';

const MobileProfilePage = ({ isOpen, onClose, user }) => {
  const [activeSection, setActiveSection] = useState('profile');
  const [settings, setSettings] = useState({
    // Профиль
    name: user?.displayName || user?.username || 'Пользователь',
    email: user?.email || 'user@example.com',
    avatar: user?.avatar || null,
    
    // Внешний вид
    theme: 'dark',
    fontSize: 'medium',
    animationType: 'slideFromRight',
    
    // Уведомления
    soundEnabled: true,
    notificationsEnabled: true,
    showOnlineStatus: true,
    messagePreview: true,
    vibrationEnabled: true,
    
    // Безопасность
    twoFactorEnabled: false,
    sessionTimeout: 30,
    
    // Дополнительные настройки
    autoSave: true,
    autoDownload: false,
    language: 'ru'
  });

  // Обновляем настройки при изменении пользователя
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.displayName || user.username || 'Пользователь',
        email: user.email || 'user@example.com',
        avatar: user.avatar || null
      }));
    }
  }, [user]);

  const sections = [
    { id: 'profile', label: 'Редактировать профиль', icon: FiUser },
    { id: 'appearance', label: 'Внешний вид', icon: FiEye },
    { id: 'notifications', label: 'Уведомления', icon: FiBell },
    { id: 'sound', label: 'Звук и вибрация', icon: FiVolume2 },
    { id: 'additional', label: 'Дополнительно', icon: FiSettings },
    { id: 'security', label: 'Безопасность', icon: FiShield }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleThemeChange = (theme) => {
    handleSettingChange('theme', theme);
    // Применяем тему мгновенно
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tuktuk-theme', theme);
  };

  const handleSave = () => {
    // Сохраняем настройки
    localStorage.setItem('userSettings', JSON.stringify(settings));
    console.log('Settings saved:', settings);
    onClose();
  };

  const handleLogout = () => {
    // Логика выхода
    console.log('Logout');
    onClose();
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB');
      return;
    }

    try {
      // Конвертируем файл в base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Отправляем на сервер
      const response = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ avatar: base64 })
      });

      if (response.ok) {
        const result = await response.json();
        // Обновляем локальное состояние
        setSettings(prev => ({
          ...prev,
          avatar: result.user.avatar
        }));
        console.log('Аватарка загружена успешно');
      } else {
        const error = await response.json();
        alert(error.message || 'Ошибка при загрузке аватарки');
      }
    } catch (error) {
      console.error('Ошибка при загрузке аватарки:', error);
      alert('Ошибка при загрузке аватарки');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.profilePage}>
      {/* Заголовок */}
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={onClose}>
          <FiArrowLeft size={24} />
        </button>
        <h1 className={styles.pageTitle}>Профиль</h1>
        <button className={styles.saveButton} onClick={handleSave}>
          <FiSave size={20} />
        </button>
      </div>

      {/* Информация о пользователе */}
      <div className={styles.userInfoSection}>
        <div className={styles.userAvatar}>
          {settings.avatar ? (
            <img 
              src={settings.avatar} 
              alt={settings.name} 
              className={styles.avatarImage}
            />
          ) : (
            <FiUser size={32} className={styles.avatarIcon} />
          )}
        </div>
        <div className={styles.userDetails}>
          <h2 className={styles.userName}>{settings.name}</h2>
          <p className={styles.userEmail}>{settings.email}</p>
        </div>
      </div>

      {/* Секции настроек */}
      <div className={styles.sectionsContainer}>
        {sections.map(section => {
          const IconComponent = section.icon;
          return (
            <div key={section.id} className={styles.section}>
              <button
                className={`${styles.sectionButton} ${activeSection === section.id ? styles.activeSection : ''}`}
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              >
                <IconComponent size={20} />
                <span>{section.label}</span>
                <FiEdit3 size={16} className={styles.editIcon} />
              </button>

              {activeSection === section.id && (
                <div className={styles.sectionContent}>
                  {section.id === 'profile' && (
                    <div className={styles.sectionPanel}>
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Аватар</h3>
                          <p className={styles.settingDescription}>Загрузите изображение профиля</p>
                        </div>
                        <div className={styles.settingControl}>
                          <div className={styles.avatarUpload}>
                            <div className={styles.avatarPreview}>
                              {settings.avatar ? (
                                <img src={settings.avatar} alt="Avatar" />
                              ) : (
                                <FiUser size={24} />
                              )}
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              style={{ display: 'none' }}
                              id="avatar-upload"
                            />
                            <label htmlFor="avatar-upload" className={styles.uploadButton}>
                              Загрузить
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Имя</h3>
                          <p className={styles.settingDescription}>Ваше отображаемое имя</p>
                        </div>
                        <div className={styles.settingControl}>
                          <input
                            type="text"
                            className={styles.textInput}
                            value={settings.name}
                            onChange={(e) => handleSettingChange('name', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Email</h3>
                          <p className={styles.settingDescription}>Ваш email адрес</p>
                        </div>
                        <div className={styles.settingControl}>
                          <input
                            type="email"
                            className={styles.textInput}
                            value={settings.email}
                            onChange={(e) => handleSettingChange('email', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'appearance' && (
                    <div className={styles.sectionPanel}>
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Тема</h3>
                          <p className={styles.settingDescription}>Выберите цветовую схему</p>
                        </div>
                        <div className={styles.settingControl}>
                          <ThemeToggle variant="buttons" />
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Размер шрифта</h3>
                          <p className={styles.settingDescription}>Настройте размер текста для удобства чтения</p>
                        </div>
                        <div className={styles.settingControl}>
                          <select
                            className={styles.select}
                            value={settings.fontSize}
                            onChange={(e) => handleSettingChange('fontSize', e.target.value)}
                          >
                            <option value="small">Маленький</option>
                            <option value="medium">Средний</option>
                            <option value="large">Большой</option>
                            <option value="extra-large">Очень большой</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Анимация переходов</h3>
                          <p className={styles.settingDescription}>Выберите тип анимации при переходах между чатами</p>
                        </div>
                        <div className={styles.settingControl}>
                          <div className={styles.animationButtons}>
                            <button
                              className={`${styles.animationButton} ${settings.animationType === 'slideFromRight' ? styles.active : ''}`}
                              onClick={() => handleSettingChange('animationType', 'slideFromRight')}
                              title="Сдвиг справа"
                            >
                              →
                            </button>
                            <button
                              className={`${styles.animationButton} ${settings.animationType === 'scaleIn' ? styles.active : ''}`}
                              onClick={() => handleSettingChange('animationType', 'scaleIn')}
                              title="Мягкое увеличение"
                            >
                              ⚡
                            </button>
                            <button
                              className={`${styles.animationButton} ${settings.animationType === 'fadeIn' ? styles.active : ''}`}
                              onClick={() => handleSettingChange('animationType', 'fadeIn')}
                              title="Fade-эффект"
                            >
                              ✨
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'notifications' && (
                    <div className={styles.sectionPanel}>
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Push-уведомления</h3>
                          <p className={styles.settingDescription}>Получать уведомления о новых сообщениях</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.notificationsEnabled ? styles.active : ''}`}
                            onClick={() => handleSettingChange('notificationsEnabled', !settings.notificationsEnabled)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Показывать статус онлайн</h3>
                          <p className={styles.settingDescription}>Другие пользователи видят ваш статус</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.showOnlineStatus ? styles.active : ''}`}
                            onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Превью сообщений</h3>
                          <p className={styles.settingDescription}>Показывать содержимое сообщений в уведомлениях</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.messagePreview ? styles.active : ''}`}
                            onClick={() => handleSettingChange('messagePreview', !settings.messagePreview)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'sound' && (
                    <div className={styles.sectionPanel}>
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Звуки уведомлений</h3>
                          <p className={styles.settingDescription}>Включить звуки для новых сообщений</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.soundEnabled ? styles.active : ''}`}
                            onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Вибрация</h3>
                          <p className={styles.settingDescription}>Вибрация при получении сообщений</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.vibrationEnabled ? styles.active : ''}`}
                            onClick={() => handleSettingChange('vibrationEnabled', !settings.vibrationEnabled)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'additional' && (
                    <div className={styles.sectionPanel}>
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Язык интерфейса</h3>
                          <p className={styles.settingDescription}>Выберите язык приложения</p>
                        </div>
                        <div className={styles.settingControl}>
                          <select
                            className={styles.select}
                            value={settings.language}
                            onChange={(e) => handleSettingChange('language', e.target.value)}
                          >
                            <option value="ru">Русский</option>
                            <option value="en">English</option>
                            <option value="es">Español</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Автосохранение</h3>
                          <p className={styles.settingDescription}>Автоматически сохранять черновики сообщений</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.autoSave ? styles.active : ''}`}
                            onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Автозагрузка медиа</h3>
                          <p className={styles.settingDescription}>Автоматически загружать изображения и видео</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.autoDownload ? styles.active : ''}`}
                            onClick={() => handleSettingChange('autoDownload', !settings.autoDownload)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.infoCard}>
                        <div className={styles.appInfo}>
                          <h3 className={styles.appName}>Tuktuk Messenger</h3>
                          <p className={styles.appVersion}>Версия 1.0.0</p>
                          <p className={styles.appDescription}>
                            Современный мессенджер с поддержкой темной темы, 
                            уведомлений и множества настроек персонализации.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {section.id === 'security' && (
                    <div className={styles.sectionPanel}>
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Двухфакторная аутентификация</h3>
                          <p className={styles.settingDescription}>Дополнительная защита аккаунта</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.twoFactorEnabled ? styles.active : ''}`}
                            onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Время сессии</h3>
                          <p className={styles.settingDescription}>Автоматический выход через</p>
                        </div>
                        <div className={styles.settingControl}>
                          <select
                            className={styles.select}
                            value={settings.sessionTimeout}
                            onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                          >
                            <option value={15}>15 минут</option>
                            <option value={30}>30 минут</option>
                            <option value={60}>1 час</option>
                            <option value={0}>Никогда</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Сменить пароль</h3>
                          <p className={styles.settingDescription}>Обновите пароль для безопасности</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button className={styles.actionButton}>
                            Изменить пароль
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Автосохранение</h3>
                          <p className={styles.settingDescription}>Автоматически сохранять черновики сообщений</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.autoSave ? styles.active : ''}`}
                            onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>

                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Автозагрузка медиа</h3>
                          <p className={styles.settingDescription}>Автоматически загружать изображения и видео</p>
                        </div>
                        <div className={styles.settingControl}>
                          <button
                            className={`${styles.toggleSwitch} ${settings.autoDownload ? styles.active : ''}`}
                            onClick={() => handleSettingChange('autoDownload', !settings.autoDownload)}
                          >
                            <div className={styles.toggleSlider}></div>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Кнопка выхода */}
        <div className={styles.logoutSection}>
          <button className={styles.logoutButton} onClick={handleLogout}>
            <FiLogOut size={20} />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileProfilePage;
