import React, { useState, useEffect } from 'react';
import { FiX, FiSun, FiMoon, FiVolume2, FiVolumeX, FiBell, FiBellOff, FiEye, FiEyeOff } from 'react-icons/fi';
import styles from './SettingsModal.module.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    theme: 'dark',
    soundEnabled: true,
    notificationsEnabled: true,
    fontSize: 'medium',
    language: 'ru',
    autoSave: true,
    showOnlineStatus: true,
    messagePreview: true,
    animationType: 'slideFromRight',
    quickReaction: '❤️'
  });

  // Load quick reaction from localStorage on open
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('tuktuk-quick-reaction');
        if (saved) setSettings(prev => ({ ...prev, quickReaction: saved }));
      } catch (_) {}
    }
  }, [isOpen]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));

    if (key === 'quickReaction') {
      try { localStorage.setItem('tuktuk-quick-reaction', value); } catch (_) {}
    }
  };

  const handleSave = () => {
    // Здесь будет логика сохранения настроек
    console.log('Settings saved:', settings);
    onClose();
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

        {/* Содержимое */}
        <div className={styles.modalBody}>
          {/* Внешний вид */}
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Внешний вид</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Тема</label>
                <span className={styles.settingDescription}>Выберите светлую или темную тему</span>
              </div>
              <div className={styles.settingControl}>
                <button
                  className={`${styles.themeButton} ${settings.theme === 'light' ? styles.active : ''}`}
                  onClick={() => handleSettingChange('theme', 'light')}
                >
                  <FiSun size={16} />
                  Светлая
                </button>
                <button
                  className={`${styles.themeButton} ${settings.theme === 'dark' ? styles.active : ''}`}
                  onClick={() => handleSettingChange('theme', 'dark')}
                >
                  <FiMoon size={16} />
                  Темная
                </button>
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
                <span className={styles.settingDescription}>Выберите тип анимации при переходах между чатами</span>
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

          {/* Звук */}
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Звук</h3>
            
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
                  {settings.soundEnabled ? <FiVolume2 size={16} /> : <FiVolumeX size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Уведомления */}
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Уведомления</h3>
            
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
                  {settings.notificationsEnabled ? <FiBell size={16} /> : <FiBellOff size={16} />}
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
                  {settings.showOnlineStatus ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Дополнительно */}
          <div className={styles.settingsSection}>
            <h3 className={styles.sectionTitle}>Дополнительно</h3>
            
            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Быстрая реакция</label>
                <span className={styles.settingDescription}>Эмодзи по двойному клику/тапу на сообщение</span>
              </div>
              <div className={styles.settingControl}>
                <select
                  className={styles.select}
                  value={settings.quickReaction}
                  onChange={(e) => handleSettingChange('quickReaction', e.target.value)}
                >
                  {['❤️','👍','😂','🔥','👏','💯','😮','😢','😎','🙏','🤯'].map(em => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Язык интерфейса</label>
                <span className={styles.settingDescription}>Выберите язык приложения</span>
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
                </select>
              </div>
            </div>

            <div className={styles.settingItem}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Автосохранение</label>
                <span className={styles.settingDescription}>Автоматически сохранять черновики</span>
              </div>
              <div className={styles.settingControl}>
                <button
                  className={`${styles.toggleButton} ${settings.autoSave ? styles.active : ''}`}
                  onClick={() => handleSettingChange('autoSave', !settings.autoSave)}
                >
                  {settings.autoSave ? '✓' : '✗'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={handleCancel}>
            Отмена
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
