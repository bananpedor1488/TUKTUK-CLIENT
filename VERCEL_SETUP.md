# Vercel Environment Variables Setup

Для правильной работы приложения в Vercel необходимо настроить следующие переменные окружения:

## В панели Vercel (Settings > Environment Variables):

1. **REACT_APP_API_URL** - URL вашего API сервера
   - Пример: `https://your-api-server.vercel.app/api`
   - Или: `https://your-backend-domain.com/api`

2. **REACT_APP_SOCKET_URL** - URL для WebSocket соединения
   - Пример: `https://your-api-server.vercel.app`
   - Или: `https://your-backend-domain.com`

3. **GENERATE_SOURCEMAP** - Отключить генерацию source maps для продакшена
   - Значение: `false`

## Локальная разработка:

Создайте файл `.env.local` в корне проекта:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
GENERATE_SOURCEMAP=false
```

## Проверка:

После настройки переменных окружения:
1. Перезапустите деплой в Vercel
2. Откройте `/debug` для проверки статуса аутентификации
3. Проверьте консоль браузера на наличие ошибок

## Отладка:

- Откройте `/debug` для просмотра статуса аутентификации
- Проверьте консоль браузера на наличие ошибок API
- Убедитесь, что API сервер доступен и работает
