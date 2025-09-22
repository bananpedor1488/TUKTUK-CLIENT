import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch, FiSend, FiAlertCircle, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { formatLastSeen } from '../utils/timeUtils';
import MessageBubbleWithMentions from './MessageBubbleWithMentions';
import ChatSearch from './ChatSearch';
import ChatMenu from './ChatMenu';
import UserProfileModal from './UserProfileModal';
import AttachModal from './AttachModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import OnlineStatusIndicator from './OnlineStatusIndicator';
import styles from './ChatWindow.module.css';
import ImageViewerModal from './ImageViewerModal';

const ChatWindow = ({ chat, onChatUpdate, onBackToChatList }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [actionsMenu, setActionsMenu] = useState({ open: false, message: null, x: null, y: null });
  const [pinned, setPinned] = useState([]);
  const [showPinned, setShowPinned] = useState(true);
  const [imageViewer, setImageViewer] = useState({ isOpen: false, src: '', caption: '', items: [], currentIndex: 0 });
  const messagesEndRef = useRef(null);
  const messagesListRef = useRef(null);
  const [stickyDayLabel, setStickyDayLabel] = useState('');
  const typingTimeoutRef = useRef(null);

  const { socket, isConnected, joinChat, leaveChat, sendMessage, startTyping, stopTyping, isUserOnline, getUserStatus } = useSocket();
  const { user } = useAuth();

  // Handle mention clicks
  const handleMentionClick = async (username, isOwnMention) => {
    if (isOwnMention) {
      // Navigate to favorites/notes
      console.log('📝 Navigating to favorites for own mention:', username);
      // TODO: Implement favorites navigation
      // For now, we'll show a placeholder
      alert('Переход в избранные (в разработке)');
    } else {
      // Navigate to user's chat
      console.log('💬 Navigating to chat with:', username);
      try {
        // Search for user by username
        const response = await axios.get(`/user/search?q=${username}&limit=1`);
        const users = response.data.users;
        
        if (users && users.length > 0) {
          const targetUser = users[0];
          console.log('👤 Found user:', targetUser);
          
          // Create or find existing chat with this user
          const chatResponse = await axios.post('/chat', {
            participants: [targetUser._id],
            type: 'private'
          });
          
          if (chatResponse.data && chatResponse.data.chat) {
            console.log('✅ Chat created/found:', chatResponse.data.chat);
            // Navigate to the chat
            onChatUpdate(chatResponse.data.chat);
          } else {
            console.error('❌ Failed to create chat: No chat data received');
            alert('Не удалось создать чат с пользователем');
          }
        } else {
          console.log('❌ User not found:', username);
          alert(`Пользователь @${username} не найден`);
        }
      } catch (error) {
        console.error('❌ Error handling mention click:', error);
        alert('Ошибка при переходе к пользователю');
      }
    }
  };

  // Handle file selection from AttachModal
  const handleFileSelect = (file) => {
    if (file.type.startsWith('image/')) {
      setSelectedFile(file);
      setShowPhotoPreview(true);
    } else {
      console.log('Unsupported file type:', file.type);
      // TODO: Handle other file types
    }
  };

  // Handle photo send
  const handlePhotoSend = async (file, caption) => {
    try {
      // Upload photo to ImgBB
      const formData = new FormData();
      formData.append('image', file);
      
      const uploadResponse = await axios.post('/user/upload-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (uploadResponse.data.success && uploadResponse.data.imageUrl) {
        const contentToSend = caption && caption.trim() ? caption : '\u200B';
        // Create optimistic message with photo
        const optimisticMessage = {
          _id: `temp_${Date.now()}`,
          chat: chat._id,
          sender: {
            _id: user._id,
            username: user.username,
            displayName: user.displayName,
            avatar: user.avatar
          },
          content: contentToSend,
          type: 'image',
          imageUrl: uploadResponse.data.imageUrl,
          createdAt: new Date().toISOString(),
          isOptimistic: true
        };

        // Add optimistic message immediately
        setMessages(prev => [...prev, optimisticMessage]);

        // Send message via socket with full data
        socket.emit('send_message', {
          chatId: chat._id,
          content: contentToSend,
          type: 'image',
          imageUrl: uploadResponse.data.imageUrl
        });
        
        // Clear states
        setSelectedFile(null);
        setShowPhotoPreview(false);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error sending photo:', error);
      throw error;
    }
  };

  // Отладка данных пользователя
  useEffect(() => {
    // console.log('👤 User data in ChatWindow:', {
    //   user: user,
    //   userId: user?._id,
    //   userName: user?.displayName || user?.username,
    //   userEmail: user?.email
    // });
  }, [user]);

  // Load messages when chat changes
  useEffect(() => {
    if (chat) {
      loadMessages();
      if (socket && isConnected) {
        joinChat(chat._id);
      }
      // Fetch pinned
      fetchPinned();
    }

    return () => {
      if (chat && socket && isConnected) {
        leaveChat(chat._id);
      }
    };
  }, [chat?._id]); // Убираем socket и isConnected из зависимостей

  // Обновляем статус пользователя в чате при загрузке
  useEffect(() => {
    if (chat && chat.participants) {
      const userIds = chat.participants
        .filter(p => p && p._id && p._id !== user._id)
        .map(p => p._id);
      
      if (userIds.length > 0) {
        console.log('🔄 ChatWindow: Refreshing status for participants:', userIds);
        // Здесь можно добавить вызов fetchOnlineStatus если нужно
      }
    }
  }, [chat, user._id]);

  // Подключаемся к чату при изменении состояния соединения
  useEffect(() => {
    if (chat && socket && isConnected) {
      joinChat(chat._id);
    }

    return () => {
      if (chat && socket && isConnected) {
        leaveChat(chat._id);
      }
    };
  }, [socket, isConnected, chat?._id]);

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (chat && messages.length > 0) {
      markMessagesAsRead();
    }
  }, [chat?._id, messages.length]);

  // Also mark as read immediately upon opening the chat (without waiting for messages)
  useEffect(() => {
    const mark = async () => {
      if (!chat) return;
      try { await axios.put(`/chat/${chat._id}/read`); } catch (e) { /* noop */ }
    };
    if (chat?._id) mark();
  }, [chat?._id]);

  const markMessagesAsRead = async () => {
    if (!chat) return;
    
    try {
      await axios.put(`/chat/${chat._id}/read`);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  // Socket event listeners
  useEffect(() => {
    if (socket && chat?._id) {
      const handleNewMessage = (message) => {
        if (message.chat === chat._id) {
          setMessages(prev => {
            // Проверяем, есть ли оптимистичное сообщение с таким же содержимым
            const optimisticIndex = prev.findIndex(msg => 
              msg.isOptimistic && 
              msg.content === message.content && 
              msg.sender._id === message.sender._id
            );
            
            if (optimisticIndex !== -1) {
              // Заменяем оптимистичное сообщение на реальное
              const newMessages = [...prev];
              newMessages[optimisticIndex] = { ...message, disableAnimation: true };
              return newMessages;
            }
            
            // Проверяем, нет ли уже такого сообщения (предотвращаем дубликаты)
            const messageExists = prev.some(msg => msg._id === message._id);
            if (messageExists) {
              return prev;
            }
            
            return [...prev, message];
          });
        }
      };

      const handleUserTyping = (data) => {
        if (data.chatId === chat._id) {
          setTypingUsers(prev => {
            if (!prev.includes(data.userId)) {
              return [...prev, data.userId];
            }
            return prev;
          });
        }
      };

      const handleUserStoppedTyping = (data) => {
        if (data.chatId === chat._id) {
          setTypingUsers(prev => prev.filter(userId => userId !== data.userId));
        }
      };

      const handleChatUpdated = (data) => {
        if (data.chatId === chat._id && onChatUpdate) {
          onChatUpdate({
            ...chat,
            lastMessage: data.lastMessage,
            updatedAt: new Date(data.updatedAt)
          });
        }
      };

      // New realtime message events
      const handleReaction = (data) => {
        if (data.chatId !== chat._id) return;
        setMessages(prev => prev.map(m => {
          if (m._id !== data.messageId) return m;
          const withoutUser = (m.reactions || []).filter(r => (r.user?._id || r.user) !== data.userId);
          return { ...m, reactions: [...withoutUser, { user: data.userId, emoji: data.emoji }] };
        }));
      };
      const handleDeleted = (data) => {
        if (data.chatId !== chat._id) return;
        setMessages(prev => prev.map(m => m._id === data.messageId ? { ...m, isDeleted: true, content: '', imageUrl: null, fileUrl: null, reactions: [] } : m));
      };

      // Добавляем обработчики
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('chat_updated', handleChatUpdated);
      socket.on('message_reaction', handleReaction);
      socket.on('message_deleted', handleDeleted);
      const handlePinned = (data) => { if (data.chatId === chat._id) fetchPinned(); };
      const handleUnpinned = (data) => { if (data.chatId === chat._id) fetchPinned(); };
      socket.on('message_pinned', handlePinned);
      socket.on('message_unpinned', handleUnpinned);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
        socket.off('chat_updated', handleChatUpdated);
        socket.off('message_reaction', handleReaction);
        socket.off('message_deleted', handleDeleted);
        socket.off('message_pinned', handlePinned);
        socket.off('message_unpinned', handleUnpinned);
      };
    }
  }, [socket, chat?._id, onChatUpdate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sticky day header: recompute on scroll and when messages change
  useEffect(() => {
    const el = messagesListRef.current;
    if (!el) return;
    const recompute = () => {
      const seps = el.querySelectorAll('[data-role="day-sep"]');
      const scrollTop = el.scrollTop;
      const OFFSET = 12; // компенсируем верхний отступ/шапку
      let current = '';
      for (let i = 0; i < seps.length; i++) {
        const sep = seps[i];
        const top = sep.offsetTop;
        if (top <= scrollTop + OFFSET) {
          current = sep.getAttribute('data-label') || '';
        } else {
          break;
        }
      }
      setStickyDayLabel(current);
    };
    recompute();
    el.addEventListener('scroll', recompute, { passive: true });
    return () => el.removeEventListener('scroll', recompute);
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/chat/${chat._id}/messages`);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPinned = async () => {
    try {
      if (!chat?._id) return;
      const res = await axios.get(`/chat/${chat._id}/pins`);
      setPinned(res.data.pinned || []);
    } catch (e) {
      // silent
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToMessage = (messageId) => {
    const el = document.getElementById(`message-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flash-highlight');
      setTimeout(() => el.classList.remove('flash-highlight'), 1200);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      stopTyping(chat._id);
      setIsTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    // Create optimistic message
    const optimisticMessage = {
      _id: `temp_${Date.now()}`,
      chat: chat._id,
      sender: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar
      },
      content: messageContent,
      type: 'text',
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      replyTo: replyTo ? {
        _id: replyTo._id,
        content: replyTo.content,
        type: replyTo.type,
        imageUrl: replyTo.imageUrl,
        sender: replyTo.sender,
        createdAt: replyTo.createdAt
      } : null
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Send message via socket with optional replyTo
    sendMessage(chat._id, { content: messageContent, type: 'text', replyTo: replyTo?._id || null });
    setReplyTo(null);
  };

  // Message actions helpers
  const reactTo = async (message, emoji) => {
    try { await axios.post(`/chat/${chat._id}/messages/${message._id}/react`, { emoji }); } catch (e) { console.error(e); }
  };
  const deleteForMe = async (message) => {
    try {
      await axios.put(`/chat/${chat._id}/messages/${message._id}/hide`);
      setMessages(prev => prev.filter(m => m._id !== message._id));
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Не удалось удалить сообщение у себя';
      alert(msg);
    }
  };
  const deleteForAll = async (message) => {
    try {
      await axios.delete(`/chat/${chat._id}/messages/${message._id}`);
      // Optimistic local update
      setMessages(prev => prev.map(m => m._id === message._id ? { ...m, isDeleted: true, content: '', imageUrl: null, fileUrl: null, reactions: [] } : m));
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || 'Не удалось удалить у всех (возможно, вы не автор)';
      alert(msg);
    }
  };
  const pinMessage = async (message) => {
    try {
      await axios.put(`/chat/${chat._id}/pin/${message._id}`);
      // refresh pinned immediately
      await fetchPinned();
    } catch (e) { console.error(e); }
  };
  const unpinMessage = async (message) => {
    try {
      await axios.delete(`/chat/${chat._id}/pin/${message._id}`);
      // refresh pinned immediately
      await fetchPinned();
    } catch (e) { console.error(e); }
  };

  const openActions = (message, evt) => {
    const x = evt && typeof evt.clientX === 'number' ? evt.clientX : null;
    const y = evt && typeof evt.clientY === 'number' ? evt.clientY : null;
    setActionsMenu({ open: true, message, x, y });
  };
  const closeActions = () => setActionsMenu({ open: false, message: null, x: null, y: null });

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping(chat._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        stopTyping(chat._id);
        setIsTyping(false);
      }
    }, 1000);
  };

  const getChatName = () => {
    if (chat.type === 'group') {
      return chat.name || 'Групповой чат';
    } else {
      // For private chats, show the other participant's name
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.displayName || otherParticipant?.username || 'Неизвестный пользователь';
    }
  };

  const getOtherParticipant = () => {
    if (chat.type === 'group') return null;
    return chat.participants.find(p => p._id !== user._id);
  };

  const getChatAvatar = () => {
    if (chat.type === 'group') {
      return chat.avatar;
    } else {
      // For private chats, show the other participant's avatar
      const otherParticipant = getOtherParticipant();
      return otherParticipant?.avatar;
    }
  };

  const getOnlineStatus = () => {
    if (chat.type === 'group') {
      const onlineCount = chat.participants.filter(p => {
        const userStatus = getUserStatus(p._id);
        return userStatus.isOnline;
      }).length;
      return (
        <span style={{ color: '#10B981' }}>
          {onlineCount} онлайн
        </span>
      );
    } else {
      const otherParticipant = getOtherParticipant();
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

  if (!chat) {
    return (
      <div className={styles.emptyState}>
        <p>Выберите чат для начала общения</p>
      </div>
    );
  }

  return (
    <div className={styles.chatWindow}>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <button 
          className={styles.backButton}
          onClick={onBackToChatList}
          title="Назад к списку чатов"
        >
          <FiArrowLeft size={20} />
        </button>
        <div className={styles.chatInfo}>
          <div className={styles.chatAvatar} style={{ position: 'relative' }} onClick={() => setIsProfileOpen(true)}>
            {getChatAvatar() ? (
              <img src={getChatAvatar()} alt={getChatName()} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getChatName()?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.chatDetails} onClick={() => setIsProfileOpen(true)}>
            <h2 className={styles.chatName}>{getChatName()}</h2>
            <p className={styles.chatStatus}>{getOnlineStatus()}</p>
          </div>
        </div>
        
        <div className={styles.chatActions}>
          <button 
            className={styles.actionButton} 
            title="Поиск"
            onClick={() => setIsSearchOpen(true)}
          >
            <FiSearch size={18} />
          </button>
        </div>
      </div>

      {/* Pinned Banner */}
      {showPinned && pinned && pinned.length > 0 && (
        <div className={styles.pinnedBanner}>
          <div className={styles.pinnedInfo}>
            <span className={styles.pinnedTitle}>Закреплённые сообщения</span>
            {pinned.length > 1 && <span className={styles.pinnedCount}>· {pinned.length}</span>}
          </div>
          <div className={styles.pinnedPreview} onClick={() => pinned[0]?.message?._id && scrollToMessage(pinned[0].message._id)}>
            {pinned[0]?.message?.type === 'image' ? '📌 📷 Изображение' : `📌 ${pinned[0]?.message?.content?.slice(0, 120) || 'Сообщение'}`}
          </div>
          <button className={styles.pinnedHideBtn} onClick={() => setShowPinned(false)}>Скрыть</button>
        </div>
      )}

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className="loading-spinner"></div>
            <p>Загрузка сообщений...</p>
          </div>
        ) : (
          <div className={styles.messagesList} ref={messagesListRef}>
            {stickyDayLabel ? (
              <div className={styles.stickyDayHeader}>
                <span className={styles.dayLabel}>{stickyDayLabel}</span>
              </div>
            ) : null}
            {(() => {
              const toYMD = (d) => {
                const dt = new Date(d);
                const y = dt.getFullYear();
                const m = String(dt.getMonth() + 1).padStart(2, '0');
                const day = String(dt.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
              };
              const labelFor = (d) => {
                const dt = new Date(d);
                const today = new Date();
                const ymd = toYMD(dt);
                const ymdToday = toYMD(today);
                const ymdYesterday = toYMD(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1));
                if (ymd === ymdToday) return 'Сегодня';
                if (ymd === ymdYesterday) return 'Вчера';
                return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`;
              };
              let prevYMD = null;
              const out = [];
              for (const message of messages) {
                const stamp = message.createdAt || message.created_at || Date.now();
                const curYMD = toYMD(stamp);
                if (curYMD !== prevYMD) {
                  out.push(
                    <div
                      key={`sep-${curYMD}`}
                      className={styles.daySeparator}
                      data-role="day-sep"
                      data-ymd={curYMD}
                      data-label={labelFor(stamp)}
                    >
                      <span className={styles.dayLabel}>{labelFor(stamp)}</span>
                    </div>
                  );
                  prevYMD = curYMD;
                }
                // Правильно определяем текущего пользователя из AuthContext
                const isOwnMessage = message.sender._id === user._id;
                
                // Для собственных сообщений используем данные текущего пользователя
                // Для чужих сообщений используем данные отправителя
                let senderName, senderAvatar;
                
                if (isOwnMessage) {
                  senderName = user.displayName || user.username || 'Вы';
                  senderAvatar = user.avatar;
                } else {
                  // Используем данные отправителя сообщения
                  senderName = message.sender.displayName || message.sender.username || 'Неизвестный';
                  senderAvatar = message.sender.avatar;
                }
                out.push(
                  <MessageBubbleWithMentions
                    key={message._id}
                    message={message}
                    isOwn={isOwnMessage}
                    senderName={senderName}
                    senderAvatar={senderAvatar}
                    participants={chat.participants || []}
                    disableAnimation={message.disableAnimation}
                    onMentionClick={handleMentionClick}
                    currentUsername={user.username}
                    onImageClick={(src, caption, id) => {
                      // Build gallery from current messages
                      const items = messages
                        .filter(m => m && m.type === 'image' && m.imageUrl)
                        .map(m => ({ src: m.imageUrl, caption: m.content || '', id: m._id }));
                      const idxById = items.findIndex(it => it.id === id);
                      const startIndex = idxById !== -1 ? idxById : items.findIndex(it => it.src === src) || 0;
                      setImageViewer({ isOpen: true, src, caption, items, currentIndex: Math.max(0, startIndex) });
                    }}
                    onOpenActions={(msg, e) => openActions(msg, e)}
                  />
                );
              }
              return out;
            })()}
            
            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>Кто-то печатает...</p>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.messageInputContainer}>
        {replyTo && (
          <div className={styles.replyComposer}>
            <div className={styles.replyLine} />
            <div className={styles.replyBody}>
              <div className={styles.replyAuthor}>{replyTo.sender?.displayName || replyTo.sender?.username || 'Сообщение'}</div>
              <div className={styles.replyText}>{replyTo.type === 'image' ? '📷 Изображение' : (replyTo.content || '').slice(0, 140)}</div>
            </div>
            <button type="button" className={styles.replyCancel} onClick={() => setReplyTo(null)}>×</button>
          </div>
        )}
        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <div className={styles.inputWrapper}>
            <button
              type="button"
              className={styles.attachButton}
              title="Прикрепить файл"
              onClick={() => setShowAttachModal(true)}
            >
              <FiPlus size={18} />
            </button>
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Введите сообщение..."
              className={styles.messageInput}
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !isConnected}
              className={styles.sendButton}
            >
              {isConnected ? <FiSend size={18} /> : <FiAlertCircle size={18} />}
            </button>
          </div>
        </form>
      </div>

      {/* Chat Search */}
      <ChatSearch
        messages={messages}
        onClose={() => setIsSearchOpen(false)}
        isOpen={isSearchOpen}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        user={chat?.type === 'group' ? chat?.participants?.[0] : getOtherParticipant()}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isOwnProfile={false}
      />

      {/* Chat Menu */}
      <ChatMenu
        chat={chat}
        user={chat?.type === 'group' ? chat?.participants?.[0] : chat?.participants?.find(p => p._id !== chat?.participants?.[0]?._id)}
        onClose={() => setIsMenuOpen(false)}
        isOpen={isMenuOpen}
        onLogout={() => console.log('Logout')}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Attach Modal */}
      <AttachModal
        isOpen={showAttachModal}
        onClose={() => setShowAttachModal(false)}
        onFileSelect={handleFileSelect}
      />

      {/* Photo Preview Modal */}
      <PhotoPreviewModal
        isOpen={showPhotoPreview}
        onClose={() => {
          setShowPhotoPreview(false);
          setSelectedFile(null);
        }}
        file={selectedFile}
        onSend={handlePhotoSend}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        isOpen={imageViewer.isOpen}
        src={imageViewer.src}
        caption={imageViewer.caption}
        items={imageViewer.items}
        currentIndex={imageViewer.currentIndex}
        onPrev={() => setImageViewer(iv => {
          if (!iv.items || iv.items.length === 0) return iv;
          const nextIndex = Math.max(0, iv.currentIndex - 1);
          const nextItem = iv.items[nextIndex];
          return { ...iv, currentIndex: nextIndex, src: nextItem?.src, caption: nextItem?.caption };
        })}
        onNext={() => setImageViewer(iv => {
          if (!iv.items || iv.items.length === 0) return iv;
          const nextIndex = Math.min(iv.items.length - 1, iv.currentIndex + 1);
          const nextItem = iv.items[nextIndex];
          return { ...iv, currentIndex: nextIndex, src: nextItem?.src, caption: nextItem?.caption };
        })}
        onClose={() => setImageViewer({ isOpen: false, src: '', caption: '', items: [], currentIndex: 0 })}
      />

      {actionsMenu.open && actionsMenu.message && (
        <div className={styles.actionsMenuOverlay} onClick={closeActions}>
          <div
            className={styles.actionsMenu}
            onClick={(e) => e.stopPropagation()}
            style={{
              '--menu-x': ((actionsMenu.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)) + 'px'),
              '--menu-y': ((actionsMenu.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 200)) + 'px')
            }}
          >
            <div className={styles.actionsRow}>
              {['👍','❤️','😂','😮','😢','🔥'].map(em => (
                <button type="button" key={em} className={styles.reactionBtn} onClick={() => { reactTo(actionsMenu.message, em); closeActions(); }}>{em}</button>
              ))}
            </div>
            <div className={styles.actionsList}>
              <button type="button" onClick={() => { setReplyTo(actionsMenu.message); closeActions(); }}>Ответить</button>
              {(((actionsMenu.message.sender && actionsMenu.message.sender._id === user._id) || actionsMenu.message.sender === user._id)) && (
                <button type="button" style={{ color: '#ff6b6b' }} onClick={() => { deleteForAll(actionsMenu.message); closeActions(); }}>Удалить у всех</button>
              )}
              <button type="button" onClick={() => { deleteForMe(actionsMenu.message); closeActions(); }}>Удалить у себя</button>
              <button type="button" onClick={() => { pinMessage(actionsMenu.message); closeActions(); }}>Закрепить</button>
              <button type="button" onClick={() => { unpinMessage(actionsMenu.message); closeActions(); }}>Открепить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;

