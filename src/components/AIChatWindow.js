  import React, { useState, useRef, useEffect } from 'react';
import { FiSend, FiZap, FiUser, FiRefreshCw, FiPlus } from 'react-icons/fi';
import AttachModal from './AttachModal';
import PhotoPreviewModal from './PhotoPreviewModal';
import styles from './AIChatWindow.module.css';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const AIChatWindow = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { logout, isAuthenticated, user } = useAuth();


  // Автоскролл к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // Проверяем авторизацию перед отправкой
    if (!isAuthenticated) {
      const errorMessage = {
        id: Date.now(),
        type: 'ai',
        content: 'Вы не авторизованы. Пожалуйста, войдите в систему.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // No image generation branch; plain AI chat only

    try {
      const response = await axios.post('/ai/chat', {
        messages: [...messages, userMessage]
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.content || 'Извините, не удалось получить ответ от AI.',
        timestamp: response.data.timestamp ? new Date(response.data.timestamp) : new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      
      let errorContent = 'Извините, произошла ошибка при обработке вашего запроса. Попробуйте еще раз.';
      let shouldLogout = false;
      
      if (error.response?.data?.error) {
        errorContent = error.response.data.error;
      } else if (error.response?.status === 429) {
        errorContent = 'Слишком много запросов. Подождите минуту и попробуйте снова.';
      } else if (error.response?.status === 401) {
        errorContent = 'Ошибка авторизации. Попробуйте войти в систему заново.';
        shouldLogout = true;
      } else if (error.response?.status === 400) {
        errorContent = 'Неверный запрос к API. Попробуйте переформулировать вопрос.';
      } else if (error.response?.status === 500) {
        errorContent = 'Ошибка сервера API. Попробуйте позже.';
      } else if (error.response?.status === 503) {
        errorContent = 'Сервис временно недоступен. Попробуйте позже.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: errorContent,
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
      
      // Если ошибка авторизации, предлагаем перелогиниться
      if (shouldLogout) {
        setTimeout(() => {
          const confirmLogout = window.confirm(
            'Ваша сессия истекла. Хотите войти в систему заново?'
          );
          if (confirmLogout) {
            logout();
          }
        }, 2000);
      }
    } finally {
      setIsLoading(false);
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
        // Send message with photo to AI
        const userMessage = {
          id: Date.now(),
          type: 'user',
          content: caption || '',
          imageUrl: uploadResponse.data.imageUrl,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Send to AI with image
        const response = await axios.post('/ai/chat', {
          messages: [...messages, userMessage]
        });

        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.content || 'Извините, не удалось получить ответ от AI.',
          timestamp: response.data.timestamp ? new Date(response.data.timestamp) : new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Clear states
        setSelectedFile(null);
        setShowPhotoPreview(false);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error sending photo:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка нажатия Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Очистка чата
  const clearChat = () => {
    setMessages([]);
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return '--:--';
      }
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (error) {
      console.error('Ошибка форматирования времени:', error);
      return '--:--';
    }
  };

  return (
    <div className={styles.chatWindow}>
      {/* Заголовок чата */}
      <div className={styles.chatHeader}>
        <div className={styles.headerInfo}>
          <div className={styles.aiIcon}>
            <FiZap size={24} />
          </div>
          <div>
            <h2 className={styles.title}>AI Ассистент</h2>
            <p className={styles.subtitle}>
              Google Gemini 2.0 Flash
              {isAuthenticated && user ? (
                <span className={styles.authStatus}> • Авторизован как {user.displayName || user.username}</span>
              ) : (
                <span className={styles.authStatus}> • Не авторизован</span>
              )}
            </p>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={clearChat} className={styles.actionButton} title="Очистить чат">
            <FiRefreshCw size={18} />
          </button>
          <button onClick={onClose} className={styles.closeButton} title="Закрыть">
            ×
          </button>
        </div>
      </div>

      {/* Сообщения */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FiZap size={48} />
            </div>
            <h3>Привет! Я ваш AI-ассистент</h3>
            <p>Могу ответить на любые вопросы.</p>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`${styles.message} ${styles[message.type]} ${message.isError ? styles.error : ''}`}
              >
                <div className={styles.messageAvatar}>
                  {message.type === 'user' ? (
                    <FiUser size={16} />
                  ) : (
                    <FiZap size={16} />
                  )}
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.messageText}>
                    {message.imageUrl ? (
                      <img src={message.imageUrl} alt="AI" style={{ maxWidth: '100%', borderRadius: 12, display: 'block' }} />
                    ) : (
                      message.content
                    )}
                  </div>
                  <div className={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.ai}`}>
                <div className={styles.messageAvatar}>
                  <FiZap size={16} />
                </div>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Поле ввода */}
      <div className={styles.inputContainer}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className={styles.messageForm}>
          <div className={styles.inputWrapper}>
            <button
              type="button"
              className={styles.attachButton}
              title="Прикрепить файл"
              onClick={() => setShowAttachModal(true)}
            >
              <FiPlus size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={'Напишите сообщение...'}
              className={styles.messageInput}
              rows={1}
              disabled={isLoading}
            />
            <button 
              type="submit"
              className={styles.sendButton}
              disabled={!inputMessage.trim() || isLoading}
            >
              <FiSend size={18} />
            </button>
          </div>
        </form>
      </div>

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

export default AIChatWindow;


