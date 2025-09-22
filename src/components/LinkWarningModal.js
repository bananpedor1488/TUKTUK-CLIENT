import React, { useEffect, useState } from 'react';

const makeBackdrop = (isAnimating) => ({
  position: 'fixed', inset: 0,
  background: isAnimating ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
  backdropFilter: isAnimating ? 'var(--theme-backdrop-filter, blur(4px))' : 'blur(0px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2500,
  transition: 'background-color 220ms ease, backdrop-filter 220ms ease'
});
const makeModal = (isAnimating) => ({
  background: 'var(--theme-background, rgba(255,255,255,0.04))',
  color: 'var(--theme-text-primary, #fff)', border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: 14, width: 'min(440px, 92vw)', boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
  transform: isAnimating ? 'scale(1)' : 'scale(0.94)',
  opacity: isAnimating ? 1 : 0,
  transition: 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1), opacity 220ms ease'
});
const header = { padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 10, alignItems: 'center' };
const iconWrap = { width: 28, height: 28, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const content = { padding: 16, color: 'var(--theme-text-secondary, #aaa)', wordBreak: 'break-word' };
const footer = { padding: 14, display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid rgba(255,255,255,0.08)' };
const btn = { padding: '8px 12px', borderRadius: 10, cursor: 'pointer' };
const cancelBtn = { ...btn, background: 'transparent', border: '1px solid rgba(255,255,255,0.18)', color: 'var(--theme-text-primary)' };
const proceedBtn = { ...btn, background: 'linear-gradient(135deg, #cfbcfb, #8a77ba)', border: 'none', color: '#000' };

const DoorIcon = ({ size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 3h9a2 2 0 0 1 2 2v14h-2V5H7v14H5V3z" fill="currentColor" opacity="0.8"/>
    <path d="M15 12h4l-1.5-1.5M19 12l-1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const LinkWarningModal = ({ open, url, onCancel, onProceed }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  useEffect(() => {
    if (open) requestAnimationFrame(() => setIsAnimating(true));
    else setIsAnimating(false);
  }, [open]);
  if (!open) return null;
  return (
    <div style={makeBackdrop(isAnimating)} onClick={onCancel}>
      <div style={makeModal(isAnimating)} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <div style={iconWrap}><DoorIcon /></div>
          <div style={{ fontWeight: 700 }}>Переход по внешней ссылке</div>
        </div>
        <div style={content}>
          TukTuk не гарантирует безопасность внешних сайтов. Вы уверены, что хотите перейти?
          <div style={{ marginTop: 8, color: 'var(--theme-text-primary)' }}>{url}</div>
        </div>
        <div style={footer}>
          <button style={cancelBtn} onClick={onCancel}>Отмена</button>
          <button style={proceedBtn} onClick={() => onProceed?.(url)}>Перейти</button>
        </div>
      </div>
    </div>
  );
};

export default LinkWarningModal;
