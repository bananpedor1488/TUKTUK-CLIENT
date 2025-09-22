import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiUsers, FiCircle, FiZap } from 'react-icons/fi';
import { formatLastSeen, formatChatTime } from '../utils/timeUtils';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import SwipeableChatItem from './SwipeableChatItem';
import ChatContextMenu from './ChatContextMenu';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import useIsMobile from '../hooks/useIsMobile';
import UserProfileModal from './UserProfileModal';
import { useToast } from '../contexts/ToastContext';
import ConfirmModal from './ConfirmModal';
import styles from './ChatList.module.css';
import { getUserAvatarUrl } from '../utils/avatarUrl';

const ChatList = ({ chats, selectedChat, onChatSelect, isLoading, showAIChat, onAIChatSelect, onOpenArchive }) => {
  const { user } = useAuth();
  const { isUserOnline, getUserStatus, refreshAllUsersStatus } = useSocket();
  const isMobile = useIsMobile();
  const toast = useToast();
  const { success, error } = toast || {};
  // Локальная копия списка для оптимистичных апдейтов
  const [list, setList] = useState(chats || []);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const listRef = useRef(null);
  const touchStartYRef = useRef(null);
  const pullMaxRef = useRef(0);
  const blockClicksUntilRef = useRef(0);
  const [showArchiveTeaser, setShowArchiveTeaser] = useState(false);
  const [topPullDy, setTopPullDy] = useState(0);
  // Pull-up-to-archive per-item state (mobile)
  const itemTouchStartRef = useRef({ id: null, y: 0 });
  const [pullUpState, setPullUpState] = useState({ id: null, dy: 0 });
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });
  
  // Состояние для контекстного меню
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    chat: null
  });

  // Синхронизируем локальный список с пропсами
  useEffect(() => {
    setList(chats || []);
  }, [chats]);

  // (removed) server unread-counts usage per request

  // Обновляем статусы пользователей при загрузке чатов (с дебаунсингом)
  useEffect(() => {
    if (list && list.length > 0) {
      console.log('🔄 ChatList: Refreshing user statuses for', chats.length, 'chats');
      // Используем setTimeout для дебаунсинга
      const timeoutId = setTimeout(() => {
        refreshAllUsersStatus(list);
      }, 1000); // 1 секунда задержки
      
      return () => clearTimeout(timeoutId);
    }
  }, [list, refreshAllUsersStatus]);

  // (удалено) вспомогательные функции и эффекты для clearedUntil

  // Не скрываем тизер автоматически на scroll, чтобы он не пропадал после отпускания пальца
  
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p className={styles.loadingText}>Загрузка чатов...</p>
      </div>
    );
  }

  if (list.length === 0) {
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

  // Подтверждения действий
  const requestDeleteChat = (chat) => {
    setConfirm({
      open: true,
      title: 'Удалить чат',
      message: 'Вы уверены, что хотите удалить/покинуть этот чат? Это действие нельзя отменить.',
      onConfirm: () => handleDeleteChat(chat),
    });
  };

  const requestArchiveChat = (chat) => {
    setConfirm({
      open: true,
      title: 'Архивировать чат',
      message: 'Отправить чат в архив? Он исчезнет из списка. Вы сможете вернуть его из архива позже.',
      onConfirm: () => handleArchiveChat(chat),
    });
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
      return otherParticipant ? getUserAvatarUrl(otherParticipant) : undefined;
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
    } else if (message.type === 'image' && message.imageUrl) {
      return (
        <span className={styles.lastMessageMedia}>
          <img src={message.imageUrl} alt="thumb" className={styles.lastMessageThumb} />
          <span>Изображение</span>
        </span>
      );
    } else {
      return `📎 ${message.type}`;
    }
  };

  // Индикатор непрочитанных отключён целиком

  // Функции для обработки действий с чатами
  const handleDeleteChat = async (chat) => {
    // Оптимистично удаляем из локального списка
    setList(prev => prev.filter(c => c._id !== chat._id));
    if (selectedChat?._id === chat._id) {
      onChatSelect(null);
    }
    try {
      await axios.delete(`/chat/${chat._id}`);
      success && success('Чат удалён', 'Действие выполнено');
    } catch (e) {
      console.error('Failed to delete chat:', e);
      error && error('Не удалось удалить чат', 'Ошибка');
      // Восстанавливаем элемент при ошибке
      setList(prev => {
        const exists = prev.some(c => c._id === chat._id);
        return exists ? prev : [chat, ...prev];
      });
    }
  };

  const handleArchiveChat = async (chat) => {
    // Оптимистично убираем из списка (архив не показывается в основном списке)
    setList(prev => prev.filter(c => c._id !== chat._id));
    if (selectedChat?._id === chat._id) {
      onChatSelect(null);
    }
    try {
      await axios.put(`/chat/${chat._id}/archive`, { archived: true });
      success && success('Чат архивирован', 'Перемещён в архив');
    } catch (e) {
      console.error('Failed to archive chat:', e);
      error && error('Не удалось архивировать чат', 'Ошибка');
      // Восстановим в случае ошибки
      setList(prev => {
        const exists = prev.some(c => c._id === chat._id);
        return exists ? prev : [chat, ...prev];
      });
    }
  };

  const handleMuteChat = async (chat) => {
    try {
      await axios.put(`/chat/${chat._id}/mute`, { muted: true });
      success && success('Уведомления отключены', 'Чат заглушён');
    } catch (e) {
      console.error('Failed to mute chat:', e);
      error && error('Не удалось отключить уведомления', 'Ошибка');
    }
  };

  const handleViewProfile = (chat) => {
    if (!chat) return;
    if (chat.type === 'group') {
      // Для групп пока просто показываем первого участника
      setProfileUser(chat.participants?.[0] || null);
    } else {
      const other = chat.participants?.find(p => p && p._id !== user._id) || null;
      setProfileUser(other);
    }
    setIsProfileOpen(true);
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
      
      return (
        <OnlineStatusIndicator
          userId={otherParticipant?._id}
          isOnline={userStatus.isOnline}
          lastSeen={userStatus.lastSeen}
          showText={true}
          size="small"
        />
      );
    }
  };

  return (
    <div
      className={styles.chatList}
      ref={listRef}
      onTouchStart={(e) => {
        if (!isMobile) return;
        const el = listRef.current;
        if (!el) return;
        if (el.scrollTop <= 0 && e.touches && e.touches.length === 1) {
          touchStartYRef.current = e.touches[0].clientY;
          pullMaxRef.current = 0;
          setTopPullDy(0);
        } else {
          touchStartYRef.current = null;
          // Если стартуем жест не из верхнего края — скрываем тизер
          if (showArchiveTeaser) setShowArchiveTeaser(false);
        }
      }}
      onTouchMove={(e) => {
        if (!isMobile) return;
        if (touchStartYRef.current == null) return;
        const dy = e.touches[0].clientY - touchStartYRef.current;
        if (dy > 0) pullMaxRef.current = Math.max(pullMaxRef.current, dy);
        const TEASER_SHOW = 40;
        if (dy > TEASER_SHOW) {
          setShowArchiveTeaser(true);
          setTopPullDy(dy);
        } else {
          setShowArchiveTeaser(false);
          setTopPullDy(0);
        }
        // Свип вверх — убираем тизер
        if (dy < -10 && showArchiveTeaser) setShowArchiveTeaser(false);
      }}
      onTouchEnd={() => {
        if (!isMobile) return;
        const TEASER_SHOW = 40;
        const OPEN_TRIGGER = 110;
        if (pullMaxRef.current >= OPEN_TRIGGER) {
          setShowArchiveTeaser(false);
          setTopPullDy(0);
          blockClicksUntilRef.current = Date.now() + 350;
          onOpenArchive && onOpenArchive();
        } else {
          // Недостаточно — убираем тизер после отпускания
          setShowArchiveTeaser(false);
          setTopPullDy(0);
        }
        touchStartYRef.current = null;
        pullMaxRef.current = 0;
      }}
    >
      {isMobile && showArchiveTeaser && (
        <div
          style={{
            margin: '8px 12px 0',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.05)',
            color: 'var(--theme-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontWeight: 600,
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowArchiveTeaser(false);
            blockClicksUntilRef.current = Date.now() + 250;
            onOpenArchive && onOpenArchive();
          }}
        >
          <span role="img" aria-label="archive">🗄️</span>
          <span>{topPullDy >= 110 ? 'Отпустите — откроется архив' : 'Потяните ещё — откроется архив'}</span>
        </div>
      )}
      {/* AI Chat */}
      <div
        className={`${styles.chatItem} ${showAIChat ? styles.selected : ''}`}
        style={showArchiveTeaser ? { pointerEvents: 'none' } : undefined}
        onClick={(e) => {
          if (showArchiveTeaser) return; // не открывать ИИ, когда виден тизер
          if (Date.now() < blockClicksUntilRef.current) return; // подавить клики сразу после жеста
          onAIChatSelect && onAIChatSelect(e);
        }}
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

      {list.map((chat) => (
        <SwipeableChatItem
          key={chat._id}
          isMobile={isMobile}
          onDelete={() => requestDeleteChat(chat)}
          onArchive={() => requestArchiveChat(chat)}
          onMute={() => handleMuteChat(chat)}
          onMore={(e) => handleContextMenu(e, chat)}
        >
          <div
            className={`${styles.chatItem} ${selectedChat?._id === chat._id ? styles.selected : ''}`}
            onClick={(e) => {
              if (showArchiveTeaser) return;
              if (Date.now() < blockClicksUntilRef.current) return;
              // server: mark read (безопасно, индикаторов больше нет)
              try { axios.put(`/chat/${chat._id}/read`); } catch {}
              onChatSelect(chat);
            }}
            onContextMenu={(e) => handleContextMenu(e, chat)}
            onTouchStart={(e) => {
              if (!isMobile) return;
              if (!e.touches || e.touches.length !== 1) return;
              itemTouchStartRef.current = { id: chat._id, y: e.touches[0].clientY };
              setPullUpState({ id: null, dy: 0 });
            }}
            onTouchMove={(e) => {
              if (!isMobile) return;
              if (!e.touches || e.touches.length !== 1) return;
              const start = itemTouchStartRef.current;
              if (!start || start.id !== chat._id) return;
              const dy = e.touches[0].clientY - start.y; // up is negative
              const PREVIEW = -30;
              if (dy <= PREVIEW) {
                // show preview banner
                setPullUpState({ id: chat._id, dy });
              } else if (pullUpState.id) {
                // cancel preview if moved back down
                setPullUpState({ id: null, dy: 0 });
              }
            }}
            onTouchEnd={() => {
              if (!isMobile) return;
              const start = itemTouchStartRef.current;
              if (!start || start.id !== chat._id) return;
              const dy = pullUpState.id === chat._id ? pullUpState.dy : 0;
              const TRIGGER = -90;
              if (dy <= TRIGGER) {
                // trigger archive
                requestArchiveChat(chat);
              }
              setPullUpState({ id: null, dy: 0 });
              itemTouchStartRef.current = { id: null, y: 0 };
            }}
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
                const userStatus = getUserStatus(otherParticipant?._id);
                return (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    zIndex: 1
                  }}>
                    <OnlineStatusIndicator
                      userId={otherParticipant?._id}
                      isOnline={userStatus.isOnline}
                      lastSeen={userStatus.lastSeen}
                      showText={false}
                      size="small"
                    />
                  </div>
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
              <div className={styles.messageStatus}></div>
            </div>

            {/* Pull-up-to-archive banner */}
            {isMobile && pullUpState.id === chat._id && (
              <div
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  top: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: 'var(--theme-text-primary)',
                  fontSize: 12,
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}
              >
                {pullUpState.dy <= -90 ? 'Отпустите, чтобы архивировать' : 'Тяните вверх, чтобы архивировать'}
              </div>
            )}
          </div>
        </SwipeableChatItem>
      ))}

      {/* Контекстное меню */}
      <ChatContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        chat={contextMenu.chat}
        onClose={closeContextMenu}
        onDelete={() => requestDeleteChat(contextMenu.chat)}
        onArchive={() => requestArchiveChat(contextMenu.chat)}
        onMute={() => handleMuteChat(contextMenu.chat)}
        onViewProfile={() => handleViewProfile(contextMenu.chat)}
        onChatSettings={() => handleChatSettings(contextMenu.chat)}
      />

      {/* Профиль пользователя из меню чата */}
      <UserProfileModal
        user={profileUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isOwnProfile={false}
      />

      {/* Подтверждение действий */}
      <ConfirmModal
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onCancel={() => setConfirm(prev => ({ ...prev, open: false }))}
        onConfirm={() => {
          const fn = confirm.onConfirm;
          setConfirm(prev => ({ ...prev, open: false }));
          fn && fn();
        }}
      />
    </div>
  );
};

export default ChatList;

