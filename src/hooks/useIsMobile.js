import { useState, useEffect } from 'react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    // SSR-safe инициализация
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const checkIsMobile = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      setIsMobile(mobile);
    };

    // Проверяем при монтировании
    checkIsMobile();

    // Добавляем слушатель изменения размера
    window.addEventListener('resize', checkIsMobile);

    // Очищаем слушатель при размонтировании
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  return isMobile;
};

export default useIsMobile;
