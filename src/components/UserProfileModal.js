import React, { useState } from 'react';
import { FiX, FiEdit, FiCamera, FiUser, FiMail, FiCalendar, FiMapPin, FiPhone } from 'react-icons/fi';
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
              <button className={styles.avatarEditButton}>
                <FiCamera size={16} />
              </button>
            </div>
            <h3 className={styles.displayName}>{user?.displayName}</h3>
            <p className={styles.username}>@{user?.username}</p>
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

              <div className={styles.infoItem}>
                <FiMail className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Email</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={styles.infoInput}
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.email}</span>
                  )}
                </div>
              </div>

              <div className={styles.infoItem}>
                <FiPhone className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Телефон</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={styles.infoInput}
                      placeholder="+7 (999) 123-45-67"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.phone || 'Не указан'}</span>
                  )}
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

        {isOwnProfile && (
          <div className={styles.footer}>
            {isEditing ? (
              <div className={styles.editButtons}>
                <button onClick={handleCancel} className={styles.cancelButton}>
                  Отмена
                </button>
                <button onClick={handleSave} className={styles.saveButton}>
                  Сохранить
                </button>
              </div>
            ) : (
              <button onClick={() => setIsEditing(true)} className={styles.editButton}>
                <FiEdit size={16} />
                Редактировать профиль
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfileModal;
