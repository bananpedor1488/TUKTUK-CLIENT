import React, { useEffect, useState } from 'react';

const buttonStyle = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 9999,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'var(--theme-main-color, #7c4dff)',
  color: '#fff',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 12,
  boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
  cursor: 'pointer',
};

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar on mobile
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If the app is already installed, don't show
    const installedHandler = () => setVisible(false);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  if (!visible) return null;

  const onInstallClick = async () => {
    try {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // Hide after successful accept
        setVisible(false);
      }
      setDeferredPrompt(null);
    } catch (_) {
      // ignore
    }
  };

  return (
    <button onClick={onInstallClick} style={buttonStyle}>
      Установить приложение
    </button>
  );
}
