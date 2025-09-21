import React, { useEffect, useRef, useMemo } from 'react';
import { FiX, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './ImageViewerModal.module.css';

// Props:
// - isOpen: boolean
// - src, caption: optional single image fallback
// - items: optional array of { src, caption, id }
// - currentIndex: number (required if items provided)
// - onPrev(): navigate to previous item
// - onNext(): navigate to next item
// - onClose(): close viewer
// - onDownload(src): optional
const ImageViewerModal = ({ isOpen, src, caption, items, currentIndex, onPrev, onNext, onClose, onDownload }) => {
  const overlayRef = useRef(null);
  const touchStartRef = useRef(null);

  const activeItem = useMemo(() => {
    if (Array.isArray(items) && typeof currentIndex === 'number' && items.length > 0) {
      const idx = Math.min(Math.max(currentIndex, 0), items.length - 1);
      return items[idx];
    }
    return { src, caption };
  }, [items, currentIndex, src, caption]);
  const canNavigate = Array.isArray(items) && items.length > 1 && typeof currentIndex === 'number';

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (canNavigate) {
        if (e.key === 'ArrowLeft') onPrev?.();
        if (e.key === 'ArrowRight') onNext?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, canNavigate, onPrev, onNext]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose?.();
    }
  };

  // Close on click anywhere outside the image
  const handleModalClick = () => {
    onClose?.();
  };

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = activeItem?.src || src;
      link.download = 'image';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      onDownload?.(activeItem?.src || src);
    }
  };

  // Touch swipe handlers (mobile)
  const handleTouchStart = (e) => {
    if (!canNavigate || !e.touches || e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e) => {
    if (!canNavigate || !touchStartRef.current) return;
    const t = e.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dt = Date.now() - touchStartRef.current.time;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    // Horizontal swipe with reasonable speed and distance
    if (absDx > 50 && absDx > absDy && dt < 600) {
      if (dx > 0) {
        onPrev?.();
      } else {
        onNext?.();
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div
        className={styles.modal}
        onClick={handleModalClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.topBar} onClick={(e) => e.stopPropagation()}>
          <div className={styles.buttonGroup}>
            <button className={styles.iconButton} title="Закрыть" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
              <FiX size={18} />
            </button>
            <button className={styles.iconButton} title="Скачать" onClick={(e) => { e.stopPropagation(); handleDownload(); }}>
              <FiDownload size={18} />
            </button>
          </div>
        </div>
        <div className={styles.imageWrapper}>
          <img src={activeItem?.src || src} alt="image" className={styles.image} onClick={(e) => e.stopPropagation()} />
        </div>
        {(activeItem?.caption || caption) ? (
          <div className={styles.caption} onClick={(e) => e.stopPropagation()}>{activeItem?.caption || caption}</div>
        ) : null}

        {canNavigate && (
          <>
            <button
              className={`${styles.navButton} ${styles.navLeft}`}
              title="Предыдущее"
              onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
            >
              <FiChevronLeft size={22} />
            </button>
            <button
              className={`${styles.navButton} ${styles.navRight}`}
              title="Следующее"
              onClick={(e) => { e.stopPropagation(); onNext?.(); }}
            >
              <FiChevronRight size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageViewerModal;
