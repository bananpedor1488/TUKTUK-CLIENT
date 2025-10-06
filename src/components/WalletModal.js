import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import WalletService from '../services/WalletService';
import styles from './WalletModal.module.css';

const WalletModal = ({ isOpen, onClose }) => {
  const [balance, setBalance] = useState(0);
  const [promo, setPromo] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const b = await WalletService.getBalance();
      setBalance(b);
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h3 className={styles.title}>Кошелёк</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.balanceCard}>
            <FaCoins size={20} />
            <div>
              <div className={styles.label}>Ваш баланс</div>
              <div className={styles.value}>{balance} B</div>
            </div>
          </div>

          <div>
            <div className={styles.label}>Активировать промокод</div>
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="Введите код"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
              />
              <button
                className={styles.button}
                disabled={busy || !promo.trim()}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await WalletService.redeemPromo(promo.trim());
                    const b = await WalletService.getBalance();
                    setBalance(b);
                    setPromo('');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Активировать
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
