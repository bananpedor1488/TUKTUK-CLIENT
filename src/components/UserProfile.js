import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import AvatarUpload from './AvatarUpload';
import styles from './UserProfile.module.css';

const UserProfile = ({ user, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    username: user?.username || ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { updateUser } = useAuth();

  const handleAvatarChange = (newAvatarUrl) => {
    // Update user object with new avatar
    const updatedUser = { ...user, avatar: newAvatarUrl };
    updateUser(updatedUser);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.put('/user/profile', formData);
      updateUser(response.data.user);
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      username: user?.username || ''
    });
    setIsEditing(false);
    setError('');
  };

  return (
    <div className={styles.profileOverlay}>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <h2>Profile</h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.profileContent}>
          <div className={styles.avatarSection}>
            <AvatarUpload
              currentAvatar={user?.avatar}
              onAvatarChange={handleAvatarChange}
              userId={user?._id}
              size="large"
              className={styles.avatarUpload}
            />
          </div>

          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formGroup}>
              <label htmlFor="displayName" className={styles.formLabel}>
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className={styles.formInput}
                disabled={!isEditing || isLoading}
                maxLength={50}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="username" className={styles.formLabel}>
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={styles.formInput}
                disabled={!isEditing || isLoading}
                maxLength={20}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="bio" className={styles.formLabel}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className={styles.formTextarea}
                disabled={!isEditing || isLoading}
                maxLength={200}
                rows={3}
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                className={styles.formInput}
                disabled
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Status</label>
              <div className={styles.statusInfo}>
                <span className={styles.statusIndicator}>
                  {user?.isOnline ? '🟢 Online' : '🔴 Offline'}
                </span>
                <span className={styles.lastSeen}>
                  Last seen: {user?.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            <div className={styles.formActions}>
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-secondary"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;




