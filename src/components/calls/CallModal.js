import React from 'react';
import styles from './CallModal.module.css';

// Под стиль приложения: тёмная карточка, акцентные кнопки
const CallModal = ({ isOpen, call, isIncoming, onAccept, onDecline, onEnd }) => {
  if (!isOpen || !call) return null;
  const user = isIncoming ? call.caller : call.callee;
  const title = isIncoming
    ? (call.type === 'video' ? 'Входящий видеозвонок' : 'Входящий звонок')
    : (call.type === 'video' ? 'Исходящий видеозвонок' : 'Исходящий звонок');

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.avatarWrap}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user?.displayName || user?.username || 'Пользователь'} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(user?.displayName || user?.username || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className={styles.title}>{title}</div>
        <div className={styles.userName}>{user?.displayName || user?.username || 'Пользователь'}</div>
        <div className={styles.buttons}>
          {isIncoming ? (
            <>
              <button className={`${styles.btn} ${styles.accept}`} onClick={onAccept}>Принять</button>
              <button className={`${styles.btn} ${styles.decline}`} onClick={onDecline}>Отклонить</button>
            </>
          ) : (
            <button className={`${styles.btn} ${styles.decline}`} onClick={onEnd}>Завершить</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
