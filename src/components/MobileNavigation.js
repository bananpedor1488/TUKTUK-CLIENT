import React, { useState } from 'react';
import { FiMessageCircle, FiUsers, FiUser } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import styles from './MobileNavigation.module.css';

const MobileNavigation = ({ onNavigate, onProfileClick, onWalletClick, isVisible = true }) => {
  const [activeTab, setActiveTab] = useState('messages');

  // УЛЬТРА-ЖЕСТКАЯ ПРОВЕРКА - НЕ РЕНДЕРИТЬ НА ПК НИ ПРИ КАКИХ ОБСТОЯТЕЛЬСТВАХ
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    return null;
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleProfileClick = () => {
    if (onProfileClick) {
      onProfileClick();
    }
  };

  if (!isVisible) return null;

  return (
    <nav className={styles.mobileNavigation}>
      <div className={styles.navContainer}>
        {/* Контакты */}
        <div 
          className={`${styles.navItem} ${activeTab === 'contacts' ? styles.active : ''}`}
          onClick={() => handleTabClick('contacts')}
        >
          <div className={styles.navIcon}>
            <FiUsers size={20} />
          </div>
          <span className={styles.navLabel}>Контакты</span>
        </div>

        {/* Сообщения */}
        <div 
          className={`${styles.navItem} ${activeTab === 'messages' ? styles.active : ''}`}
          onClick={() => handleTabClick('messages')}
        >
          <div className={styles.navIcon}>
            <FiMessageCircle size={20} />
          </div>
          <span className={styles.navLabel}>Сообщения</span>
        </div>

        {/* Кошелёк */}
        <div 
          className={styles.navItem}
          onClick={() => onWalletClick && onWalletClick()}
        >
          <div className={styles.navIcon}>
            <FaCoins size={20} />
          </div>
          <span className={styles.navLabel}>Кошелёк</span>
        </div>

        {/* Профиль */}
        <div 
          className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
          onClick={() => handleProfileClick()}
        >
          <div className={styles.navIcon}>
            <FiUser size={20} />
          </div>
          <span className={styles.navLabel}>Профиль</span>
        </div>
      </div>
    </nav>
  );
};

export default MobileNavigation;
