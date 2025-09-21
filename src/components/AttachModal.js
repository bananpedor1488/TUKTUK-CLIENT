import React, { useRef } from 'react';
import { FiX, FiImage, FiMapPin, FiFile, FiCamera, FiPaperclip } from 'react-icons/fi';
import styles from './AttachModal.module.css';

const AttachModal = ({ isOpen, onClose, onFileSelect }) => {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  if (!isOpen) return null;

  const attachOptions = [
    {
      icon: <FiImage size={24} />,
      title: 'Фото или видео',
      description: 'Выберите из галереи',
      color: '#4CAF50',
      action: 'gallery'
    },
    {
      icon: <FiCamera size={24} />,
      title: 'Камера',
      description: 'Сделать фото',
      color: '#FF9800',
      action: 'camera'
    },
    {
      icon: <FiFile size={24} />,
      title: 'Документ',
      description: 'PDF, Word, Excel',
      color: '#2196F3',
      action: 'document'
    },
    {
      icon: <FiMapPin size={24} />,
      title: 'Местоположение',
      description: 'Отправить геолокацию',
      color: '#9C27B0',
      action: 'location'
    },
    {
      icon: <FiPaperclip size={24} />,
      title: 'Файл',
      description: 'Любой файл',
      color: '#607D8B',
      action: 'file'
    }
  ];

  const handleOptionClick = (option) => {
    if (option.action === 'gallery') {
      fileInputRef.current?.click();
    } else if (option.action === 'camera') {
      cameraInputRef.current?.click();
    } else {
      console.log('Выбрано:', option.title);
      // Здесь будет логика для других типов файлов
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Индикатор перетаскивания только на мобильных */}
        <div className={styles.dragIndicator}></div>
        <div className={styles.header}>
          <h3 className={styles.title}>Прикрепить файл</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        
        <div className={styles.options}>
          {attachOptions.map((option, index) => (
            <div
              key={index}
              className={styles.option}
              onClick={() => handleOptionClick(option)}
            >
              <div 
                className={styles.optionIcon}
                style={{ backgroundColor: option.color }}
              >
                {option.icon}
              </div>
              <div className={styles.optionContent}>
                <div className={styles.optionTitle}>{option.title}</div>
                <div className={styles.optionDescription}>{option.description}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Скрытые input элементы */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default AttachModal;
