import React, { useState, useRef, useEffect } from 'react';
import { FiUser, FiSettings, FiLogOut, FiChevronDown } from 'react-icons/fi';
import { FiArchive } from 'react-icons/fi';
import styles from './UserAvatarDropdown.module.css';

const UserAvatarDropdown = ({ user, onProfileClick, onSettingsClick, onLogout, onArchiveClick, isConnected }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action) => {
    setIsOpen(false);
    if (action === 'profile' && onProfileClick) {
      onProfileClick();
    } else if (action === 'settings' && onSettingsClick) {
      onSettingsClick();
    } else if (action === 'archive' && onArchiveClick) {
      onArchiveClick();
    } else if (action === 'logout' && onLogout) {
      onLogout();
    }
  };

  return (
    <div className={styles.avatarContainer} ref={dropdownRef}>
      {/* Аватар пользователя */}
      <button 
        className={styles.avatarButton}
        onClick={handleAvatarClick}
        title="Меню пользователя"
      >
        <div className={styles.avatar}>
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.displayName || 'Пользователь'} 
              className={styles.avatarImage}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
        <FiChevronDown 
          size={12} 
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} 
        />
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.displayName || 'Пользователь'} 
                    className={styles.userAvatarImage}
                  />
                ) : (
                  <div className={styles.userAvatarPlaceholder}>
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className={styles.userDetails}>
                <div className={styles.userName}>
                  {user?.displayName || 'Пользователь'}
                </div>
                <div className={styles.userStatus}>
                  {isConnected ? 'Онлайн' : 'Офлайн'}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.dropdownMenu}>
            <button 
              className={styles.menuItem}
              onClick={() => handleMenuItemClick('profile')}
            >
              <FiUser size={16} />
              <span>Мой профиль</span>
            </button>

            <button 
              className={styles.menuItem}
              onClick={() => handleMenuItemClick('settings')}
            >
              <FiSettings size={16} />
              <span>Настройки</span>
            </button>

            <button 
              className={styles.menuItem}
              onClick={() => handleMenuItemClick('archive')}
            >
              <FiArchive size={16} />
              <span>Архив чатов</span>
            </button>

            <div className={styles.divider} />

            <button 
              className={`${styles.menuItem} ${styles.logoutItem}`}
              onClick={() => handleMenuItemClick('logout')}
            >
              <FiLogOut size={16} />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAvatarDropdown;
