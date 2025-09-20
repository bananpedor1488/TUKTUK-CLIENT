import React, { useState, useEffect } from 'react';
import { FiCircle } from 'react-icons/fi';
import { formatLastSeen } from '../utils/timeUtils';

/**
 * Professional Online Status Indicator Component
 * Displays user online status with proper formatting and animations
 */
const OnlineStatusIndicator = ({ 
  userId, 
  isOnline, 
  lastSeen, 
  showText = false, 
  size = 'small',
  className = '',
  style = {}
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  // Update time ago display
  useEffect(() => {
    if (!isOnline && lastSeen) {
      const updateTimeAgo = () => {
        const now = new Date();
        const lastSeenDate = lastSeen instanceof Date ? lastSeen : new Date(lastSeen);
        const diffInSeconds = Math.floor((now - lastSeenDate) / 1000);
        
        if (diffInSeconds < 60) {
          setTimeAgo('только что');
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60);
          setTimeAgo(`${minutes} мин назад`);
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600);
          setTimeAgo(`${hours} ч назад`);
        } else {
          const days = Math.floor(diffInSeconds / 86400);
          setTimeAgo(`${days} дн назад`);
        }
      };

      updateTimeAgo();
      const interval = setInterval(updateTimeAgo, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [isOnline, lastSeen]);

  // Size configurations
  const sizeConfig = {
    small: {
      dotSize: 8,
      pulseSize: 12,
      fontSize: '12px'
    },
    medium: {
      dotSize: 10,
      pulseSize: 14,
      fontSize: '14px'
    },
    large: {
      dotSize: 12,
      pulseSize: 16,
      fontSize: '16px'
    }
  };

  const config = sizeConfig[size] || sizeConfig.small;

  // Status colors
  const colors = {
    online: '#10B981',
    offline: '#6B7280',
    text: {
      online: '#10B981',
      offline: '#6B7280'
    }
  };

  return (
    <div 
      className={`online-status-indicator ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        ...style
      }}
    >
      {/* Status dot with pulse animation */}
      <div
        style={{
          position: 'relative',
          width: config.dotSize,
          height: config.dotSize,
          borderRadius: '50%',
          backgroundColor: isOnline ? colors.online : colors.offline,
          transition: 'background-color 0.3s ease'
        }}
      >
        {/* Pulse animation for online users */}
        {isOnline && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: config.pulseSize,
              height: config.pulseSize,
              borderRadius: '50%',
              backgroundColor: colors.online,
              opacity: 0.3,
              animation: 'pulse 2s infinite'
            }}
          />
        )}
      </div>
      
      {/* Status text */}
      {showText && (
        <span
          style={{
            color: isOnline ? colors.text.online : colors.text.offline,
            fontSize: config.fontSize,
            fontWeight: '500',
            transition: 'color 0.3s ease'
          }}
        >
          {isOnline ? 'В сети' : (timeAgo || 'Был давно')}
        </span>
      )}
      
      {/* CSS for pulse animation */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.3;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0.1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  );
};

export default OnlineStatusIndicator;
