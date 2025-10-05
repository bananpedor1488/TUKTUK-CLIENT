import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUser, FiBell, FiShield, FiLogOut, FiEdit3, FiSave, FiSettings, FiEye, FiVolume2, FiVolumeX, FiBellOff, FiEyeOff, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import axios from '../services/axiosConfig';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { updateTokens } from '../utils/tokenManager';
import styles from './MobileProfilePage.module.css';

const MobileProfilePage = ({ isOpen, onClose, user, onOpenArchive }) => {
  const [activeSection, setActiveSection] = useState(null);
  const [originalSettings, setOriginalSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Профиль
    name: user?.displayName || user?.username || 'Пользователь',
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

  const toast = useToast();
  const { success, error, warning } = toast || {};
  const { updateUser } = useAuth();

  // Обновляем настройки при изменении пользователя
  useEffect(() => {
    if (user) {
      const newSettings = {
        name: user.displayName || user.username || 'Пользователь',
        username: user.username || '',
        email: user.email || 'user@example.com',
        bio: user.bio || '',
        avatar: user.avatar || null,
        bannerImage: user.bannerImage || null,
        theme: 'dark',
        fontSize: 'medium',
        animationType: 'slideFromRight',
        soundEnabled: true,
        notificationsEnabled: true,
        showOnlineStatus: true,
        messagePreview: true,
        vibrationEnabled: true,
        twoFactorEnabled: false,
        sessionTimeout: 30,
        autoSave: true,
        autoDownload: false,
        language: 'ru'
      };
      // Подхватываем быструю реакцию из localStorage (единое значение)
      try {
        const single = localStorage.getItem('tuktuk-quick-reaction');
        if (single) {
          newSettings.quickReaction = single;
        } else {
          // миграция со старого формата, если есть
          const legacy = JSON.parse(localStorage.getItem('tuktuk-quick-reactions') || '{}');
          const chosen = legacy?.desktop || legacy?.mobile || '❤️';
          newSettings.quickReaction = chosen;
          localStorage.setItem('tuktuk-quick-reaction', chosen);
        }
      } catch (_) {
        newSettings.quickReaction = '❤️';
      }
      
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      setHasUnsavedChanges(false);
      // Keep all subsections closed by default on load/change
      setActiveSection(null);
    }
  }, [user]);

  // Banner handlers (component scope)
  const handleBannerUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      if (error) error('Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP', 'Неподдерживаемый формат');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      if (error) error('Размер файла не должен превышать 5MB', 'Файл слишком большой');
      return;
    }

    try {
      // Convert to base64 (strip header for ImgBB)
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.replace(/^data:image\/[^;]+;base64,/, ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await axios.post('/user/upload-banner', {
        base64Data: base64,
        fileName: `banner_${user?._id}_${Date.now()}.png`
      });

      if (response.data.success) {
        setSettings(prev => ({ ...prev, bannerImage: response.data.banner }));
        if (updateUser) updateUser(response.data.user);
        if (success) success('Баннер загружен успешно!', 'Загрузка завершена');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('❌ Banner upload error:', err);
      if (error) error(err.response?.data?.message || err.message || 'Ошибка при загрузке баннера', 'Ошибка загрузки');
    }
  };

  const handleBannerRemove = async () => {
    // локально убираем картинку
    setSettings(prev => ({ ...prev, bannerImage: null }));
    try {
      // сразу сохраняем на сервере
      const res = await axios.put('/user/profile', { bannerImage: null });
      if (res.data?.success) {
        // обновляем пользователя в контексте
        if (updateUser) updateUser(res.data.user);
        // так как состояние соответствует серверу — снимаем флаг изменений
        setOriginalSettings(prev => ({ ...prev, bannerImage: null }));
        setHasUnsavedChanges(false);
        if (success) success('Баннер удалён', 'Профиль');
      } else {
        throw new Error(res.data?.message || 'Update failed');
      }
    } catch (e) {
      // откатим локально, если запрос упал
      setSettings(prev => ({ ...prev, bannerImage: originalSettings.bannerImage || null }));
      setHasUnsavedChanges(false);
      if (error) error(e?.response?.data?.message || e.message || 'Не удалось удалить баннер', 'Ошибка');
    }
  };

  // banner color removed: only image or transparent

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

    // Если меняем быструю реакцию — сохраняем сразу в localStorage
    if (key === 'quickReaction') {
      try {
        localStorage.setItem('tuktuk-quick-reaction', value);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tuktuk-quick-reaction-changed', { detail: value }));
        }
        if (success) success('Быстрая реакция сохранена', 'Настройки');
      } catch (e) {
        console.error('Failed to persist quick reaction', e);
      }
    }
  };

  const handleThemeChange = (theme) => {
    handleSettingChange('theme', theme);
    // Применяем тему мгновенно
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tuktuk-theme', theme);
  };

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

    if (settings.name && settings.name.length > 50) {
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

    const fieldsToCheck = [settings.username, settings.name, settings.bio].filter(Boolean);
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
      
      const payload = {
        displayName: settings.name,
        username: settings.username,
        bio: settings.bio,
        // Allow clearing banner image when user removed it
        ...(settings.bannerImage === null ? { bannerImage: null } : {})
      };
      
      console.log('📤 Request data:', payload);
      
      const response = await axios.put('/user/profile', payload);

      if (response.data.success) {
        console.log('✅ Profile updated successfully');
        
        // Обновляем оригинальные настройки
        setOriginalSettings({
          ...originalSettings,
          name: settings.name,
          username: settings.username,
          bio: settings.bio,
          avatar: settings.avatar
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
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      if (error) {
        const errorMessage = err.response?.data?.message || err.message || 'Ошибка при сохранении';
        error(errorMessage, 'Ошибка сохранения');
      } else {
        console.error('Toast error function not available');
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
      // Здесь можно добавить подтверждение
    }
    
    // Возвращаем к оригинальным настройкам
    setSettings(originalSettings);
    setHasUnsavedChanges(false);
  };

  const handleCopyUsername = async () => {
    try {
      const usernameToCopy = `@${settings.username}`;
      await navigator.clipboard.writeText(usernameToCopy);
      
      if (success) {
        success(`Username скопирован: ${usernameToCopy}`, 'Скопировано в буфер обмена');
      }
    } catch (err) {
      console.error('❌ Error copying username:', err);
      
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea');
      textArea.value = `@${settings.username}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (success) {
        success(`Username скопирован: @${settings.username}`, 'Скопировано в буфер обмена');
      }
    }
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
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      if (error) {
        error('Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP', 'Неподдерживаемый формат');
      }
      return;
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      if (error) {
        error('Размер файла не должен превышать 5MB', 'Файл слишком большой');
      }
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
    <div className={styles.profilePage}>
      {/* Заголовок */}
      <div className={styles.pageHeader}>
        <button className={styles.backButton} onClick={onClose}>
          <FiArrowLeft size={24} />
        </button>
        <div className={styles.pageTitleContainer}>
          <h1 className={styles.pageTitle}>Профиль</h1>
          {hasUnsavedChanges && (
            <div className={styles.unsavedIndicator}>
              <FiAlertCircle size={16} />
              <span>Несохраненные изменения</span>
            </div>
          )}
        </div>
        <div className={styles.headerActions}>
          {hasUnsavedChanges && (
            <button className={styles.cancelButton} onClick={handleCancel}>
              <FiX size={20} />
            </button>
          )}
          {onOpenArchive && (
            <button 
              className={styles.saveButton} 
              onClick={onOpenArchive}
              title="Архив чатов"
            >
              🗄️
            </button>
          )}
          <button 
            className={`${styles.saveButton} ${hasUnsavedChanges ? styles.saveButtonActive : ''} ${isSaving ? styles.saveButtonSaving : ''}`} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className={styles.spinner}></div>
            ) : hasUnsavedChanges ? (
              <FiCheck size={20} />
            ) : (
              <FiSave size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Информация о пользователе */}
      <div className={styles.userInfoSection}>
        <div className={styles.bannerContainer}>
          {settings.bannerImage ? (
            <>
              <img src={settings.bannerImage} alt="Banner" className={styles.bannerImage} />
              <div className={styles.bannerShade} />
            </>
          ) : (
            <div className={styles.bannerColorFallback} style={{ background: 'transparent' }} />
          )}
          <div className={styles.bannerOverlay}>
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
              <p 
                className={styles.userEmail}
                onClick={handleCopyUsername}
                title="Нажмите чтобы скопировать username"
              >
                @{settings.username}
              </p>
            </div>
          </div>
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
                      {/* Banner settings */}
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Баннер профиля</h3>
                          <p className={styles.settingDescription}>Картинка баннера или прозрачность</p>
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
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                id="banner-upload"
                                style={{ display: 'none' }}
                                onChange={handleBannerUpload}
                              />
                              <label htmlFor="banner-upload" className={styles.uploadButton}>Загрузить баннер</label>
                            </div>
                            {/* Цветовые контролы удалены: баннер либо картинка, либо прозрачность */}
                            {settings.bannerImage && (
                              <button type="button" className={styles.dangerButton} onClick={handleBannerRemove}>
                                Удалить баннер
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

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

                      <div className={`${styles.settingCard} ${settings.username !== originalSettings.username ? styles.settingCardChanged : ''}`}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>
                            Username
                            {settings.username !== originalSettings.username && (
                              <span className={styles.changedIndicator}>
                                <FiEdit3 size={12} />
                                Изменено
                              </span>
                            )}
                          </h3>
                          <p className={styles.settingDescription}>Ваш уникальный никнейм</p>
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

                      <div className={`${styles.settingCard} ${settings.name !== originalSettings.name ? styles.settingCardChanged : ''}`}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>
                            Имя
                            {settings.name !== originalSettings.name && (
                              <span className={styles.changedIndicator}>
                                <FiEdit3 size={12} />
                                Изменено
                              </span>
                            )}
                          </h3>
                          <p className={styles.settingDescription}>Ваше отображаемое имя</p>
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

                      <div className={`${styles.settingCard} ${settings.bio !== originalSettings.bio ? styles.settingCardChanged : ''}`}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>
                            Bio
                            {settings.bio !== originalSettings.bio && (
                              <span className={styles.changedIndicator}>
                                <FiEdit3 size={12} />
                                Изменено
                              </span>
                            )}
                          </h3>
                          <p className={styles.settingDescription}>Краткое описание о себе</p>
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

                      {/* Быстрая реакция (единое значение) */}
                      <div className={styles.settingCard}>
                        <div className={styles.settingInfo}>
                          <h3 className={styles.settingLabel}>Быстрая реакция</h3>
                          <p className={styles.settingDescription}>Эмодзи по двойному тапу/клику на сообщение</p>
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
