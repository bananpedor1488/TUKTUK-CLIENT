import React, { useState } from 'react';
import { FiArrowLeft, FiVolume2, FiVolumeX, FiBell, FiBellOff, FiEye, FiEyeOff, FiSave } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import styles from './MobileSettingsPage.module.css';

const MobileSettingsPage = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true,
    fontSize: 'medium',
    language: 'ru',
    autoSave: true,
    showOnlineStatus: true,
    messagePreview: true,
    darkMode: true,
    vibrationEnabled: true,
    autoDownload: false,
    animationType: 'slideFromRight'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Здесь будет логика сохранения настроек
    console.log('Settings saved:', settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.settingsPage}>
      {/* Заголовок */}
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={onClose}>
          <FiArrowLeft size={24} />
        </button>
        <h1 className={styles.pageTitle}>Настройки</h1>
        <button className={styles.saveButton} onClick={handleSave}>
          <FiSave size={20} />
        </button>
      </div>

      {/* Содержимое */}
      <div className={styles.pageContent}>
        {/* Внешний вид */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Внешний вид</h2>
          
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

        {/* Звук и вибрация */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Звук и вибрация</h2>
          
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
                <div className={styles.toggleThumb}>
                  {settings.soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                </div>
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
                <div className={styles.toggleThumb}>
                  📳
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Уведомления */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Уведомления</h2>
          
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
                <div className={styles.toggleThumb}>
                  {settings.notificationsEnabled ? <FiBell size={16} /> : <FiBellOff size={16} />}
                </div>
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
                <div className={styles.toggleThumb}>
                  {settings.showOnlineStatus ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                </div>
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
                <div className={styles.toggleThumb}>
                  {settings.messagePreview ? '👁️' : '🚫'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Дополнительно */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>Дополнительно</h2>
          
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
                <div className={styles.toggleThumb}>
                  {settings.autoSave ? '💾' : '❌'}
                </div>
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
                <div className={styles.toggleThumb}>
                  {settings.autoDownload ? '📥' : '📤'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Информация */}
        <div className={styles.settingsSection}>
          <h2 className={styles.sectionTitle}>О приложении</h2>
          
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
      </div>
    </div>
  );
};

export default MobileSettingsPage;
