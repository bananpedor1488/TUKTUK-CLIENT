import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiEye, FiBell, FiShield, FiSave, FiCheck, FiAlertCircle, FiEdit3 } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import axios from '../services/axiosConfig';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { updateTokens } from '../utils/tokenManager';
import styles from './SettingsModalTabs.module.css';
import EmojiSelect from './EmojiSelect';
import { getVersionedAvatar } from '../utils/avatarUrl';

const SettingsModalTabs = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [originalSettings, setOriginalSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Профиль
    name: user?.displayName || 'Пользователь',
    username: user?.username || '',
    email: user?.email || 'user@example.com',
    bio: user?.bio || '',
    avatar: user?.avatar || null,
    bannerImage: user?.bannerImage || null,
    
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
    sessionTimeout: 30,
    quickReaction: '❤️'
  });

  const toast = useToast();
  const { success, error, warning } = toast || {};
  const { updateUser } = useAuth();

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

  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      error('Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP', 'Неподдерживаемый формат');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      error('Размер файла не должен превышать 5MB', 'Файл слишком большой');
      return;
    }
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.replace(/^data:image\/[^;]+;base64,/, ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await axios.post('/user/upload-banner', { base64Data: base64, fileName: `banner_${user?._id}_${Date.now()}.png` });
      if (res.data?.success) {
        setSettings(prev => ({ ...prev, bannerImage: res.data.banner }));
        if (updateUser) updateUser(res.data.user);
        if (success) success('Баннер загружен', 'Профиль');
      }
    } catch (e) {
      error(e?.response?.data?.message || 'Ошибка загрузки баннера', 'Ошибка');
    }
  };

  // Обновляем данные пользователя при изменении user
  useEffect(() => {
    if (user) {
      const newSettings = {
        name: user.displayName || 'Пользователь',
        username: user.username || '',
        email: user.email || 'user@example.com',
        bio: user.bio || '',
        avatar: getVersionedAvatar(user?.avatar) || null,
        bannerImage: user.bannerImage || null,
        theme: 'dark',
        fontSize: 'medium',
        animationType: 'slideFromRight',
        soundEnabled: true,
        notificationsEnabled: true,
        showOnlineStatus: true,
        twoFactorEnabled: false,
        sessionTimeout: 30,
        quickReaction: '❤️'
      };
      // Подхватываем быструю реакцию с desktop настроек
      try {
        const saved = localStorage.getItem('tuktuk-quick-reaction');
        if (saved) newSettings.quickReaction = saved;
      } catch (_) {}

      setSettings(newSettings);
      setOriginalSettings(newSettings);
      setHasUnsavedChanges(false);
    }
  }, [user]);

  // Проверяем изменения при каждом обновлении settings
  useEffect(() => {
    const hasChanges = settings.name !== originalSettings.name ||
                      settings.username !== originalSettings.username ||
                      settings.bio !== originalSettings.bio ||
                      settings.email !== originalSettings.email ||
                      settings.avatar !== originalSettings.avatar ||
                      settings.bannerImage !== originalSettings.bannerImage;
    
    setHasUnsavedChanges(hasChanges);
  }, [settings, originalSettings]);

  const handleThemeChange = (theme) => {
    handleSettingChange('theme', theme);
    // Применяем тему мгновенно
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tuktuk-theme', theme);
  };

  // При открытии модалки подхватим быструю реакцию
  useEffect(() => {
    if (isOpen) {
      try {
        const saved = localStorage.getItem('tuktuk-quick-reaction');
        if (saved) setSettings(prev => ({ ...prev, quickReaction: saved }));
      } catch (_) {}
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!hasUnsavedChanges) {
      if (success) {
        success('Нет изменений для сохранения', 'Все актуально');
      }
      return;
    }

    // Client-side validation
    if (settings.username && settings.username.length < 3) {
      if (error) {
        error('Username должен содержать минимум 3 символа', 'Ошибка валидации');
      }
      return;
    }

    if (settings.username && !/^[a-zA-Z0-9_]+$/.test(settings.username)) {
      if (error) {
        error('Username может содержать только буквы, цифры и подчеркивания', 'Ошибка валидации');
      }
      return;
    }

    if (settings.displayName && settings.displayName.length > 50) {
      if (error) {
        error('Имя не может превышать 50 символов', 'Ошибка валидации');
      }
      return;
    }

    if (settings.bio && settings.bio.length > 160) {
      if (error) {
        error('Bio не может превышать 160 символов', 'Ошибка валидации');
      }
      return;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];

    const fieldsToCheck = [settings.username, settings.displayName, settings.bio].filter(Boolean);
    for (const field of fieldsToCheck) {
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(field)) {
          if (error) {
            error('Обнаружены недопустимые символы', 'Ошибка безопасности');
          }
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      console.log('📤 Updating user profile...');
      
      const response = await axios.put('/user/profile', {
        displayName: settings.name,
        username: settings.username,
        bio: settings.bio,
        ...(settings.bannerImage === null ? { bannerImage: null } : {})
      });

      if (response.data.success) {
        console.log('✅ Profile updated successfully');
        
        // Обновляем оригинальные настройки
        setOriginalSettings({
          ...originalSettings,
          name: settings.name,
          username: settings.username,
          bio: settings.bio,
          avatar: settings.avatar,
          bannerImage: settings.bannerImage === null ? null : getVersionedAvatar(settings.bannerImage, user?.avatarUpdatedAt || user?.updatedAt)
      });
        
        setHasUnsavedChanges(false);
        
        // Обновляем пользователя в AuthContext
        if (updateUser) {
          updateUser(response.data.user);
        }
        
        // Если получены новые токены (при смене username), сохраняем их
        if (response.data.tokens) {
          console.log('🔄 Received new tokens due to username change');
          
          // Используем новый token manager
          const tokensUpdated = updateTokens(
            response.data.tokens.accessToken,
            response.data.tokens.refreshToken
          );
          
          if (tokensUpdated) {
            if (success) {
              success('Профиль обновлен! Новые токены сохранены.', 'Сохранение завершено');
            }
          } else {
            if (error) {
              error('Ошибка при сохранении токенов', 'Ошибка безопасности');
            }
          }
        } else if (success) {
          success('Профиль обновлен успешно!', 'Сохранение завершено');
        }
        
        // Закрываем модалку через небольшую задержку
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 1000);
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('❌ Error saving settings:', err);
      if (error) {
        error(err.response?.data?.message || err.message || 'Ошибка при сохранении', 'Ошибка сохранения');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (warning) {
        warning('У вас есть несохраненные изменения. Вы уверены, что хотите отменить?', 'Несохраненные изменения');
      }
    }
    
    // Возвращаем к оригинальным настройкам
    setSettings(originalSettings);
    setHasUnsavedChanges(false);
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Проверяем тип файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      error('Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP', 'Неподдерживаемый формат');
      return;
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('Размер файла не должен превышать 5MB', 'Файл слишком большой');
      return;
    }

    try {
      console.log('📤 Uploading avatar...');

      // Конвертируем файл в base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Отправляем на сервер через новый API
      const response = await axios.post('/user/upload-avatar', {
        base64Data: base64,
        fileName: `avatar_${user?._id}_${Date.now()}.png`
      });

      if (response.data.success) {
        console.log('✅ Avatar uploaded successfully');
        
        // Обновляем локальное состояние
        setSettings(prev => ({
          ...prev,
          avatar: response.data.avatar
        }));
        
        // Обновляем пользователя в AuthContext
        if (updateUser) {
          updateUser(response.data.user);
        }
        
        if (success) {
          success('Аватарка загружена успешно!', 'Загрузка завершена');
        }
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('❌ Avatar upload error:', err);
      if (error) {
        error(err.response?.data?.message || err.message || 'Ошибка при загрузке аватарки', 'Ошибка загрузки');
      }
    }
  };


  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Заголовок */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleContainer}>
            <h2 className={styles.modalTitle}>Настройки</h2>
            {hasUnsavedChanges && (
              <div className={styles.unsavedIndicator}>
                <FiAlertCircle size={16} />
                <span>Несохраненные изменения</span>
              </div>
            )}
          </div>
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

              {/* Баннер профиля */}
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Баннер профиля</label>
                  <span className={styles.settingDescription}>Картинка баннера или цвет фона, если картинка не загружена</span>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.bannerPreview}>
                    {settings.bannerImage ? (
                      <img src={settings.bannerImage} alt="Banner" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'transparent' }} />
                    )}
                  </div>
                  <div className={styles.bannerControls}>
                    <button className={styles.uploadButton}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        style={{ display: 'none' }}
                        id="desktop-banner-upload"
                      />
                      <label htmlFor="desktop-banner-upload" style={{ cursor: 'pointer', display: 'block' }}>Загрузить баннер</label>
                    </button>
                    {/* Цветовые контролы удалены: баннер либо картинка, либо прозрачность */}
                    {settings.bannerImage && (
                      <button
                        type="button"
                        className={styles.dangerButton}
                        onClick={() => setSettings(prev => ({ ...prev, bannerImage: null }))}
                        title="Удалить изображение баннера"
                      >Удалить</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Аватар */}
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>Аватар</label>
                  <span className={styles.settingDescription}>Загрузите изображение профиля</span>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.avatarUpload}>
                    <div className={styles.avatarPreview}>
                      {settings.avatar ? (
                        <img src={getVersionedAvatar(settings.avatar, user?.avatarUpdatedAt || user?.updatedAt)} alt="Avatar" className={styles.avatarImage} />
                      ) : (
                        <div className={styles.avatarPlaceholder}>
                          {settings.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                    <button className={styles.uploadButton}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: 'none' }}
                        id="desktop-avatar-upload"
                      />
                      <label htmlFor="desktop-avatar-upload" style={{ cursor: 'pointer', display: 'block' }}>
                        Загрузить
                      </label>
                    </button>
                  </div>
                </div>
              </div>

              <div className={`${styles.settingItem} ${settings.username !== originalSettings.username ? styles.settingItemChanged : ''}`}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>
                    Username
                    {settings.username !== originalSettings.username && (
                      <span className={styles.changedIndicator}>
                        <FiEdit3 size={12} />
                        Изменено
                      </span>
                    )}
                  </label>
                  <span className={styles.settingDescription}>Ваш уникальный никнейм</span>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.inputContainer}>
                    <input
                      type="text"
                      className={`${styles.textInput} ${settings.username !== originalSettings.username ? styles.textInputChanged : ''}`}
                      value={settings.username}
                      onChange={(e) => handleSettingChange('username', e.target.value)}
                      maxLength={20}
                      placeholder="username"
                    />
                    {settings.username !== originalSettings.username && (
                      <div className={styles.inputStatus}>
                        <FiCheck size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${styles.settingItem} ${settings.name !== originalSettings.name ? styles.settingItemChanged : ''}`}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>
                    Имя
                    {settings.name !== originalSettings.name && (
                      <span className={styles.changedIndicator}>
                        <FiEdit3 size={12} />
                        Изменено
                      </span>
                    )}
                  </label>
                  <span className={styles.settingDescription}>Ваше отображаемое имя</span>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.inputContainer}>
                    <input
                      type="text"
                      className={`${styles.textInput} ${settings.name !== originalSettings.name ? styles.textInputChanged : ''}`}
                      value={settings.name}
                      onChange={(e) => handleSettingChange('name', e.target.value)}
                      maxLength={50}
                    />
                    {settings.name !== originalSettings.name && (
                      <div className={styles.inputStatus}>
                        <FiCheck size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={`${styles.settingItem} ${settings.bio !== originalSettings.bio ? styles.settingItemChanged : ''}`}>
                <div className={styles.settingInfo}>
                  <label className={styles.settingLabel}>
                    Bio
                    {settings.bio !== originalSettings.bio && (
                      <span className={styles.changedIndicator}>
                        <FiEdit3 size={12} />
                        Изменено
                      </span>
                    )}
                  </label>
                  <span className={styles.settingDescription}>Краткое описание о себе</span>
                </div>
                <div className={styles.settingControl}>
                  <div className={styles.inputContainer}>
                    <textarea
                      className={`${styles.textInput} ${settings.bio !== originalSettings.bio ? styles.textInputChanged : ''}`}
                      value={settings.bio}
                      onChange={(e) => handleSettingChange('bio', e.target.value)}
                      maxLength={160}
                      rows={3}
                      placeholder="Расскажите о себе..."
                    />
                    {settings.bio !== originalSettings.bio && (
                      <div className={styles.inputStatus}>
                        <FiCheck size={14} />
                      </div>
                    )}
                  </div>
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
                  <label className={styles.settingLabel}>Быстрая реакция</label>
                  <span className={styles.settingDescription}>Эмодзи по двойному клику/тапу на сообщение</span>
                </div>
                <div className={styles.settingControl}>
                  <EmojiSelect
                    value={settings.quickReaction}
                    onChange={(emoji) => {
                      handleSettingChange('quickReaction', emoji);
                      try {
                        localStorage.setItem('tuktuk-quick-reaction', emoji);
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('tuktuk-quick-reaction-changed', { detail: emoji }));
                        }
                        if (success) success(`Быстрая реакция: ${emoji}`, 'Настройки обновлены');
                      } catch (_) {}
                    }}
                  />
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
          <button className={styles.footerCloseButton} onClick={onClose}>
            <FiX size={16} />
            Закрыть
          </button>
          {hasUnsavedChanges && (
            <button className={styles.footerCancelButton} onClick={handleCancel}>
              <FiX size={16} />
              Отмена
            </button>
          )}
          <button 
            className={`${styles.footerSaveButton} ${hasUnsavedChanges ? styles.footerSaveButtonActive : ''} ${isSaving ? styles.footerSaveButtonSaving : ''}`} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className={styles.spinner}></div>
            ) : hasUnsavedChanges ? (
              <FiCheck size={16} />
            ) : (
              <FiSave size={16} />
            )}
            {hasUnsavedChanges ? 'Сохранить изменения' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModalTabs;
