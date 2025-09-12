import React, { useState, useRef, useEffect } from 'react';
import { FiTrash2, FiMoreHorizontal, FiArchive, FiBellOff } from 'react-icons/fi';
import styles from './SwipeableChatItem.module.css';

const SwipeableChatItem = ({ 
  children, 
  onDelete, 
  onArchive, 
  onMute, 
  onMore,
  isMobile = false 
}) => {
  const [isSwiped, setIsSwiped] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const SWIPE_THRESHOLD = 80; // Минимальное расстояние для свайпа

  // Touch обработчики с правильным preventDefault
  const handleTouchStart = (e) => {
    if (!isMobile) return;
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    if (!isMobile || !isDragging) return;
    setIsDragging(false);
    
    if (Math.abs(currentX) > SWIPE_THRESHOLD) {
      setIsSwiped(true);
    } else {
      setIsSwiped(false);
      setCurrentX(0);
    }
  };

  // const handleTouchMove = (e) => {
  //   if (!isMobile || !isDragging) return;
  //   const deltaX = e.touches[0].clientX - startX; // Возвращаем обратно
  //   setCurrentX(deltaX);
    
  //   // Ограничиваем свайп только влево (отрицательные значения)
  //   if (deltaX < 0) {
  //     setIsSwiped(Math.abs(deltaX) > SWIPE_THRESHOLD);
  //   }
  // };

  // const handleMouseDown = (e) => {
  //   // Не обрабатываем свайп на десктопе
  //   return;
  // };

  // const handleMouseMove = (e) => {
  //   // Не обрабатываем свайп на десктопе
  //   return;
  // };

  // const handleMouseUp = () => {
  //   // Не обрабатываем свайп на десктопе
  //   return;
  // };

  const handleRightClick = (e) => {
    e.preventDefault();
    if (onMore) {
      onMore(e);
    }
  };

  const resetSwipe = () => {
    setIsSwiped(false);
    setCurrentX(0);
  };

  // Добавляем обработчики событий
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (isMobile) {
      // Touch события с passive: false для preventDefault
      const touchMoveHandler = (e) => {
        if (!isDragging) return;
        e.preventDefault(); // Теперь это работает
        const deltaX = e.touches[0].clientX - startX; // Возвращаем обратно
        setCurrentX(deltaX);
        
        if (deltaX < 0) {
          setIsSwiped(Math.abs(deltaX) > SWIPE_THRESHOLD);
        }
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', touchMoveHandler, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', touchMoveHandler);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    } else {
      // На десктопе только ПКМ меню, свайп отключен
      container.addEventListener('contextmenu', handleRightClick);
      
      return () => {
        container.removeEventListener('contextmenu', handleRightClick);
      };
    }
  }, [isMobile, isDragging, currentX, startX, handleRightClick, handleTouchEnd, handleTouchStart]);

  return (
    <div className={styles.swipeableContainer}>
      {/* Действия при свайпе - только на мобильных */}
      {isMobile && (
        <div className={`${styles.swipeActions} ${isSwiped ? styles.swipeActionsVisible : ''}`}>
          <button 
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={onDelete}
            title="Удалить чат"
          >
            <FiTrash2 size={18} />
          </button>
          <button 
            className={`${styles.actionButton} ${styles.archiveButton}`}
            onClick={onArchive}
            title="Архивировать"
          >
            <FiArchive size={18} />
          </button>
          <button 
            className={`${styles.actionButton} ${styles.muteButton}`}
            onClick={onMute}
            title="Отключить уведомления"
          >
            <FiBellOff size={18} />
          </button>
          <button 
            className={`${styles.actionButton} ${styles.moreButton}`}
            onClick={onMore}
            title="Еще"
          >
            <FiMoreHorizontal size={18} />
          </button>
        </div>
      )}

      {/* Основной контент */}
      <div
        ref={containerRef}
        className={`${styles.swipeableContent} ${isSwiped ? styles.swiped : ''}`}
        style={{
          transform: `translateX(${isSwiped ? -200 : Math.min(0, currentX)}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
        onClick={resetSwipe}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableChatItem;
