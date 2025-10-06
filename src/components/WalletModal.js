import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import WalletService from '../services/WalletService';
import styles from './WalletModal.module.css';

const WalletModal = ({ isOpen, onClose, user }) => {
  const [balance, setBalance] = useState(0);
  const [promo, setPromo] = useState('');
  const [busy, setBusy] = useState(false);
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantMode, setGrantMode] = useState('add');

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

          {String(user?.username || '').toLowerCase() === 'admin' && (
            <div>
              <div className={styles.label}>Админ: Выдать монеты всем</div>
              <div className={styles.row}>
                <select
                  className={styles.input}
                  value={grantMode}
                  onChange={(e) => setGrantMode(e.target.value)}
                  style={{ maxWidth: 140 }}
                >
                  <option value="add">Добавить</option>
                  <option value="set">Установить</option>
                </select>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(Number(e.target.value))}
                  style={{ maxWidth: 140 }}
                />
                <button
                  className={styles.button}
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await WalletService.grantToAll(grantAmount, grantMode);
                      const b = await WalletService.getBalance();
                      setBalance(b);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Выдать всем
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
