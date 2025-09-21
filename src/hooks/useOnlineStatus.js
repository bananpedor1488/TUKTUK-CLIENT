import { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../services/axiosConfig';

/**
 * Professional Online Status Management Hook
 * Handles user online/offline status with optimized state management
 */
const useOnlineStatus = (socket) => {
  // State management
  const [onlineUsers, setOnlineUsers] = useState(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  
  // Refs for optimization
  const heartbeatIntervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);
  const debounceTimeoutRef = useRef(null);
  const pendingUserIdsRef = useRef(new Set());
  
  // Configuration
  const config = {
    heartbeatInterval: 30000, // 30 seconds
    retryDelay: 1000,
    maxRetries: 3,
    syncTimeout: 5000,
    debounceDelay: 2000 // 2 seconds debounce for API calls
  };

  /**
   * Update user status in local state
   */
  const updateUserStatus = useCallback((userId, status) => {
    setOnlineUsers(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        ...status,
        lastSeen: status.lastSeen ? new Date(status.lastSeen) : null,
        updatedAt: new Date()
      });
      return newMap;
    });
  }, []);

  /**
   * Debounced version of fetchOnlineStatus to prevent spam
   */
  const debouncedFetchOnlineStatus = useCallback((userIds) => {
    // Add userIds to pending set
    userIds.forEach(id => pendingUserIdsRef.current.add(id));
    
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      const userIdsToFetch = Array.from(pendingUserIdsRef.current);
      pendingUserIdsRef.current.clear();
      
      if (userIdsToFetch.length > 0) {
        console.log(`🔄 Debounced fetch for ${userIdsToFetch.length} users`);
        fetchOnlineStatus(userIdsToFetch);
      }
    }, config.debounceDelay);
  }, []);

  /**
   * Fetch online status for multiple users via API
   */
  const fetchOnlineStatus = useCallback(async (userIds, retryCount = 0) => {
    if (!userIds || userIds.length === 0) return {};
    
    try {
      console.log(`🔄 Fetching online status for ${userIds.length} users`);
      
      const response = await axios.get('/users/online-status', {
        params: { userIds: userIds.join(',') },
        timeout: config.syncTimeout
      });

      if (response.status === 200) {
        const statusMap = response.data;
        console.log('✅ Online status received:', Object.keys(statusMap).length, 'users');
        
        // Update local state
        Object.entries(statusMap).forEach(([userId, status]) => {
          updateUserStatus(userId, status);
        });
        
        setLastSyncTime(new Date());
        return statusMap;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching online status:', error);
      
      // Retry mechanism
      if (retryCount < config.maxRetries) {
        console.log(`🔄 Retrying online status fetch, attempt ${retryCount + 1}`);
        retryTimeoutRef.current = setTimeout(() => {
          fetchOnlineStatus(userIds, retryCount + 1);
        }, config.retryDelay * (retryCount + 1));
      }
    }
    return {};
  }, [updateUserStatus, config]);

  /**
   * Refresh status for all users from chats
   */
  const refreshAllUsersStatus = useCallback(async (chats) => {
    if (!chats || chats.length === 0) return;
    
    const allUserIds = new Set();
    
    // Collect all user IDs from chats
    chats.forEach(chat => {
      if (chat.participants) {
        chat.participants.forEach(participant => {
          if (participant && participant._id) {
            allUserIds.add(participant._id);
          }
        });
      }
    });
    
    if (allUserIds.size > 0) {
      console.log(`🔄 Refreshing status for ${allUserIds.size} users from chats`);
      debouncedFetchOnlineStatus(Array.from(allUserIds));
    }
  }, [debouncedFetchOnlineStatus]);

  /**
   * Send heartbeat to server
   */
  const sendHeartbeat = useCallback(() => {
    if (socket && socket.connected) {
      socket.emit('user-activity');
    }
  }, [socket]);

  /**
   * Get user status
   */
  const getUserStatus = useCallback((userId) => {
    return onlineUsers.get(userId) || { 
      isOnline: false, 
      lastSeen: null, 
      username: null 
    };
  }, [onlineUsers]);

  /**
   * Check if user is online
   */
  const isUserOnline = useCallback((userId) => {
    const status = getUserStatus(userId);
    return status.isOnline;
  }, [getUserStatus]);

  /**
   * Get online users count
   */
  const getOnlineUsersCount = useCallback(() => {
    let count = 0;
    onlineUsers.forEach(status => {
      if (status.isOnline) count++;
    });
    return count;
  }, [onlineUsers]);

  /**
   * Get all online users
   */
  const getAllOnlineUsers = useCallback(() => {
    const onlineUsersList = [];
    onlineUsers.forEach((status, userId) => {
      if (status.isOnline) {
        onlineUsersList.push({
          userId,
          username: status.username,
          lastSeen: status.lastSeen
        });
      }
    });
    return onlineUsersList;
  }, [onlineUsers]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('🟢 Socket connected');
      setIsConnected(true);
      
      // Start heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, config.heartbeatInterval);
    };

    const handleDisconnect = () => {
      console.log('🔴 Socket disconnected');
      setIsConnected(false);
      
      // Stop heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };

    const handleUserOnline = (data) => {
      console.log('🟢 User came online:', data.userId, data.username);
      console.log('🟢 Current online users before update:', Array.from(onlineUsers.keys()));
      updateUserStatus(data.userId, {
        username: data.username,
        isOnline: true,
        lastSeen: new Date(data.lastSeen || data.timestamp)
      });
      console.log('🟢 Current online users after update:', Array.from(onlineUsers.keys()));
    };

    const handleUserOffline = (data) => {
      console.log('🔴 User went offline:', data.userId, data.username);
      updateUserStatus(data.userId, {
        username: data.username,
        isOnline: false,
        lastSeen: new Date(data.lastSeen)
      });
    };

    const handleOnlineUsersSync = (data) => {
      console.log('🔄 Syncing online users:', Object.keys(data.users).length);
      Object.entries(data.users).forEach(([userId, status]) => {
        updateUserStatus(userId, status);
      });
      setLastSyncTime(new Date());
    };

    // Register event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('userOnline', handleUserOnline);
    socket.on('userOffline', handleUserOffline);
    socket.on('onlineUsersSync', handleOnlineUsersSync);

    // Cleanup
    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('userOnline', handleUserOnline);
      socket.off('userOffline', handleUserOffline);
      socket.off('onlineUsersSync', handleOnlineUsersSync);
      
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [socket, updateUserStatus, sendHeartbeat, config.heartbeatInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    onlineUsers,
    isConnected,
    lastSyncTime,
    
    // Actions
    fetchOnlineStatus,
    refreshAllUsersStatus,
    updateUserStatus,
    
    // Getters
    getUserStatus,
    isUserOnline,
    getOnlineUsersCount,
    getAllOnlineUsers,
    
    // Stats
    stats: {
      totalUsers: onlineUsers.size,
      onlineCount: getOnlineUsersCount(),
      lastSync: lastSyncTime,
      isConnected
    }
  };
};

export default useOnlineStatus;
