import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiCircle, FiUser } from 'react-icons/fi';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import AIChatWindow from '../components/AIChatWindow';
import UserProfileModal from '../components/UserProfileModal';
import SettingsModalTabs from '../components/SettingsModalTabs';
import UserAvatarDropdown from '../components/UserAvatarDropdown';
import WalletModal from '../components/WalletModal';
import ArchivedChatList from '../components/ArchivedChatList';
import MobileNavigation from '../components/MobileNavigation';
import MobileProfilePage from '../components/MobileProfilePage';
import SearchButton from '../components/SearchButton';
import useIsMobile from '../hooks/useIsMobile';
import styles from './Chat.module.css';

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showChatList, setShowChatList] = useState(true);
  const [animationType] = useState('slideFromRight'); // 'slideFromRight', 'scaleIn', 'fadeIn'
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDesktopSettings, setShowDesktopSettings] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState('messages');
  const [showMobileNav, setShowMobileNav] = useState(true); // Состояние для показа/скрытия мобильной навигации
  const [showAIChat, setShowAIChat] = useState(false); // Состояние для показа чата с ИИ
  const [showMobileProfile, setShowMobileProfile] = useState(false); // Состояние для показа мобильной страницы профиля
  const [showWallet, setShowWallet] = useState(false);

  const { user, logout, isAuthenticated } = useAuth();
  const { socket, isConnected } = useSocket();
  const { theme } = useTheme();
  const [showArchived, setShowArchived] = useState(false); // archive view in sidebar on all devices
  const isMobile = useIsMobile();

  // Load chats on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadChats();
    }
  }, [isAuthenticated]);

  // Fallback: periodically refresh chat list to ensure it's up to date
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      if (socket && isConnected && isAuthenticated) {
        console.log('🔄 Periodic chat list refresh');
        loadChats();
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [socket, isConnected, isAuthenticated]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat._id === message.chat) {
              return {
                ...chat,
                lastMessage: message,
                updatedAt: new Date(message.createdAt)
              };
            }
            return chat;
          });
          
          // Sort chats by updatedAt
          return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });

        // Update selected chat messages if it's the current chat
        if (selectedChat && selectedChat._id === message.chat) {
          setSelectedChat(prevChat => ({
            ...prevChat,
            messages: [...(prevChat.messages || []), message]
          }));
        }
      });

      // Handle chat updates for chat list
      socket.on('chat_updated', (data) => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat._id === data.chatId) {
              return {
                ...chat,
                lastMessage: data.lastMessage,
                updatedAt: new Date(data.updatedAt)
              };
            }
            return chat;
          });
          
          // Sort chats by updatedAt
          return updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        });
      });

      socket.on('user_typing', (data) => {
        // Handle typing indicator
        console.log('User typing:', data);
      });

      socket.on('user_stopped_typing', (data) => {
        // Handle stop typing indicator
        console.log('User stopped typing:', data);
      });

      return () => {
        socket.off('new_message');
        socket.off('chat_updated');
        socket.off('user_typing');
        socket.off('user_stopped_typing');
      };
    }
  }, [socket, selectedChat]);

  const loadChats = async () => {
    console.log('📱 loadChats вызвана, isAuthenticated:', isAuthenticated);
    
    // Проверяем авторизацию перед запросом
    if (!isAuthenticated) {
      console.log('📱 Пользователь не авторизован, пропускаем загрузку чатов');
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('📱 Загружаем чаты...');
      const response = await axios.get('/chat');
      // Удаляем дубликаты по _id
      const uniqueChats = response.data.chats.filter((chat, index, self) => 
        index === self.findIndex(c => c._id === chat._id)
      );
      setChats(uniqueChats);
      console.log('📱 Чаты загружены:', uniqueChats.length);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const response = await axios.get(`/user/search?q=${encodeURIComponent(query)}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const createChat = async (participantId) => {
    try {
      const response = await axios.post('/chat', {
        participants: [participantId],
        type: 'private'
      });
      
      const newChat = response.data.chat;
      setChats(prevChats => {
        // Проверяем, нет ли уже чата с таким ID
        const existingChatIndex = prevChats.findIndex(chat => chat._id === newChat._id);
        if (existingChatIndex !== -1) {
          // Если чат уже существует, обновляем его
          const updatedChats = [...prevChats];
          updatedChats[existingChatIndex] = newChat;
          return updatedChats;
        } else {
          // Если чата нет, добавляем в начало
          return [newChat, ...prevChats];
        }
      });
      setSelectedChat(newChat);
      setSearchQuery('');
      setUsers([]);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleChatSelect = (chat) => {
    if (isAnimating) return; // Предотвращаем множественные клики во время анимации

    // Если передали null (например, после удаления) — просто вернёмся к списку
    if (!chat) {
      setSelectedChat(null);
      setShowChatList(true);
      setShowAIChat(false);
      if (isMobile) setShowMobileNav(true);
      return;
    }

    setIsAnimating(true);
    setSelectedChat(chat);
    setShowChatList(false);
    setShowAIChat(false); // Закрываем чат с ИИ

    // Скрываем мобильную навигацию при входе в чат
    if (isMobile) {
      setShowMobileNav(false);
    }

    if (socket && isConnected && chat?._id) {
      socket.emit('join_chat', chat._id);
    }

    // Сброс флага анимации после завершения
    setTimeout(() => {
      setIsAnimating(false);
    }, 350);
  };

  const handleAIChatSelect = () => {
    if (isAnimating) return; // Предотвращаем множественные клики во время анимации
    
    setIsAnimating(true);
    setShowAIChat(true);
    setSelectedChat(null); // Очищаем выбранный чат
    setShowChatList(false);
    
    // Скрываем мобильную навигацию при входе в чат с ИИ
    if (isMobile) {
      setShowMobileNav(false);
    }
    
    // Сброс флага анимации после завершения
    setTimeout(() => {
      setIsAnimating(false);
    }, 350);
  };

  const handleBackToChatList = () => {
    if (isAnimating) return; // Предотвращаем множественные клики во время анимации
    
    setIsAnimating(true);
    setShowChatList(true);
    setShowAIChat(false); // Закрываем чат с ИИ
    
    // Показываем мобильную навигацию при возврате к списку чатов
    if (isMobile) {
      setShowMobileNav(true);
    }
    
    // Сброс флага анимации после завершения
    setTimeout(() => {
      setIsAnimating(false);
    }, 350);
  };


  // Обработчики навигации
  const handleNavigation = (page) => {
    setCurrentPage(page);
    
    if (page === 'settings') {
      if (isMobile) {
        setShowMobileSettings(true);
        setShowChatList(false); // Скрываем чатлист на мобилке при открытии настроек
        setSelectedChat(null); // Очищаем выбранный чат
        setShowMobileNav(false); // Скрываем навигацию в настройках
      } else {
        setShowDesktopSettings(true);
      }
    } else if (page === 'messages') {
      // При переходе к сообщениям на мобилке показываем чатлист
      if (isMobile) {
        setShowMobileSettings(false);
        setShowChatList(true);
        setSelectedChat(null); // Очищаем выбранный чат
        setShowMobileNav(true); // Показываем навигацию в списке чатов
      }
    } else if (page === 'contacts') {
      if (isMobile) {
        setShowMobileSettings(false);
        setShowChatList(false);
        setSelectedChat(null); // Очищаем выбранный чат
        setShowMobileNav(true); // Показываем навигацию в контактах
      }
    }
  };

  // Обработчики настроек

  const handleLogout = async () => {
    await logout();
  };

  // Обработчики для новой системы профиля
  const handleProfileClick = () => {
    if (isMobile) {
      setShowMobileProfile(true);
      setShowChatList(false);
      setSelectedChat(null);
      setShowMobileNav(false);
    } else {
      setShowUserProfile(true);
    }
  };

  const handleDesktopSettingsClick = () => {
    setShowDesktopSettings(true);
  };

  const handleOpenArchived = () => {
    setShowArchived(true);
  };

  const handleUnarchived = () => {
    // refresh chat list when some chat was unarchived
    loadChats();
  };

  const handleOpenChatFromArchive = (chat) => {
    // select chat and close archive view/modal
    setShowArchived(false);
    handleChatSelect(chat);
  };

  // const handleThemeToggle = () => {
  //   toggleTheme();
  // };

  const handleMobileProfileClose = () => {
    setShowMobileProfile(false);
    setShowChatList(true);
    setShowMobileNav(true);
  };

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${showChatList ? styles.open : ''}`}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          {!isMobile && (
            <UserAvatarDropdown
              user={user}
              onProfileClick={handleProfileClick}
              onSettingsClick={handleDesktopSettingsClick}
              onArchiveClick={handleOpenArchived}
              onWalletClick={() => setShowWallet(true)}
              onLogout={handleLogout}
              isConnected={isConnected}
            />
          )}
          <h2 className={styles.sidebarTitle}>{(!isMobile && showArchived) ? 'Архив' : 'Чаты'}</h2>
          <SearchButton 
            onSearch={(query) => {
              setSearchQuery(query);
              if (query.trim()) {
                searchUsers(query);
              } else {
                setUsers([]);
              }
            }}
            searchResults={users}
            onUserSelect={(user) => {
              createChat(user._id);
              setUsers([]);
            }}
            placeholder="Поиск пользователей..."
          />
        </div>


        {/* Chat List */}
        <div className={styles.chatListContainer}>
          {showArchived ? (
            <ArchivedChatList
              onOpenChat={handleOpenChatFromArchive}
              onUnarchive={handleUnarchived}
              onBack={() => setShowArchived(false)}
            />
          ) : (
            <ChatList
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              isLoading={isLoading}
              showAIChat={showAIChat}
              onAIChatSelect={handleAIChatSelect}
              onOpenArchive={handleOpenArchived}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`${styles.mainContent} ${
        !showChatList ? styles.hidden : ''
      } ${styles[animationType]} ${
        !showChatList ? styles.active : ''
      }`}>
        {showAIChat ? (
          <AIChatWindow onClose={handleBackToChatList} />
        ) : selectedChat ? (
          <ChatWindow
            chat={selectedChat}
            onChatUpdate={setSelectedChat}
            onBackToChatList={handleBackToChatList}
          />
        ) : (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <h2>Добро пожаловать в Tuktuk</h2>
              {chats.length === 0 ? (
                <p>Чатов пока нет. Начните общаться!</p>
              ) : (
                <p>Выберите чат из списка слева</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Profile Sidebar */}
      {showUserProfile && (
        <UserProfileModal
          user={user}
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          isOwnProfile={true}
        />
      )}


      {/* Mobile Navigation - ТОЛЬКО НА МОБИЛЬНЫХ! */}
      {(() => {
        // ЖЕСТКАЯ ПРОВЕРКА - НЕ РЕНДЕРИТЬ НА ПК ВООБЩЕ
        if (typeof window !== 'undefined' && window.innerWidth > 768) {
          return null;
        }
        
        return (
          <MobileNavigation
            onNavigate={handleNavigation}
            onProfileClick={handleProfileClick}
            onWalletClick={() => setShowWallet(true)}
            isVisible={showMobileNav}
          />
        );
      })()}

      {/* Desktop Settings Modal */}
      <SettingsModalTabs
        isOpen={showDesktopSettings}
        onClose={() => setShowDesktopSettings(false)}
        user={user}
      />


      {/* Mobile Profile Page */}
      <MobileProfilePage
        isOpen={showMobileProfile}
        onClose={handleMobileProfileClose}
        user={user}
      />

      {/* Wallet Modal */}
      <WalletModal isOpen={showWallet} onClose={() => setShowWallet(false)} />

    </div>
  );
};

export default Chat;

