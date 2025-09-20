import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch, FiMoreHorizontal, FiSend, FiAlertCircle, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { formatLastSeen } from '../utils/timeUtils';
import MessageBubble from './MessageBubble';
import ChatSearch from './ChatSearch';
import ChatMenu from './ChatMenu';
import UserProfileModal from './UserProfileModal';
import AttachModal from './AttachModal';
import styles from './ChatWindow.module.css';

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
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket, isConnected, joinChat, leaveChat, sendMessage, startTyping, stopTyping, isUserOnline, getUserStatus } = useSocket();
  const { user } = useAuth();

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
    }

    return () => {
      if (chat && socket && isConnected) {
        leaveChat(chat._id);
      }
    };
  }, [chat?._id]); // Убираем socket и isConnected из зависимостей

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

      // Добавляем обработчики
      socket.on('new_message', handleNewMessage);
      socket.on('user_typing', handleUserTyping);
      socket.on('user_stopped_typing', handleUserStoppedTyping);
      socket.on('chat_updated', handleChatUpdated);

      return () => {
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
        socket.off('chat_updated', handleChatUpdated);
      };
    }
  }, [socket, chat?._id, onChatUpdate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      isOptimistic: true
    };

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Send message via socket
    sendMessage(chat._id, messageContent);
  };

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

  const getChatAvatar = () => {
    if (chat.type === 'group') {
      return chat.avatar;
    } else {
      // For private chats, show the other participant's avatar
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
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
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      const userStatus = getUserStatus(otherParticipant?._id);
      return userStatus.isOnline ? (
        <span style={{ color: '#10B981' }}>Онлайн</span>
      ) : (
        <span style={{ color: '#6B7280' }}>
          Был в сети {formatLastSeen(userStatus.lastSeen)}
        </span>
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
          <div className={styles.chatAvatar} style={{ position: 'relative' }}>
            {getChatAvatar() ? (
              <img src={getChatAvatar()} alt={getChatName()} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getChatName()?.charAt(0)?.toUpperCase()}
              </div>
            )}
            {chat.type === 'private' && (() => {
              const otherParticipant = chat.participants.find(p => p._id !== user._id);
              return otherParticipant?.isOnline && (
                <div style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '12px',
                  height: '12px',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  border: '2px solid var(--theme-background, #1a1a1a)',
                  zIndex: 1
                }} />
              );
            })()}
          </div>
          <div className={styles.chatDetails}>
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
          <button 
            className={styles.actionButton} 
            title="Меню"
            onClick={() => setIsMenuOpen(true)}
          >
            <FiMoreHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messagesContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className="loading-spinner"></div>
            <p>Загрузка сообщений...</p>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {messages.map(message => {
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
              
              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={isOwnMessage}
                  senderName={senderName}
                  senderAvatar={senderAvatar}
                  disableAnimation={message.disableAnimation}
                />
              );
            })}
            
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
        user={chat?.type === 'group' ? chat?.participants?.[0] : chat?.participants?.find(p => p._id !== chat?.participants?.[0]?._id)}
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
      />
    </div>
  );
};

export default ChatWindow;

