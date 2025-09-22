import React, { useState } from 'react';
import { FiX, FiUser, FiCalendar, FiMapPin, FiAtSign, FiPhone, FiVideo } from 'react-icons/fi';
import CallService from '../services/CallService';
import axios from '../services/axiosConfig';
import CallModal from './calls/CallModal';
import { useToast } from '../contexts/ToastContext';
import styles from './UserProfileModal.module.css';

const UserProfileModal = ({ user, isOpen, onClose, isOwnProfile = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [callUI, setCallUI] = useState({ isOpen: false, call: null, isIncoming: false });
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    birthday: user?.birthday || ''
  });

  // Toast helpers (like on mobile)
  const toast = useToast();
  const { success } = toast || {};

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startCall = async (type) => {
    try {
      if (!user?._id) return;
      // Create or find private chat with this user
      const chatResp = await axios.post('/chat', { participants: [user._id], type: 'private' });
      const chatId = chatResp?.data?.chat?._id || chatResp?.data?._id;
      if (!chatId) throw new Error('Не удалось открыть чат для звонка');
      // Open outgoing UI immediately here (in case ChatWindow isn't mounted)
      setCallUI({
        isOpen: true,
        isIncoming: false,
        call: {
          _id: null,
          type,
          caller: { _id: 'me' },
          callee: { _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar },
          chat: { _id: chatId }
        }
      });
      // Initiate call
      const res = await CallService.initiate({ chatId, type });
      setCallUI(prev => prev.isOpen ? { ...prev, call: { ...prev.call, _id: res.callId } } : prev);
      if (onClose) onClose();
    } catch (e) {
      // Handle 409 by cleanup and retry once
      if (e?.response?.status === 409) {
        try {
          await CallService.cleanup();
          // retry: need chat again if previous failed before chat
          const chatResp2 = await axios.post('/chat', { participants: [user._id], type: 'private' });
          const chatId2 = chatResp2?.data?.chat?._id || chatResp2?.data?._id;
          const res2 = await CallService.initiate({ chatId: chatId2, type });
          setCallUI(prev => prev.isOpen ? { ...prev, call: { ...prev.call, _id: res2.callId } } : prev);
          if (onClose) onClose();
          return;
        } catch (e2) {
          alert(e2?.response?.data?.message || 'Не удалось начать звонок после очистки');
        }
      } else {
        const msg = e?.response?.data?.message || e.message || 'Не удалось начать звонок';
        alert(msg);
      }
      // Close local UI if still failed
      setCallUI({ isOpen: false, call: null, isIncoming: false });
    }
  };

  const handleSave = () => {
    // Здесь будет логика сохранения профиля
    console.log('Сохранение профиля:', profileData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setProfileData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      phone: user?.phone || '',
      birthday: user?.birthday || ''
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Профиль пользователя</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Аватар */}
          <div className={styles.avatarSection}>
            <div className={styles.avatarContainer}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.displayName} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {/* Removed avatar change button by request */}
            </div>
            <h3 className={styles.displayName}>{user?.displayName}</h3>
            <p
              className={styles.username}
              title="Нажмите, чтобы скопировать"
              onClick={async () => {
                if (!user?.username) return;
                const value = `@${user.username}`;
                try {
                  if (navigator.clipboard?.writeText) {
                    await navigator.clipboard.writeText(value);
                  } else {
                    throw new Error('Clipboard API not available');
                  }
                } catch (e) {
                  // Fallback
                  const ta = document.createElement('textarea');
                  ta.value = value;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                } finally {
                  if (success) success(`Скопировано: ${value}`, 'Буфер обмена');
                }
              }}
            >
              @{user?.username}
            </p>

            {/* Call actions */}
            {!isOwnProfile && (
              <div className={styles.callActions}>
                <button
                  type="button"
                  className={`${styles.callBtn} ${styles.audioBtn}`}
                  onClick={() => startCall('audio')}
                  title="Аудио-звонок"
                >
                  <FiPhone size={16} />
                  <span>Позвонить</span>
                </button>
                <button
                  type="button"
                  className={`${styles.callBtn} ${styles.videoBtn}`}
                  onClick={() => startCall('video')}
                  title="Видео-звонок"
                >
                  <FiVideo size={16} />
                  <span>Видео</span>
                </button>
              </div>
            )}
          </div>

          {/* Информация профиля */}
          <div className={styles.profileInfo}>
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}>Личная информация</h4>
              
              <div className={styles.infoItem}>
                <FiUser className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className={styles.infoInput}
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.displayName}</span>
                  )}
                </div>
              </div>

              {/* Username row under Name */}
              <div className={styles.infoItem}>
                <FiAtSign className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Юзернейм</label>
                  <span className={styles.infoValue}>@{user?.username}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <FiCalendar className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Дата рождения</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className={styles.infoInput}
                    />
                  ) : (
                    <span className={styles.infoValue}>
                      {profileData.birthday ? new Date(profileData.birthday).toLocaleDateString('ru-RU') : 'Не указана'}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.infoItem}>
                <FiMapPin className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Местоположение</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={styles.infoInput}
                      placeholder="Город, страна"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.location || 'Не указано'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}>О себе</h4>
              <div className={styles.bioContainer}>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={styles.bioInput}
                    placeholder="Расскажите о себе..."
                    rows={4}
                  />
                ) : (
                  <p className={styles.bioText}>
                    {profileData.bio || 'Пользователь пока не добавил информацию о себе.'}
                  </p>
                )}
              </div>
            </div>

            

          </div>
        </div>

        {/* Edit profile footer removed by request */}
      </div>
    </div>
  );
};

export default UserProfileModal;
