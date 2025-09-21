import React, { useState } from 'react';
import { FiX, FiSend, FiImage } from 'react-icons/fi';
import styles from './PhotoPreviewModal.module.css';

const PhotoPreviewModal = ({ isOpen, onClose, file, onSend }) => {
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen || !file) return null;

  const handleSend = async () => {
    setIsUploading(true);
    try {
      await onSend(file, caption);
      setCaption('');
      onClose();
    } catch (error) {
      console.error('Error sending photo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Отправить фото</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Предварительный просмотр фото */}
          <div className={styles.imagePreview}>
            <img 
              src={URL.createObjectURL(file)} 
              alt="Preview" 
              className={styles.previewImage}
            />
          </div>

          {/* Поле для текста */}
          <div className={styles.captionContainer}>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Добавить подпись к фото..."
              className={styles.captionInput}
              rows={3}
              maxLength={500}
            />
            <div className={styles.characterCount}>
              {caption.length}/500
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.sendButton}
            onClick={handleSend}
            disabled={isUploading}
          >
            {isUploading ? (
              <div className={styles.loadingSpinner}></div>
            ) : (
              <>
                <FiSend size={16} />
                Отправить
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoPreviewModal;
