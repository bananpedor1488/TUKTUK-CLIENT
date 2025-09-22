import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import useOnlineStatus from '../hooks/useOnlineStatus';
import CallModal from '../components/calls/CallModal';
import CallService from '../services/CallService';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated, accessToken } = useAuth();

  // Use our professional online status hook
  const onlineStatus = useOnlineStatus(socket);

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
  }, [isAuthenticated, accessToken]);

  // Global Call UI state
  const [callUI, setCallUI] = useState({ isOpen: false, call: null, isIncoming: false });

  // Socket events for calls (global)
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (data) => {
      // Open incoming call modal globally
      setCallUI({
        isOpen: true,
        isIncoming: true,
        call: {
          _id: data.callId,
          type: data.type,
          caller: data.caller,
          callee: null,
          chat: data.chat
        }
      });
    };
    const handleInitiated = (data) => {
      // Update outgoing call id if already open
      setCallUI(prev => prev.isOpen && !prev.isIncoming ? { ...prev, call: { ...prev.call, _id: data.callId } } : prev);
    };
    const handleAccepted = ({ callId }) => {
      setCallUI(prev => (prev.call && prev.call._id === callId) ? { ...prev, call: { ...prev.call, status: 'accepted' } } : prev);
    };
    const handleDeclined = ({ callId }) => {
      setCallUI(prev => (prev.call && prev.call._id === callId) ? { isOpen: false, call: null, isIncoming: false } : prev);
    };
    const handleEnded = ({ callId }) => {
      setCallUI(prev => (prev.call && prev.call._id === callId) ? { isOpen: false, call: null, isIncoming: false } : prev);
    };

    socket.on('incomingCall', handleIncoming);
    socket.on('callInitiated', handleInitiated);
    socket.on('callAccepted', handleAccepted);
    socket.on('callDeclined', handleDeclined);
    socket.on('callEnded', handleEnded);

    return () => {
      socket.off('incomingCall', handleIncoming);
      socket.off('callInitiated', handleInitiated);
      socket.off('callAccepted', handleAccepted);
      socket.off('callDeclined', handleDeclined);
      socket.off('callEnded', handleEnded);
    };
  }, [socket]);

  // Global call actions
  const acceptCall = async () => {
    try { if (callUI.call?._id) await CallService.accept(callUI.call._id); } catch (_) {}
  };
  const declineCall = async () => {
    try { if (callUI.call?._id) await CallService.decline(callUI.call._id); } catch (_) {}
    setCallUI({ isOpen: false, call: null, isIncoming: false });
  };
  const endCall = async () => {
    try { if (callUI.call?._id) await CallService.end(callUI.call._id); } catch (_) {}
    setCallUI({ isOpen: false, call: null, isIncoming: false });
  };

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

  const sendMessage = (chatId, contentOrOpts, maybeType = 'text') => {
    if (!(socket && isConnected)) return;
    // Backward compatible: sendMessage(chatId, content, type)
    if (typeof contentOrOpts === 'string') {
      socket.emit('send_message', {
        chatId,
        content: contentOrOpts,
        type: maybeType
      });
      return;
    }
    // New signature: sendMessage(chatId, { content, type, replyTo, imageUrl, fileUrl })
    const { content, type = 'text', replyTo, imageUrl, fileUrl } = contentOrOpts || {};
    socket.emit('send_message', {
      chatId,
      content,
      type,
      replyTo,
      imageUrl,
      fileUrl
    });
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

  const value = {
    // Socket connection
    socket,
    isConnected,
    
    // Chat functions
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    updateStatus,
    // Call UI state exposed for pages if needed
    callUI,
    setCallUI,
    acceptCall,
    declineCall,
    endCall,
    
    // Online status (from our professional hook)
    ...onlineStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
      {/* Global Call Modal */}
      <CallModal
        isOpen={callUI.isOpen}
        call={callUI.call}
        isIncoming={callUI.isIncoming}
        onAccept={acceptCall}
        onDecline={declineCall}
        onEnd={endCall}
      />
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


