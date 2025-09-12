import React, { useEffect, useRef } from 'react';
import { FiTrash2, FiArchive, FiBellOff, FiUser, FiSettings } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import styles from './ChatContextMenu.module.css';

const ChatContextMenu = ({ 
  isOpen, 
  position, 
  onClose, 
  onDelete, 
  onArchive, 
  onMute, 
  onViewProfile,
  onChatSettings,
  chat 
}) => {
  const menuRef = useRef(null);
  const { user } = useAuth();

  // Функции для получения правильного имени и аватара чата
  const getChatName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Групповой чат';
    } else {
      // For private chats, show the other participant's name
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.displayName || otherParticipant?.username || 'Неизвестный пользователь';
    }
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return chat.avatar;
    } else {
      // For private chats, show the other participant's avatar
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.avatar;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuStyle = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    zIndex: 1000,
  };

  return (
    <div 
      ref={menuRef}
      className={styles.contextMenu}
      style={menuStyle}
    >
      <div className={styles.menuHeader}>
        <div className={styles.chatInfo}>
          <div className={styles.chatAvatar}>
            {getChatAvatar(chat) ? (
              <img src={getChatAvatar(chat)} alt={getChatName(chat)} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getChatName(chat)?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className={styles.chatDetails}>
            <div className={styles.chatName}>
              {getChatName(chat)}
            </div>
            <div className={styles.chatType}>
              {chat?.type === 'group' ? 'Групповой чат' : 'Личный чат'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.menuDivider}></div>

      <div className={styles.menuItems}>
        <button 
          className={`${styles.menuItem} ${styles.profileItem}`}
          onClick={() => {
            onViewProfile();
            onClose();
          }}
        >
          <FiUser size={18} />
          <span>Профиль</span>
        </button>

        <button 
          className={`${styles.menuItem} ${styles.settingsItem}`}
          onClick={() => {
            onChatSettings();
            onClose();
          }}
        >
          <FiSettings size={18} />
          <span>Настройки чата</span>
        </button>

        <div className={styles.menuDivider}></div>

        <button 
          className={`${styles.menuItem} ${styles.muteItem}`}
          onClick={() => {
            onMute();
            onClose();
          }}
        >
          <FiBellOff size={18} />
          <span>Отключить уведомления</span>
        </button>

        <button 
          className={`${styles.menuItem} ${styles.archiveItem}`}
          onClick={() => {
            onArchive();
            onClose();
          }}
        >
          <FiArchive size={18} />
          <span>Архивировать</span>
        </button>

        <div className={styles.menuDivider}></div>

        <button 
          className={`${styles.menuItem} ${styles.deleteItem}`}
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <FiTrash2 size={18} />
          <span>Удалить чат</span>
        </button>
      </div>
    </div>
  );
};

export default ChatContextMenu;
