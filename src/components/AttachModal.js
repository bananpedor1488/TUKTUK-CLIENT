import React from 'react';
import { FiX, FiImage, FiMapPin, FiFile, FiCamera, FiPaperclip } from 'react-icons/fi';
import styles from './AttachModal.module.css';

const AttachModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const attachOptions = [
    {
      icon: <FiImage size={24} />,
      title: 'Фото или видео',
      description: 'Выберите из галереи',
      color: '#4CAF50'
    },
    {
      icon: <FiCamera size={24} />,
      title: 'Камера',
      description: 'Сделать фото',
      color: '#FF9800'
    },
    {
      icon: <FiFile size={24} />,
      title: 'Документ',
      description: 'PDF, Word, Excel',
      color: '#2196F3'
    },
    {
      icon: <FiMapPin size={24} />,
      title: 'Местоположение',
      description: 'Отправить геолокацию',
      color: '#9C27B0'
    },
    {
      icon: <FiPaperclip size={24} />,
      title: 'Файл',
      description: 'Любой файл',
      color: '#607D8B'
    }
  ];

  const handleOptionClick = (option) => {
    console.log('Выбрано:', option.title);
    // Здесь будет логика для каждого типа файла
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
      </div>
    </div>
  );
};

export default AttachModal;
