import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch, FiMoreHorizontal, FiSend, FiAlertCircle, FiPlus, FiArrowLeft } from 'react-icons/fi';
import { formatLastSeen } from '../utils/timeUtils';
import MessageBubbleWithMentions from './MessageBubbleWithMentions';
import ChatSearch from './ChatSearch';
import ChatMenu from './ChatMenu';
import UserProfileModal from './UserProfileModal';
import AttachModal from './AttachModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import OnlineStatusIndicator from './OnlineStatusIndicator';
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
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
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
          content: caption || '',
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
          content: caption || '',
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
          <div className={styles.chatAvatar} style={{ position: 'relative' }}>
            {getChatAvatar() ? (
              <img src={getChatAvatar()} alt={getChatName()} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getChatName()?.charAt(0)?.toUpperCase()}
              </div>
            )}
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
                <MessageBubbleWithMentions
                  key={message._id}
                  message={message}
                  isOwn={isOwnMessage}
                  senderName={senderName}
                  senderAvatar={senderAvatar}
                  disableAnimation={message.disableAnimation}
                  onMentionClick={handleMentionClick}
                  currentUsername={user.username}
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
    </div>
  );
};

export default ChatWindow;

