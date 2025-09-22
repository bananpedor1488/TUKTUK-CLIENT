import React, { useState } from 'react';
import { FiCheck } from 'react-icons/fi';
import { formatMessageTime } from '../utils/timeUtils';
import { renderMentions } from '../utils/mentionParser';
import styles from './MessageBubble.module.css';
import LinkWarningModal from './LinkWarningModal';

const MessageBubbleWithMentions = ({ 
  message, 
  isOwn, 
  senderName, 
  senderAvatar, 
  disableAnimation = false,
  onMentionClick,
  currentUsername,
  onImageClick,
  onOpenActions, // function(message, event)
  participants = []
}) => {
  const formatTime = (date) => {
    return formatMessageTime(date);
  };

  // Long-press detection (mobile)
  let longPressTimer;
  const handleTouchStart = () => {
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      onOpenActions && onOpenActions(message);
    }, 400);
  };
  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
  };

  const cleanContent = (text) => {
    if (!text) return '';
    // Remove zero-width spaces and trim
    return text.replace(/\u200B/g, '').trim();
  };

  const [linkModal, setLinkModal] = useState({ open: false, url: '' });

  const onLinkClick = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    setLinkModal({ open: true, url });
  };

  const proceedLink = (url) => {
    try { window.open(url, '_blank', 'noopener,noreferrer'); } catch {}
    setLinkModal({ open: false, url: '' });
  };

  const linkifyMentions = (text) => {
    if (!text) return null;
    // Detect http(s) URLs OR bare domains like example.com, site.ru/path
    const urlRegex = /((https?:\/\/[^\s]+)|((?:[a-z0-9-]+\.)+(?:[a-z]{2,})(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?))/gi;
    const parts = [];
    let lastIndex = 0;
    let m;
    while ((m = urlRegex.exec(text)) !== null) {
      const raw = m[0];
      const hasProtocol = /^https?:\/\//i.test(raw);
      const url = hasProtocol ? raw : `https://${raw}`;
      const start = m.index;
      if (start > lastIndex) {
        const before = text.slice(lastIndex, start);
        parts.push(renderMentions(before, handleMentionClick, currentUsername, styles));
      }
      parts.push(
        <a key={`url-${start}`} href={url} onClick={(e) => onLinkClick(e, url)} className={styles.messageLink}>
          {raw}
        </a>
      );
      lastIndex = start + raw.length;
    }
    if (lastIndex < text.length) {
      const tail = text.slice(lastIndex);
      parts.push(renderMentions(tail, handleMentionClick, currentUsername, styles));
    }
    return parts;
  };

  const getMessageContent = () => {
    if (message.isDeleted) {
      return (
        <span className={styles.deletedText}>Сообщение удалено</span>
      );
    }
    switch (message.type) {
      case 'image':
        return message.imageUrl ? (
          <div className={styles.imageContainer}>
            <img 
              src={message.imageUrl} 
              alt="Изображение" 
              className={styles.messageImage}
              onClick={handleImageClick}
            />
            {cleanContent(message.content) && (
              <div 
                className={styles.imageCaption}
              >
                {renderMentions(cleanContent(message.content), handleMentionClick, currentUsername, styles)}
              </div>
            )}
          </div>
        ) : '📷 Изображение';
      case 'file':
        return '📎 Файл';
      case 'audio':
        return '🎵 Аудио';
      case 'video':
        return '🎥 Видео';
      case 'location':
        return '📍 Местоположение';
      case 'contact':
        return '👤 Контакт';
      case 'sticker':
        return '😀 Стикер';
      case 'gif':
        return '🎬 GIF';
      case 'system':
        return message.content;
      default:
        return linkifyMentions(message.content);
    }
  };

  const handleMentionClick = (username, isOwnMention) => {
    if (onMentionClick) {
      onMentionClick(username, isOwnMention);
    }
  };

  const handleImageClick = () => {
    if (!message.imageUrl) return;
    if (onImageClick) {
      onImageClick(message.imageUrl, message.content, message._id);
      return;
    }
    // fallback
    window.open(message.imageUrl, '_blank');
  };

  const getAvatarByUserId = (uid) => {
    const p = participants.find(p => p && (p._id === uid));
    return p?.avatar || null;
  };

  return (
    <div 
      id={`message-${message._id}`}
      className={`${styles.messageContainer} ${isOwn ? styles.own : styles.other}`}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!message.isDeleted) onOpenActions && onOpenActions(message, e);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`${styles.messageBubble} ${isOwn ? styles.own : styles.other} ${disableAnimation ? styles.noAnimation : ''}`}>
        {/* Аватарка */}
        <div className={styles.messageAvatar}>
          {senderAvatar ? (
            <img src={senderAvatar} alt={senderName} />
          ) : (
            <span>{senderName?.charAt(0)?.toUpperCase()}</span>
          )}
        </div>

        {/* Контент сообщения */}
        <div className={styles.messageContent}>
          {/* Реплай превью */}
          {message.replyTo && !message.isDeleted && (
            <div className={styles.replyPreview}>
              <div className={styles.replyLine} />
              <div className={styles.replyBody}>
                <div className={styles.replyAuthor}>{message.replyTo?.sender?.displayName || message.replyTo?.sender?.username || 'Сообщение'}</div>
                <div className={styles.replyText}>
                  {message.replyTo?.type === 'image' ? '📷 Изображение' : cleanContent(message.replyTo?.content || '')}
                </div>
              </div>
            </div>
          )}
          {/* Текст сообщения */}
          <div className={`${styles.messageText} ${message.type === 'image' ? styles.imageMessage : ''}`}>
            {message.type === 'text' ? (
              getMessageContent()
            ) : (
              <span>{getMessageContent()}</span>
            )}
          </div>
          {/* Реакции */}
          {!message.isDeleted && Array.isArray(message.reactions) && message.reactions.length > 0 && (
            <div className={styles.reactionsBar}>
              {(() => {
                const byEmoji = new Map();
                for (const r of message.reactions) {
                  const emoji = r.emoji;
                  const uid = r.user?._id || r.user;
                  const avatar = getAvatarByUserId(uid);
                  if (!byEmoji.has(emoji)) byEmoji.set(emoji, []);
                  byEmoji.get(emoji).push({ uid, avatar });
                }
                return Array.from(byEmoji.entries()).map(([emoji, users]) => (
                  <span key={emoji} className={styles.reactionChip} title={emoji}>
                    <span className={styles.reactionAvatarsStack}>
                      {users.slice(0, 3).map((u, i) => (
                        <span key={u.uid + '-' + i} className={styles.reactionAvatar} style={{ marginLeft: i === 0 ? 0 : -6 }}>
                          {u.avatar ? <img src={u.avatar} alt="reactor" /> : <span className={styles.reactionStub} />}
                        </span>
                      ))}
                    </span>
                    <span className={styles.reactionEmoji}>{emoji}</span>
                    <span className={styles.reactionCount}>{users.length > 1 ? users.length : ''}</span>
                  </span>
                ));
              })()}
            </div>
          )}

          {/* Время сообщения */}
          <div className={styles.messageTime}>
            {formatTime(message.createdAt)}
            {isOwn && (
              <span className={styles.messageStatus}>
                {message.readBy && message.readBy.length > 0 ? (
                  <span className={styles.readStatus}>
                    <FiCheck size={14} />
                    <FiCheck size={14} />
                  </span>
                ) : (
                  <span className={styles.sentStatus}>
                    <FiCheck size={14} />
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      <LinkWarningModal
        open={linkModal.open}
        url={linkModal.url}
        onCancel={() => setLinkModal({ open: false, url: '' })}
        onProceed={proceedLink}
      />
    </div>
  );
};

export default MessageBubbleWithMentions;
