import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const { isAuthenticated, accessToken } = useAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Проверяем, нужно ли создавать новое соединение
      if (!socket || socket.auth.token !== accessToken) {
        // Закрываем старое соединение, если есть
        if (socket) {
          socket.close();
        }

        const socketUrl = process.env.REACT_APP_SOCKET_URL || 'https://tuktuk-server.onrender.com';
        const newSocket = io(socketUrl, {
          auth: {
            token: accessToken
          },
          transports: ['websocket', 'polling'], // Добавляем polling как fallback
          timeout: 10000, // 10 секунд таймаут
          forceNew: true // Принудительно создаем новое соединение
        });

        newSocket.on('connect', () => {
          console.log('Connected to server');
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          console.log('Disconnected from server');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          setIsConnected(false);
        });

        // Online status handlers
        newSocket.on('online_users', (users) => {
          const usersMap = new Map();
          users.forEach(user => {
            usersMap.set(user.userId, {
              status: user.status,
              lastSeen: new Date(user.lastSeen)
            });
          });
          setOnlineUsers(usersMap);
        });

        newSocket.on('user_online', (data) => {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, {
              status: data.status,
              lastSeen: new Date(data.lastSeen)
            });
            return newMap;
          });
        });

        newSocket.on('user_offline', (data) => {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.delete(data.userId);
            return newMap;
          });
        });

        newSocket.on('user_status_update', (data) => {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, {
              status: data.status,
              lastSeen: new Date(data.lastSeen)
            });
            return newMap;
          });
        });

        // Heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          if (newSocket && newSocket.connected) {
            newSocket.emit('ping');
          }
        }, 30000); // Ping every 30 seconds

        newSocket.on('pong', () => {
          // Connection is alive
        });

        setSocket(newSocket);
      }
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Map());
      }
    }

    // Cleanup функция
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [isAuthenticated, accessToken]);

  const joinChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit('join_chat', chatId);
    }
  };

  const leaveChat = (chatId) => {
    if (socket && isConnected) {
      socket.emit('leave_chat', chatId);
    }
  };

  const sendMessage = (chatId, content, type = 'text') => {
    if (socket && isConnected) {
      socket.emit('send_message', {
        chatId,
        content,
        type
      });
    }
  };

  const startTyping = (chatId) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { chatId });
    }
  };

  const stopTyping = (chatId) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { chatId });
    }
  };

  const updateStatus = (status) => {
    if (socket && isConnected) {
      socket.emit('update_status', { status });
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const getUserStatus = (userId) => {
    return onlineUsers.get(userId) || { status: 'offline', lastSeen: null };
  };

  const getOnlineUsersCount = () => {
    return onlineUsers.size;
  };

  const value = {
    socket,
    isConnected,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    updateStatus,
    isUserOnline,
    getUserStatus,
    getOnlineUsersCount
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

