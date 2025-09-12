import React, { useState } from 'react';
import { FiMessageCircle, FiUsers, FiSettings, FiMenu } from 'react-icons/fi';
import styles from './DesktopNavigation.module.css';

const DesktopNavigation = ({ onSettingsClick, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [showSidebarMenu, setShowSidebarMenu] = useState(false);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const handleSidebarMenuClick = () => {
    setShowSidebarMenu(!showSidebarMenu);
  };

  const handleSidebarItemClick = (action) => {
    setShowSidebarMenu(false);
    if (action === 'settings') {
      onSettingsClick();
    } else if (onNavigate) {
      onNavigate(action);
    }
  };

  return (
    <>
      {/* Гамбургер-кнопка в левом верхнем углу */}
      <div className={styles.sidebarMenu}>
        <button 
          className={styles.menuButton}
          onClick={handleSidebarMenuClick}
          title="Меню"
        >
          <FiMenu size={20} />
        </button>
        
        {/* Выпадающее меню */}
        {showSidebarMenu && (
          <div className={styles.dropdownMenu}>
            <button 
              className={styles.menuItem}
              onClick={() => handleSidebarItemClick('messages')}
            >
              <FiMessageCircle size={16} />
              Сообщения
            </button>
            <button 
              className={styles.menuItem}
              onClick={() => handleSidebarItemClick('contacts')}
            >
              <FiUsers size={16} />
              Контакты
            </button>
            <button 
              className={styles.menuItem}
              onClick={() => handleSidebarItemClick('settings')}
            >
              <FiSettings size={16} />
              Настройки
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default DesktopNavigation;
