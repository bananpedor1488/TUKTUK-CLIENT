import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import styles from './ArchivedChatsModal.module.css';

// Desktop sidebar version of archived chats list
const ArchivedChatList = ({ onOpenChat, onUnarchive, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const toast = useToast();
  const { success, error } = toast || {};

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/chat/archived');
      setItems(data?.chats || []);
    } catch (e) {
      console.error('Failed to load archived chats', e);
      error && error('Не удалось загрузить архив', 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnarchive = async (chat) => {
    try {
      await axios.put(`/chat/${chat._id}/archive`, { archived: false });
      setItems(prev => prev.filter(c => c._id !== chat._id));
      success && success('Чат возвращён из архива', 'Готово');
      onUnarchive && onUnarchive(chat);
    } catch (e) {
      console.error('Failed to unarchive chat', e);
      error && error('Не удалось разархивировать', 'Ошибка');
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>Архив чатов</div>
        {onBack && (
          <button className={styles.secondaryBtn} onClick={onBack}>Назад</button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>В архиве пусто</div>
      ) : (
        <ul className={styles.list}>
          {items.map((chat) => {
            const isGroup = chat.type === 'group';
            const name = isGroup
              ? (chat.name || 'Групповой чат')
              : (() => {
                  const other = (chat.participants || []).find(p => p && p._id !== chat.createdBy) || (chat.participants || [])[0];
                  return other?.displayName || other?.username || 'Чат';
                })();
            const avatar = isGroup ? chat.avatar : (() => {
              const other = (chat.participants || []).find(p => p && p._id !== chat.createdBy) || (chat.participants || [])[0];
              return other?.avatar;
            })();
            return (
              <li key={chat._id} className={styles.item}>
                <div className={styles.left}>
                  <div className={styles.avatar}>
                    {avatar ? <img src={avatar} alt={name} /> : <span>{name?.charAt(0)?.toUpperCase()}</span>}
                  </div>
                  <div className={styles.meta}>
                    <div className={styles.name}>{name}</div>
                    <div className={styles.sub}>{isGroup ? 'Группа' : 'Личный чат'}</div>
                  </div>
                </div>
                <div className={styles.actions}>
                  {onOpenChat && (
                    <button className={styles.secondaryBtn} onClick={() => onOpenChat(chat)}>Открыть</button>
                  )}
                  <button className={styles.primaryBtn} onClick={() => handleUnarchive(chat)}>Разархивировать</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ArchivedChatList;
