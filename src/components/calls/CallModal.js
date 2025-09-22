import React, { useEffect, useMemo, useState } from 'react';
import styles from './CallModal.module.css';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiWifi } from 'react-icons/fi';
import { useSocket } from '../../contexts/SocketContext';
import { attachStatsMonitor } from '../../utils/webrtc';

// Под стиль приложения: тёмная карточка, акцентные кнопки
const CallModal = ({ isOpen, call, isIncoming, onAccept, onDecline, onEnd }) => {
  // Hooks must be at top-level (lint fix)
  const { socket } = useSocket();
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(call?.type === 'audio');

  const [qualityState, setQualityState] = useState({ quality: (call && call.quality) || 4, kbps: 0, loss: 0 });

  const qualityBars = useMemo(() => {
    const q = Math.max(1, Math.min(5, qualityState.quality || 4));
    return new Array(5).fill(0).map((_, i) => i < q);
  }, [qualityState.quality]);

  const emojis = useMemo(() => {
    const pool = ['🔺','🔹','🟢','⭐','❤️','⚡','🍀','🌙','🔥','🎧','🔒','🌈','🛰️','🧿','🧩','🎲'];
    const str = String(call?._id || 'seed');
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return [0,1,2,3].map(k => pool[(h >> (k*5)) % pool.length]);
  }, [call?._id]);

  // Attach real stats monitor when connection accepted and a PC is available
  useEffect(() => {
    if (!isOpen || !call) return;
    if (call.status !== 'accepted') return;
    const pc = window.__tuktukPC; // optional global if set by call flow
    if (!pc) return;
    const stop = attachStatsMonitor(pc, ({ quality, kbps, loss }) => setQualityState({ quality, kbps, loss }));
    return () => stop && stop();
  }, [isOpen, call?.status]);

  if (!isOpen || !call) return null;

  const user = isIncoming ? call.caller : call.callee;
  const title = isIncoming
    ? (call.type === 'video' ? 'Входящий видеозвонок' : 'Входящий звонок')
    : (call.type === 'video' ? 'Исходящий видеозвонок' : 'Исходящий звонок');

  const targetUserId = isIncoming ? call.caller?._id : call.callee?._id;

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      socket?.emit('call-audio-toggle', { callId: call._id, isAudioEnabled: !next, targetUserId });
    } catch {}
  };
  const toggleVideo = () => {
    const next = !videoOff;
    setVideoOff(!videoOff);
    try {
      socket?.emit('call-video-toggle', { callId: call._id, isVideoEnabled: next, targetUserId });
    } catch {}
  };

  

  const handleRetry = () => {
    try {
      const detail = { chatId: call?.chat?._id, type: call?.type };
      window.dispatchEvent(new CustomEvent('tuktuk-call-retry', { detail }));
    } catch {}
  };

  const connected = call.status === 'accepted';

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Top bubble: fingerprint emojis */}
        <div className={styles.topRow}>
          <div className={styles.fingerprintBubble} title="Проверка шифрования">
            {emojis.map((e, i) => <span key={i}>{e}</span>)}
          </div>
        </div>
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

        {/* Status and quality */}
        <div className={styles.statusRow}>
          <div className={styles.statusText}>
            {connected ? 'Соединение установлено' : (call.status === 'busy' ? 'Занято' : 'Соединение…')}
          </div>
          {connected && (
            <div className={styles.quality} title="Качество соединения">
              <FiWifi />
              <div className={styles.bars}>
                {qualityBars.map((on, idx) => (
                  <span key={idx} className={on ? styles.barOn : styles.barOff} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <button className={`${styles.controlBtn} ${muted ? styles.controlOff : ''}`} onClick={toggleMute} title={muted ? 'Включить микрофон' : 'Выключить микрофон'}>
            {muted ? <FiMicOff /> : <FiMic />}
          </button>
          {call.type === 'video' && (
            <button className={`${styles.controlBtn} ${videoOff ? styles.controlOff : ''}`} onClick={toggleVideo} title={videoOff ? 'Включить камеру' : 'Выключить камеру'}>
              {videoOff ? <FiVideoOff /> : <FiVideo />}
            </button>
          )}
        </div>

        <div className={styles.buttons}>
          {isIncoming ? (
            <>
              <button className={`${styles.btn} ${styles.accept}`} onClick={onAccept}>Принять</button>
              <button className={`${styles.btn} ${styles.decline}`} onClick={onDecline}>Отклонить</button>
            </>
          ) : (
            <>
              {call.status === 'busy' ? (
                <button className={`${styles.btn} ${styles.accept}`} onClick={handleRetry}>Повторить</button>
              ) : null}
              <button className={`${styles.btn} ${styles.decline}`} onClick={onEnd}>Завершить</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallModal;
