import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import styles from './ChatSearch.module.css';

const ChatSearch = ({ messages, onClose, isOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  // const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const searchInputRef = useRef(null);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Поиск по сообщениям
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(0);
      setHighlightedMessageId(null);
      return;
    }

    const results = messages
      .filter(message => 
        message.type === 'text' && 
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(message => ({
        ...message,
        index: messages.indexOf(message)
      }));

    setSearchResults(results);
    setCurrentResultIndex(0);
    
    if (results.length > 0) {
      setHighlightedMessageId(results[0]._id);
    }
  }, [searchQuery, messages]);

  // Обработка клавиш
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults.length > 0) {
        scrollToMessage(searchResults[currentResultIndex]._id);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCurrentResultIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCurrentResultIndex(prev => 
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    }
  };

  // Обновление подсвеченного сообщения при изменении индекса
  useEffect(() => {
    if (searchResults.length > 0) {
      setHighlightedMessageId(searchResults[currentResultIndex]._id);
    }
  }, [currentResultIndex, searchResults]);

  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Подсвечиваем сообщение
      messageElement.classList.add(styles.highlighted);
      setTimeout(() => {
        messageElement.classList.remove(styles.highlighted);
      }, 2000);
    }
  };

  const handleResultClick = (messageId) => {
    scrollToMessage(messageId);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(0);
    setHighlightedMessageId(null);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.searchOverlay}>
      <div className={styles.searchContainer}>
        <div className={styles.searchHeader}>
          <div className={styles.searchInputContainer}>
            <FiSearch className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Поиск по сообщениям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button 
                onClick={clearSearch}
                className={styles.clearButton}
              >
                <FiX size={16} />
              </button>
            )}
          </div>
          <button 
            onClick={onClose}
            className={styles.closeButton}
          >
            <FiX size={20} />
          </button>
        </div>

        {searchQuery && (
          <div className={styles.searchResults}>
            <div className={styles.resultsHeader}>
              <span className={styles.resultsCount}>
                {searchResults.length} {searchResults.length === 1 ? 'результат' : 'результатов'}
              </span>
              {searchResults.length > 0 && (
                <div className={styles.navigationButtons}>
                  <button
                    onClick={() => setCurrentResultIndex(prev => 
                      prev > 0 ? prev - 1 : searchResults.length - 1
                    )}
                    className={styles.navButton}
                    disabled={searchResults.length === 0}
                  >
                    <FiChevronUp size={16} />
                  </button>
                  <span className={styles.navCounter}>
                    {currentResultIndex + 1} / {searchResults.length}
                  </span>
                  <button
                    onClick={() => setCurrentResultIndex(prev => 
                      prev < searchResults.length - 1 ? prev + 1 : 0
                    )}
                    className={styles.navButton}
                    disabled={searchResults.length === 0}
                  >
                    <FiChevronDown size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className={styles.resultsList}>
              {searchResults.map((result, index) => (
                <div
                  key={result._id}
                  className={`${styles.resultItem} ${
                    index === currentResultIndex ? styles.active : ''
                  }`}
                  onClick={() => handleResultClick(result._id)}
                >
                  <div className={styles.resultContent}>
                    <p className={styles.resultText}>
                      {result.content}
                    </p>
                    <span className={styles.resultTime}>
                      {new Date(result.createdAt).toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {searchResults.length === 0 && searchQuery && (
              <div className={styles.noResults}>
                <p>Сообщения не найдены</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSearch;
