import React, { useState } from 'react';
import { FiX, FiUser, FiCalendar, FiMapPin, FiAtSign } from 'react-icons/fi';
import { useToast } from '../contexts/ToastContext';
import styles from './UserProfileModal.module.css';

const UserProfileModal = ({ user, isOpen, onClose, isOwnProfile = false }) => {
  const [isEditing, setIsEditing] = useState(false);
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
