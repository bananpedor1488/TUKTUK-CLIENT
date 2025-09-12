import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, accessToken } = useAuth();

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      // Проверяем, нужно ли создавать новое соединение
      if (!socket || socket.auth.token !== accessToken) {
        // Закрываем старое соединение, если есть
        if (socket) {
          socket.close();
        }

        const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
          auth: {
            token: accessToken
          },
          transports: ['websocket']
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

        setSocket(newSocket);
      }
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }

    // Cleanup функция
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [isAuthenticated, accessToken, socket]);

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

  const value = {
    socket,
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping
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

