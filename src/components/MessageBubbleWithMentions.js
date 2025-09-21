import React from 'react';
import { FiCheck } from 'react-icons/fi';
import { formatMessageTime } from '../utils/timeUtils';
import { renderMentions } from '../utils/mentionParser';
import styles from './MessageBubble.module.css';

const MessageBubble = ({ 
  message, 
  isOwn, 
  senderName, 
  senderAvatar, 
  disableAnimation = false,
  onMentionClick,
  currentUsername 
}) => {
  const formatTime = (date) => {
    return formatMessageTime(date);
  };

  const getMessageContent = () => {
    switch (message.type) {
      case 'image':
        return '📷 Изображение';
      case 'file':
        return '📎 Файл';
      case 'audio':
        return '🎵 Аудио';
      case 'video':
        return '🎥 Видео';
      case 'location':
        return '📍 Местоположение';
      case 'contact':
        return '👤 Контакт';
      case 'sticker':
        return '😀 Стикер';
      case 'gif':
        return '🎬 GIF';
      case 'system':
        return message.content;
      default:
        return message.content;
    }
  };

  const handleMentionClick = (username, isOwnMention) => {
    if (onMentionClick) {
      onMentionClick(username, isOwnMention);
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
              renderMentions(message.content, handleMentionClick, currentUsername)
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
