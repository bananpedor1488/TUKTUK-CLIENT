import React from 'react';
import { FiImage, FiPaperclip, FiMic, FiVideo, FiCheck } from 'react-icons/fi';
import { formatMessageTime } from '../utils/timeUtils';
import styles from './MessageBubble.module.css';

const MessageBubble = ({ message, isOwn, senderName, senderAvatar, disableAnimation = false }) => {
  const formatTime = (date) => {
    return formatMessageTime(date);
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return null; // Не показываем дату для сегодняшних сообщений
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return messageDate.toLocaleDateString('ru-RU', { 
        day: 'numeric',
        month: 'short',
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const shouldShowDate = (currentMessage, previousMessage) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const getMessageContent = () => {
    switch (message.type) {
      case 'text':
        return message.content;
      case 'image':
        return <><FiImage size={16} /> Изображение</>;
      case 'file':
        return <><FiPaperclip size={16} /> Файл</>;
      case 'voice':
        return <><FiMic size={16} /> Голосовое сообщение</>;
      case 'video':
        return <><FiVideo size={16} /> Видео</>;
      default:
        return message.content;
    }
  };

  return (
    <div 
      id={`message-${message._id}`}
      className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}
    >
      <div className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other} ${disableAnimation ? styles.noAnimation : ''}`}>
        {/* Аватарка */}
        <div className={styles.messageAvatar}>
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} />
          ) : (
            <span>{senderName?.charAt(0)?.toUpperCase()}</span>
          )}
        </div>

        {/* Контент сообщения */}
        <div className={styles.messageContent}>
          {/* Текст сообщения */}
          <div className={styles.messageText}>
            {message.type === 'text' ? (
              message.content
            ) : (
              <span>{getMessageContent()}</span>
            )}
          </div>
          
          {/* Время сообщения */}
          <div className={styles.messageTime}>
            {formatTime(message.createdAt)}
                {isOwn && (
                  <span className={styles.messageStatus}>
                    {message.readBy && message.readBy.length > 0 ? (
                      <span className={styles.readStatus}>
                        <FiCheck size={14} />
                        <FiCheck size={14} />
                      </span>
                    ) : (
                      <span className={styles.sentStatus}>
                        <FiCheck size={14} />
                      </span>
                    )}
                  </span>
                )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;

