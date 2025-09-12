import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import MobileChatList from './MobileChatList';
import MobileChat from './MobileChat';
import AIChatWindow from './AIChatWindow';
import styles from './MobileApp.module.css';

const MobileApp = () => {
  const [currentView, setCurrentView] = useState('chatList'); // 'chatList', 'chat', 'aiChat'
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();
  const { socket, isConnected, sendMessage } = useSocket();

  // Загрузка чатов
  useEffect(() => {
    const loadChats = async () => {
      try {
        setIsLoading(true);
        // Здесь будет API вызов для загрузки чатов
        // Пока используем моковые данные
        setChats([
          {
            _id: '1',
            type: 'private',
            participants: [
              { _id: user?._id, displayName: user?.displayName },
              { _id: '2', displayName: 'Анна Петрова', avatar: null, isOnline: true }
            ],
            lastMessage: {
              content: 'Привет! Как дела?',
              createdAt: new Date().toISOString(),
              sender: '2'
            },
            unreadCount: 2
          },
          {
            _id: '3',
            type: 'group',
            name: 'Рабочая группа',
            participants: [
              { _id: user?._id, displayName: user?.displayName },
              { _id: '4', displayName: 'Иван Сидоров' },
              { _id: '5', displayName: 'Мария Козлова' }
            ],
            lastMessage: {
              content: 'Встречаемся в 15:00',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              sender: '4'
            },
            unreadCount: 0
          }
        ]);
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChats();
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        // Update chat list
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

        // Update messages if it's the current chat
        if (selectedChat && selectedChat._id === message.chat) {
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
            
            // Проверяем, нет ли уже такого сообщения
            const messageExists = prev.some(msg => msg._id === message._id);
            if (messageExists) {
              return prev;
            }
            
            return [...prev, message];
          });
        }
      });

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
          const sortedChats = updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
          return sortedChats;
        });
      });

      return () => {
        socket.off('new_message');
        socket.off('chat_updated');
      };
    }
  }, [socket, selectedChat]);

  // Загрузка сообщений для выбранного чата
  useEffect(() => {
    if (selectedChat) {
      const loadMessages = async () => {
        try {
          // Здесь будет API вызов для загрузки сообщений
          // Пока используем моковые данные
          setMessages([
            {
              _id: '1',
              content: 'Привет! Как дела?',
              sender: '2',
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              type: 'text'
            },
            {
              _id: '2',
              content: 'Привет! Всё хорошо, спасибо! А у тебя как?',
              sender: user?._id,
              createdAt: new Date(Date.now() - 3000000).toISOString(),
              type: 'text'
            },
            {
              _id: '3',
              content: 'Отлично! Работаю над новым проектом',
              sender: '2',
              createdAt: new Date(Date.now() - 1800000).toISOString(),
              type: 'text'
            }
          ]);
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [selectedChat, user]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setCurrentView('chat');
  };

  const handleAIChatSelect = () => {
    setCurrentView('aiChat');
  };

  const handleBackToChatList = () => {
    setCurrentView('chatList');
    setSelectedChat(null);
  };

  const handleSendMessage = async (messageContent) => {
    if (!selectedChat || !messageContent.trim()) return;

    try {
      // Create optimistic message
      const optimisticMessage = {
        _id: `temp_${Date.now()}`,
        chat: selectedChat._id,
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

      // Добавляем оптимистичное сообщение в локальное состояние
      setMessages(prev => [...prev, optimisticMessage]);

      // Отправляем через WebSocket
      if (socket && isConnected) {
        sendMessage(selectedChat._id, messageContent);
      }

    } catch (error) {
      console.error('📱 Mobile: Error sending message:', error);
    }
  };

  const handleNewChat = () => {
    // Здесь будет логика создания нового чата
    console.log('Creating new chat');
  };

  return (
    <div className={styles.mobileApp}>
      {currentView === 'chatList' && (
        <MobileChatList
          chats={chats}
          onChatSelect={handleChatSelect}
          onAIChatSelect={handleAIChatSelect}
          onNewChat={handleNewChat}
          currentUser={user}
          isLoading={isLoading}
        />
      )}

      {currentView === 'chat' && selectedChat && (
        <MobileChat
          chat={selectedChat}
          onBackToChatList={handleBackToChatList}
          onSendMessage={handleSendMessage}
          messages={messages}
          currentUser={user}
        />
      )}

      {currentView === 'aiChat' && (
        <div className={styles.aiChatContainer}>
          <AIChatWindow onClose={handleBackToChatList} />
        </div>
      )}
    </div>
  );
};

export default MobileApp;

