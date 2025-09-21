import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiUser, FiBell, FiShield, FiLogOut, FiEdit3, FiSave, FiSettings, FiEye, FiVolume2, FiVolumeX, FiBellOff, FiEyeOff, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import ThemeToggle from './ThemeToggle/ThemeToggle';
import axios from '../services/axiosConfig';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { updateTokens } from '../utils/tokenManager';
import styles from './MobileProfilePage.module.css';

const MobileProfilePage = ({ isOpen, onClose, user }) => {
  const [activeSection, setActiveSection] = useState('profile');
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
                      settings.avatar !== originalSettings.avatar;
    
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
      
      const requestData = {
        displayName: settings.name,
        username: settings.username,
        bio: settings.bio
      };
      
      console.log('📤 Request data:', requestData);
      
      const response = await axios.put('/user/profile', requestData);

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
