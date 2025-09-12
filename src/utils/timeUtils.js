// Утилиты для работы с временем и синхронизации с сервером

let serverTimeOffset = 0; // Разница между временем сервера и клиента в миллисекундах

// Получить текущее время сервера
export const getServerTime = () => {
  return new Date(Date.now() + serverTimeOffset);
};

// Установить смещение времени сервера
export const setServerTimeOffset = (offset) => {
  serverTimeOffset = offset;
};

// Синхронизировать время с сервером
export const syncWithServer = async () => {
  try {
    const startTime = Date.now();
    const apiUrl = process.env.REACT_APP_API_URL || 'https://tuktuk-server.onrender.com/api';
    const response = await fetch(`${apiUrl}/time`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 секунд таймаут
    });
    
    if (response.ok) {
      const data = await response.json();
      const endTime = Date.now();
      const networkDelay = (endTime - startTime) / 2; // Примерная задержка сети
      
      const serverTime = new Date(data.serverTime).getTime();
      const clientTime = startTime + networkDelay;
      
      serverTimeOffset = serverTime - clientTime;
      
      console.log('Время синхронизировано с сервером. Смещение:', serverTimeOffset, 'мс');
      return true;
    }
  } catch (error) {
    console.error('Ошибка синхронизации времени:', error);
  }
  return false;
};

// Форматировать время последнего посещения
export const formatLastSeen = (lastSeen) => {
  if (!lastSeen) return 'Никогда не был в сети';
  
  const now = getServerTime();
  const lastSeenDate = new Date(lastSeen);
  const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInMinutes < 1) {
    return 'Только что';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} мин. назад`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ч. назад`;
  } else if (diffInDays < 7) {
    return `${diffInDays} дн. назад`;
  } else {
    return lastSeenDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: lastSeenDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

// Форматировать время сообщения (точное время)
export const formatMessageTime = (date) => {
  return new Date(date).toLocaleTimeString('ru-RU', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Форматировать время для списка чатов
export const formatChatTime = (date) => {
  const messageDate = new Date(date);
  const now = getServerTime();
  const diffInDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    // Сегодня - показываем только время
    return messageDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffInDays === 1) {
    // Вчера
    return 'Вчера';
  } else if (diffInDays < 7) {
    // На этой неделе - показываем день недели
    return messageDate.toLocaleDateString('ru-RU', { weekday: 'short' });
  } else {
    // Старые сообщения - показываем дату
    return messageDate.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });
  }
};
