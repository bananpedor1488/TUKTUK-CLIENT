import React, { useEffect, useRef, useState } from 'react';
import styles from './EmojiSelect.module.css';

const DEFAULT_OPTIONS = ['❤️','👍','😂','🔥','👏','💯','😮','😢','😎','🙏','🤯'];

const EmojiSelect = ({ value, onChange, options = DEFAULT_OPTIONS, label = 'Быстрая реакция' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const handleSelect = (emoji) => {
    if (onChange) onChange(emoji);
    setOpen(false);
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={`${styles.button} ${open ? 'open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.currentEmoji}>{value || options[0]}</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.arrow}>▾</span>
      </button>

      {open && (
        <div role="listbox" className={styles.menu}>
          {options.map((em) => (
            <button
              key={em}
              type="button"
              role="option"
              aria-selected={em === value}
              className={`${styles.option} ${em === value ? 'active' : ''}`}
              onClick={() => handleSelect(em)}
              title={em}
            >
              <span className={styles.currentEmoji}>{em}</span>
              <span className={styles.label}>{em}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmojiSelect;
