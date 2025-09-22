import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import styles from './ArchivedChatsModal.module.css';

const ArchivedChatsModal = ({ open, onClose, onUnarchive, onOpenChat }) => {
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
    if (open) load();
  }, [open]);

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

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.title}>Архив чатов</div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
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
                      const me = (chat.participants || []).find(p => p && p._id === chat.createdBy?._id) // try keep
                      const other = (chat.participants || []).find(p => p && p._id !== me?._id) || (chat.participants || [])[0];
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
      </div>
    </div>
  );
};

export default ArchivedChatsModal;
