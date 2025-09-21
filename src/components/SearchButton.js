import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import styles from './SearchButton.module.css';

const SearchButton = ({ onSearch, placeholder = "Поиск чатов...", searchResults = [], onUserSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Закрытие поиска при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        if (onSearch) {
          onSearch('');
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Фокус на input при открытии
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onSearch]);

  const handleSearchClick = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  const handleUserClick = (user) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
    handleClose();
  };

  return (
    <div className={styles.searchContainer} ref={searchRef}>
      {!isOpen ? (
        <button 
          className={styles.searchButton}
          onClick={handleSearchClick}
          title="Поиск чатов"
        >
          <FiSearch size={18} />
        </button>
      ) : (
        <div className={styles.searchFullscreen}>
          <div className={styles.searchHeader}>
            <div className={styles.searchInputContainer}>
              <div className={styles.searchIcon}>
                <FiSearch size={16} />
              </div>
              <input
                ref={inputRef}
                type="text"
                className={styles.searchInput}
                placeholder={placeholder}
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
              />
              <button 
                className={styles.closeButton}
                onClick={handleClose}
                title="Закрыть поиск"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>
          
          {searchQuery && (
            <div className={styles.searchResults}>
              {searchResults.length > 0 ? (
                <div className={styles.resultsList}>
                  {searchResults.map(user => (
                    <div
                      key={user._id}
                      className={styles.resultItem}
                      onClick={() => handleUserClick(user)}
                    >
                      <div className={styles.userAvatar}>
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.displayName} />
                        ) : (
                          <div className={styles.avatarPlaceholder}>
                            {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.userName}>{user.displayName}</div>
                        <div className={styles.userEmail}>@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noResults}>
                  <p>Пользователи не найдены</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchButton;
