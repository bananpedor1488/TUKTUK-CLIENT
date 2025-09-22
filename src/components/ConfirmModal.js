import React, { useEffect, useState } from 'react';

// Blur-aware, animated confirm modal styled with app CSS variables
const ConfirmModal = ({ open, title, message, onCancel, onConfirm }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) {
      // trigger entrance animation next frame
      const id = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(id);
    } else {
      setIsAnimating(false);
    }
  }, [open]);

  if (!open) return null;

  const backdropStyle = {
    position: 'fixed',
    inset: 0,
    background: isAnimating
      ? 'rgba(0,0,0,0.55)'
      : 'rgba(0,0,0,0)',
    backdropFilter: 'var(--theme-backdrop-filter, blur(0px))',
    WebkitBackdropFilter: 'var(--theme-backdrop-filter, blur(0px))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    transition: 'background-color 220ms ease, backdrop-filter 220ms ease',
  };

  const modalStyle = {
    background: 'var(--theme-background, rgba(255,255,255,0.04))',
    color: 'var(--theme-text-primary, #fff)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 14,
    width: 'min(440px, 92vw)',
    boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
    overflow: 'hidden',
    transform: isAnimating ? 'scale(1)' : 'scale(0.94)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease',
  };

  const headerStyle = {
    padding: '16px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.10)',
    fontWeight: 700,
    letterSpacing: 0.2,
  };

  const contentStyle = {
    padding: 18,
    color: 'var(--theme-text-secondary, #aaa)'
  };

  const footerStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTop: '1px solid rgba(255,255,255,0.08)'
  };

  const btnBase = {
    padding: '10px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'transform 120ms ease, opacity 120ms ease, background 120ms ease, border-color 120ms ease',
  };

  const cancelBtn = {
    ...btnBase,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.18)',
    color: 'var(--theme-text-primary)',
  };

  const dangerBtn = {
    ...btnBase,
    background: 'linear-gradient(135deg, var(--theme-danger, #EF4444), #b91c1c)',
    border: 'none',
    color: '#fff',
  };

  return (
    <div style={backdropStyle} onClick={onCancel}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>{title}</div>
        <div style={contentStyle}>{message}</div>
        <div style={footerStyle}>
          <button
            style={cancelBtn}
            onClick={onCancel}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Отмена
          </button>
          <button
            style={dangerBtn}
            onClick={onConfirm}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
