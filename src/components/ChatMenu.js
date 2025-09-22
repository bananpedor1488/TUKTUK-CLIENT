import React, { useRef, useEffect } from 'react';
import { FiUser, FiArchive, FiTrash2 } from 'react-icons/fi';
import styles from './ChatMenu.module.css';

const ChatMenu = ({ chat, user, onClose, isOpen, onLogout, onOpenProfile }) => {
  const menuRef = useRef(null);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  

  const handleMenuItemClick = (action) => {
    onClose();
    
    switch (action) {
      case 'profile':
        // Открыть профиль собеседника
        onOpenProfile();
        break;
      case 'archive':
        // Архивировать чат
        console.log('Архивировать чат');
        break;
      case 'delete':
        // Удалить чат
        console.log('Удалить чат');
        break;
      default:
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={menuRef} className={styles.menuDropdown}>
      <div className={styles.menuHeader}>
        <h3 className={styles.menuTitle}>Меню чата</h3>
      </div>

      <div className={styles.menuItems}>
        {/* Профиль собеседника */}
        <button
          onClick={() => handleMenuItemClick('profile')}
          className={styles.menuItem}
        >
          <FiUser size={18} />
          <span>Профиль собеседника</span>
        </button>

        {/* Разделитель */}
        <div className={styles.menuDivider} />

        {/* Архивировать чат */}
        <button
          onClick={() => handleMenuItemClick('archive')}
          className={styles.menuItem}
        >
          <FiArchive size={18} />
          <span>Архивировать</span>
        </button>

        {/* Удалить чат */}
        <button
          onClick={() => handleMenuItemClick('delete')}
          className={`${styles.menuItem} ${styles.dangerItem}`}
        >
          <FiTrash2 size={18} />
          <span>Удалить чат</span>
        </button>
      </div>
    </div>
  );
};

export default ChatMenu;
