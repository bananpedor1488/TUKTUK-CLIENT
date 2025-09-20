import React, { useState, useRef } from 'react';
import { FiCamera, FiUpload, FiX, FiCheck } from 'react-icons/fi';
import axios from '../services/axiosConfig';
import styles from './AvatarUpload.module.css';

/**
 * Professional Avatar Upload Component
 * Handles avatar upload with preview and ImgBB integration
 */
const AvatarUpload = ({ 
  currentAvatar, 
  onAvatarChange, 
  userId,
  size = 'large',
  className = ''
}) => {
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  const sizeClasses = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
    xlarge: styles.xlarge
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Неподдерживаемый формат файла. Разрешены: JPEG, PNG, GIF, WebP');
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setUploadError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      console.log('📤 Uploading avatar...');

      const response = await axios.post('/user/upload-avatar', {
        base64Data: preview,
        fileName: `avatar_${userId}_${Date.now()}.png`
      });

      if (response.data.success) {
        console.log('✅ Avatar uploaded successfully');
        setUploadSuccess(true);
        
        // Call parent callback
        if (onAvatarChange) {
          onAvatarChange(response.data.avatar);
        }

        // Clear preview after successful upload
        setTimeout(() => {
          setPreview(null);
          setUploadSuccess(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 2000);

      } else {
        throw new Error(response.data.message || 'Upload failed');
      }

    } catch (error) {
      console.error('❌ Avatar upload error:', error);
      setUploadError(error.response?.data?.message || error.message || 'Ошибка загрузки аватарки');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setUploadError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`${styles.avatarUpload} ${sizeClasses[size]} ${className}`}>
      {/* Avatar Display */}
      <div className={styles.avatarContainer}>
        <div 
          className={styles.avatar}
          onClick={handleClick}
          style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Avatar preview" 
              className={styles.avatarImage}
            />
          ) : currentAvatar ? (
            <img 
              src={currentAvatar} 
              alt="Current avatar" 
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <FiCamera size={size === 'small' ? 16 : size === 'medium' ? 20 : size === 'large' ? 24 : 32} />
            </div>
          )}
          
          {/* Upload overlay */}
          {!isUploading && (
            <div className={styles.uploadOverlay}>
              <FiCamera size={20} />
              <span>Изменить</span>
            </div>
          )}
          
          {/* Loading overlay */}
          {isUploading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <span>Загрузка...</span>
            </div>
          )}
          
          {/* Success overlay */}
          {uploadSuccess && (
            <div className={styles.successOverlay}>
              <FiCheck size={20} />
              <span>Готово!</span>
            </div>
          )}
        </div>
      </div>

      {/* Upload Controls */}
      {preview && !uploadSuccess && (
        <div className={styles.uploadControls}>
          <button
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={isUploading}
          >
            <FiUpload size={16} />
            {isUploading ? 'Загрузка...' : 'Загрузить'}
          </button>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={isUploading}
          >
            <FiX size={16} />
            Отмена
          </button>
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <div className={styles.errorMessage}>
          {uploadError}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className={styles.hiddenInput}
      />
    </div>
  );
};

export default AvatarUpload;
