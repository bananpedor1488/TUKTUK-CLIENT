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

        // Online status handlers (SocialSpace approach)
        newSocket.on('onlineUsersSync', (data) => {
          console.log('Syncing online users:', data);
          const usersMap = new Map();
          Object.entries(data.users).forEach(([userId, status]) => {
            usersMap.set(userId, {
              username: status.username,
              isOnline: status.isOnline,
              lastSeen: new Date(status.lastSeen)
            });
          });
          setOnlineUsers(usersMap);
        });

        newSocket.on('userOnline', (data) => {
          console.log('User came online:', data.userId, data.username);
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, {
              username: data.username,
              isOnline: true,
              lastSeen: new Date(data.timestamp)
            });
            return newMap;
          });
        });

        newSocket.on('userOffline', (data) => {
          console.log('User went offline:', data.userId, data.username);
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(data.userId, {
              username: data.username,
              isOnline: false,
              lastSeen: new Date(data.lastSeen)
            });
            return newMap;
          });
        });

        // Heartbeat to keep connection alive (SocialSpace approach)
        const heartbeatInterval = setInterval(() => {
          if (newSocket && newSocket.connected) {
            newSocket.emit('user-activity'); // SocialSpace heartbeat
            newSocket.emit('ping'); // TUKTUK heartbeat
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
    return onlineUsers.get(userId) || { isOnline: false, lastSeen: null };
  };

  const getOnlineUsersCount = () => {
    return onlineUsers.size;
  };

  // Fetch online status via API (SocialSpace approach)
  const fetchOnlineStatus = async (userIds, retryCount = 0) => {
    if (!userIds || userIds.length === 0) return {};
    
    try {
      const token = localStorage.getItem('accessToken');
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      
      console.log(`Fetching online status for users: ${userIds.join(',')}`);
      
      const response = await fetch(`${baseURL}/api/users/online-status?userIds=${userIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statusMap = await response.json();
        console.log('Online status received:', statusMap);
        
        // Update local state
        Object.entries(statusMap).forEach(([userId, status]) => {
          setOnlineUsers(prev => {
            const newMap = new Map(prev);
            newMap.set(userId, {
              username: status.username,
              isOnline: status.isOnline,
              lastSeen: new Date(status.lastSeen)
            });
            return newMap;
          });
        });
        
        return statusMap;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
      
      // Retry mechanism (max 2 attempts)
      if (retryCount < 2) {
        console.log(`Retrying online status fetch, attempt ${retryCount + 1}`);
        setTimeout(() => {
          fetchOnlineStatus(userIds, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential delay
      }
    }
    return {};
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
    getOnlineUsersCount,
    fetchOnlineStatus
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


