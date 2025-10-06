import React, { useEffect, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { FaCoins, FaMeteor } from 'react-icons/fa';
import WalletService from '../services/WalletService';
import styles from './MobileWalletPage.module.css';

const MobileWalletPage = ({ isOpen, onClose, user }) => {
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [promo, setPromo] = useState('');
  const [createType, setCreateType] = useState('premium');
  const [createAmount, setCreateAmount] = useState(300);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const res = await WalletService.getBalance();
      setBalance(typeof res === 'number' ? res : (res?.balance ?? 0));
    })();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className={styles.walletPage}>
      <div className={styles.header}>
        <button className={styles.closeButton} onClick={onClose}>
          <FiArrowLeft size={22} />
        </button>
        <h1 className={styles.title}>Кошелёк</h1>
        <div style={{ width: 44 }} />
      </div>

      <div className={styles.content}>
        {/* Баланс */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaCoins />
            <h3 className={styles.sectionTitle}>Баланс</h3>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.row}>
              <span className={styles.info}>Ваши B‑коины</span>
              <span className={styles.value}>{balance} B</span>
            </div>
            <div className={styles.row}>
              <span className={styles.badge}>B‑coins • виртуальная валюта</span>
            </div>
          </div>
        </section>

        {/* Premium */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <FaMeteor />
            <h3 className={styles.sectionTitle}>Premium</h3>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.row}>
              <span className={styles.info}>Статус</span>
              <span className={styles.badge}>{user?.isPremium ? 'Активен' : 'Не активен'}</span>
            </div>
            {!user?.isPremium && (
              <div className={styles.row}>
                <button
                  className={styles.buttonPrimary}
                  disabled={busy || balance < 300}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await WalletService.purchasePremium();
                      const b = await WalletService.getBalance();
                      setBalance(typeof b === 'number' ? b : (b?.balance ?? 0));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Купить за 300 B
                </button>
                {balance < 300 && (
                  <span className={styles.info}>Недостаточно средств</span>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Промокоды */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Промокоды</h3>
          </div>
          <div className={styles.sectionBody}>
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="Введите промокод"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
              />
              <button
                className={styles.buttonPrimary}
                disabled={busy || !promo.trim()}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await WalletService.redeemPromo(promo.trim());
                    const b = await WalletService.getBalance();
                    setBalance(typeof b === 'number' ? b : (b?.balance ?? 0));
                    setPromo('');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Активировать
              </button>
            </div>

            <div className={styles.row}>
              <select
                className={styles.input}
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                style={{ maxWidth: 180 }}
              >
                <option value="premium">Premium</option>
                <option value="coins">B‑коины</option>
              </select>
              {createType === 'coins' && (
                <input
                  className={styles.input}
                  type="number"
                  min={1}
                  value={createAmount}
                  onChange={(e) => setCreateAmount(Number(e.target.value))}
                  placeholder="Сумма B"
                  style={{ maxWidth: 140 }}
                />
              )}
              <button
                className={styles.buttonGhost}
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    const res = await WalletService.createPromo({ type: createType, amount: createAmount });
                    if (res?.code) {
                      window.alert(`Создан промокод: ${res.code}`);
                    }
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Создать промокод
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MobileWalletPage;
