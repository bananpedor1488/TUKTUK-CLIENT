import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiEye, FiBell, FiShield, FiSave } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import styles from './SettingsModalTabs.module.css';

const SettingsModalTabs = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    // Профиль
    name: user?.displayName || 'Пользователь',
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
    
    // Безопасность
    twoFactorEnabled: false,
    sessionTimeout: 30
  });

  const tabs = [
    { id: 'profile', label: 'Профиль', icon: FiUser },
    { id: 'appearance', label: 'Внешний вид', icon: FiEye },
    { id: 'notifications', label: 'Уведомления', icon: FiBell },
    { id: 'security', label: 'Безопасность', icon: FiShield }
  ];

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Обновляем данные пользователя при изменении user
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        name: user.displayName || 'Пользователь',
        email: user.email || 'user@example.com',
        avatar: user.avatar || null
      }));
    }
  }, [user]);

  // const handleThemeChange = (theme) => {
  //   handleSettingChange('theme', theme);
  //   // Применяем тему мгновенно
  //   document.documentElement.setAttribute('data-theme', theme);
  //   localStorage.setItem('tuktuk-theme', theme);
  // };

  const handleSave = async () => {
    try {
      // Обновляем данные пользователя
      if (settings.name !== user?.displayName || settings.email !== user?.email) {
        // Здесь будет API вызов для обновления профиля
        console.log('Updating user profile:', {
          displayName: settings.name,
          email: settings.email
        });
      }
      
      // Сохраняем настройки
      localStorage.setItem('userSettings', JSON.stringify(settings));
      console.log('Settings saved:', settings);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Настройки</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        {/* Табы */}
        <div className={styles.tabsContainer}>
          {tabs.map(tab => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Содержимое табов */}
        <div className={styles.tabContent}>
          {activeTab === 'profile' && (
            <div className={styles.tabPanel}>
              <h3 className={styles.panelTitle}>Профиль</h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Аватар</label>
                  <span className={styles.settingDescription}>Загрузите изображение профиля</span>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.avatarUpload}>
                    <div className={styles.avatarPreview}>
                      {settings.avatar ? (
                        <img src={settings.avatar} alt="Avatar" className={styles.avatarImage} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {settings.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <button className={styles.uploadButton}>
                      Загрузить
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Имя</label>
                  <span className={styles.settingDescription}>Ваше отображаемое имя</span>
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

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Email</label>
                  <span className={styles.settingDescription}>Ваш email адрес</span>
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

          {activeTab === 'appearance' && (
            <div className={styles.tabPanel}>
              <h3 className={styles.panelTitle}>Внешний вид</h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Тема</label>
                  <span className={styles.settingDescription}>Выберите цветовую схему</span>
                </div>
                <div className={styles.settingControl}>
                  <ThemeToggle variant="buttons" />
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Размер шрифта</label>
                  <span className={styles.settingDescription}>Настройте размер текста</span>
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
                  </select>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Анимация переходов</label>
                  <span className={styles.settingDescription}>Выберите тип анимации</span>
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

          {activeTab === 'notifications' && (
            <div className={styles.tabPanel}>
              <h3 className={styles.panelTitle}>Уведомления</h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Звуки уведомлений</label>
                  <span className={styles.settingDescription}>Включить звуки для новых сообщений</span>
                </div>
                <div className={styles.settingControl}>
                  <button
                    className={`${styles.toggleButton} ${settings.soundEnabled ? styles.active : ''}`}
                    onClick={() => handleSettingChange('soundEnabled', !settings.soundEnabled)}
                  >
                    {settings.soundEnabled ? '✓' : '✗'}
                  </button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Push-уведомления</label>
                  <span className={styles.settingDescription}>Получать уведомления о новых сообщениях</span>
                </div>
                <div className={styles.settingControl}>
                  <button
                    className={`${styles.toggleButton} ${settings.notificationsEnabled ? styles.active : ''}`}
                    onClick={() => handleSettingChange('notificationsEnabled', !settings.notificationsEnabled)}
                  >
                    {settings.notificationsEnabled ? '✓' : '✗'}
                  </button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Показывать статус онлайн</label>
                  <span className={styles.settingDescription}>Другие пользователи видят ваш статус</span>
                </div>
                <div className={styles.settingControl}>
                  <button
                    className={`${styles.toggleButton} ${settings.showOnlineStatus ? styles.active : ''}`}
                    onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
                  >
                    {settings.showOnlineStatus ? '✓' : '✗'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.tabPanel}>
              <h3 className={styles.panelTitle}>Безопасность</h3>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Двухфакторная аутентификация</label>
                  <span className={styles.settingDescription}>Дополнительная защита аккаунта</span>
                </div>
                <div className={styles.settingControl}>
                  <button
                    className={`${styles.toggleButton} ${settings.twoFactorEnabled ? styles.active : ''}`}
                    onClick={() => handleSettingChange('twoFactorEnabled', !settings.twoFactorEnabled)}
                  >
                    {settings.twoFactorEnabled ? '✓' : '✗'}
                  </button>
                </div>
              </div>

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Время сессии</label>
                  <span className={styles.settingDescription}>Автоматический выход через</span>
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

              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Сменить пароль</label>
                  <span className={styles.settingDescription}>Обновите пароль для безопасности</span>
                </div>
                <div className={styles.settingControl}>
                  <button className={styles.actionButton}>
                    Изменить пароль
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Кнопки действий */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Отмена
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            <FiSave size={16} />
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModalTabs;
