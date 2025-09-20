import React, { useState } from 'react';
import { FiUsers, FiCircle, FiZap } from 'react-icons/fi';
import { formatLastSeen, formatChatTime } from '../utils/timeUtils';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import SwipeableChatItem from './SwipeableChatItem';
import ChatContextMenu from './ChatContextMenu';
import useIsMobile from '../hooks/useIsMobile';
import styles from './ChatList.module.css';

const ChatList = ({ chats, selectedChat, onChatSelect, isLoading, showAIChat, onAIChatSelect }) => {
  const { user } = useAuth();
  const { isUserOnline, getUserStatus } = useSocket();
  const isMobile = useIsMobile();
  
  // Состояние для контекстного меню
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    chat: null
  });
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка чатов...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>💬</div>
        <p className={styles.emptyText}>Чатов пока нет</p>
        <p className={styles.emptySubtext}>Начните новую беседу!</p>
      </div>
    );
  }

  const formatTime = (date) => {
    return formatChatTime(date);
  };

  const getChatName = (chat) => {
    if (chat.type === 'group') {
      return chat.name || 'Групповой чат';
    } else {
      // For private chats, show the other participant's name
      const otherParticipant = chat.participants?.find(p => p && p._id !== user._id);
      return otherParticipant?.displayName || otherParticipant?.username || 'Неизвестный пользователь';
    }
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'group') {
      return chat.avatar;
    } else {
      // For private chats, show the other participant's avatar
      const otherParticipant = chat.participants?.find(p => p && p._id !== user._id);
      return otherParticipant?.avatar;
    }
  };

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) {
      return 'Сообщений пока нет';
    }

    const message = chat.lastMessage;
    if (message.type === 'text') {
      return message.content.length > 50 
        ? message.content.substring(0, 50) + '...'
        : message.content;
    } else {
      return `📎 ${message.type}`;
    }
  };

  const getUnreadCount = (chat) => {
    // This would be calculated based on user's last read message
    // For now, return 0
    return 0;
  };

  // Функции для обработки действий с чатами
  const handleDeleteChat = (chat) => {
    console.log('Удаление чата:', chat);
    // Здесь будет логика удаления чата
    // onDeleteChat?.(chat);
  };

  const handleArchiveChat = (chat) => {
    console.log('Архивирование чата:', chat);
    // Здесь будет логика архивирования чата
    // onArchiveChat?.(chat);
  };

  const handleMuteChat = (chat) => {
    console.log('Отключение уведомлений для чата:', chat);
    // Здесь будет логика отключения уведомлений
    // onMuteChat?.(chat);
  };

  const handleViewProfile = (chat) => {
    console.log('Просмотр профиля чата:', chat);
    // Здесь будет логика просмотра профиля
    // onViewProfile?.(chat);
  };

  const handleChatSettings = (chat) => {
    console.log('Настройки чата:', chat);
    // Здесь будет логика настроек чата
    // onChatSettings?.(chat);
  };

  const handleContextMenu = (e, chat) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      chat: chat
    });
  };

  const closeContextMenu = () => {
    setContextMenu({
      isOpen: false,
      position: { x: 0, y: 0 },
      chat: null
    });
  };

  const getOnlineStatus = (chat) => {
    if (chat.type === 'group') {
      const onlineCount = chat.participants?.filter(p => {
        if (!p) return false;
        const userStatus = getUserStatus(p._id);
        return userStatus.isOnline;
      }).length || 0;
      return onlineCount > 0 ? (
        <span style={{ color: '#10B981', fontSize: '12px' }}>
          {onlineCount} онлайн
        </span>
      ) : null;
    } else {
      const otherParticipant = chat.participants?.find(p => p && p._id !== user._id);
      const userStatus = getUserStatus(otherParticipant?._id);
      return userStatus.isOnline ? (
        <span style={{ color: '#10B981', fontSize: '12px' }}>
          <FiCircle size={8} fill="currentColor" style={{ marginRight: '4px' }} />
          Онлайн
        </span>
      ) : (
        <span style={{ color: '#6B7280', fontSize: '12px' }}>
          Был в сети {formatLastSeen(userStatus.lastSeen)}
        </span>
      );
    }
  };

  return (
    <div className={styles.chatList}>
      {/* AI Chat */}
      <div
        className={`${styles.chatItem} ${showAIChat ? styles.selected : ''}`}
        onClick={onAIChatSelect}
      >
        {/* Левая часть - Аватарка с индикатором */}
        <div className={styles.chatAvatarContainer}>
          <div className={`${styles.chatAvatar} ${styles.aiAvatar}`}>
            <FiZap size={20} />
          </div>
          <div className={styles.onlineIndicator}></div>
        </div>

        {/* Центральная часть - Основное содержание */}
        <div className={styles.chatContent}>
          <div className={styles.chatName}>AI Ассистент</div>
          <div className={styles.lastMessage}>Google Gemini 2.0 Flash</div>
        </div>

        {/* Правая часть - Дополнительная информация */}
        <div className={styles.chatMeta}>
          <div className={styles.chatTime}>Сейчас</div>
          <div className={styles.messageStatus}>
            <span className={styles.statusIcon}>🤖</span>
          </div>
        </div>
      </div>

      {chats.map((chat, index) => (
        <SwipeableChatItem
          key={`${chat._id}-${index}`}
          isMobile={isMobile}
          onDelete={() => handleDeleteChat(chat)}
          onArchive={() => handleArchiveChat(chat)}
          onMute={() => handleMuteChat(chat)}
          onMore={(e) => handleContextMenu(e, chat)}
        >
          <div
            className={`${styles.chatItem} ${selectedChat?._id === chat._id ? styles.selected : ''}`}
            onClick={() => onChatSelect(chat)}
            onContextMenu={(e) => handleContextMenu(e, chat)}
          >
            {/* Левая часть - Аватарка с индикатором */}
            <div className={styles.chatAvatarContainer}>
              <div className={styles.chatAvatar}>
                {getChatAvatar(chat) ? (
                  <img src={getChatAvatar(chat)} alt={getChatName(chat)} />
                ) : (
                  <span>{getChatName(chat)?.charAt(0)?.toUpperCase()}</span>
                )}
              </div>
              {/* Индикатор онлайн статуса */}
              {chat.type === 'private' && (() => {
                const otherParticipant = chat.participants?.find(p => p && p._id !== user._id);
                return otherParticipant?.isOnline && (
                  <div className={styles.onlineIndicator}></div>
                );
              })()}
              {/* Групповой индикатор */}
              {chat.type === 'group' && (
                <div className={styles.groupIndicator}>
                  <FiUsers size={10} />
                </div>
              )}
            </div>

            {/* Центральная часть - Основное содержание */}
            <div className={styles.chatContent}>
              <div className={styles.chatName}>{getChatName(chat)}</div>
              <div className={styles.lastMessage}>{getLastMessagePreview(chat)}</div>
            </div>

            {/* Правая часть - Дополнительная информация */}
            <div className={styles.chatMeta}>
              <div className={styles.chatTime}>
                {chat.lastMessage ? formatTime(chat.lastMessage.createdAt) : ''}
              </div>
              <div className={styles.messageStatus}>
                {getUnreadCount(chat) > 0 && (
                  <div className={styles.unreadCounter}>
                    {getUnreadCount(chat)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </SwipeableChatItem>
      ))}

      {/* Контекстное меню */}
      <ChatContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        chat={contextMenu.chat}
        onClose={closeContextMenu}
        onDelete={() => handleDeleteChat(contextMenu.chat)}
        onArchive={() => handleArchiveChat(contextMenu.chat)}
        onMute={() => handleMuteChat(contextMenu.chat)}
        onViewProfile={() => handleViewProfile(contextMenu.chat)}
        onChatSettings={() => handleChatSettings(contextMenu.chat)}
      />
    </div>
  );
};

export default ChatList;

