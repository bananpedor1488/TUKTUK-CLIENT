import React, { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';
import { FaCoins, FaMeteor } from 'react-icons/fa';
import WalletService from '../services/WalletService';
import { useToast } from '../contexts/ToastContext';
import styles from './WalletModal.module.css';

const WalletModal = ({ isOpen, onClose, user }) => {
  const [balance, setBalance] = useState(0);
  const [promo, setPromo] = useState('');
  const [busy, setBusy] = useState(false);
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantMode, setGrantMode] = useState('add');
  const toast = useToast();
  const { success, error } = toast || {};

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
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={20} />
          </button>
        </div>
        <div className={styles.content}>
          {/* Balance Hero */}
          <div className={styles.balanceHero}>
            <div className={styles.balanceHeader}>
              <FaCoins size={22} />
              <div>
                <div className={styles.balanceCaption}>Баланс</div>
                <div className={styles.balanceValueLarge}>{balance} B</div>
              </div>
            </div>
            <div className={styles.actionsRow}>
              {!user?.isPremium && (
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                  disabled={busy || balance < 300}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await WalletService.purchasePremium();
                      const b = await WalletService.getBalance();
                      setBalance(b);
                      success && success('Premium активирован');
                    } catch (e) {
                      error && error(e?.response?.data?.message || 'Не удалось активировать Premium');
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <FaMeteor /> Купить Premium (300 B)
                </button>
              )}
            </div>
          </div>

          <div>
            <div className={styles.label}>Активация промокода</div>
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
                    const res = await WalletService.redeemPromo(promo.trim());
                    const b = await WalletService.getBalance();
                    setBalance(b);
                    setPromo('');
                    success && success(res?.message || 'Промокод активирован');
                  } catch (e) {
                    error && error(e?.response?.data?.message || 'Не удалось активировать промокод');
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
                      const res = await WalletService.grantToAll(grantAmount, grantMode);
                      const b = await WalletService.getBalance();
                      setBalance(b);
                      success && success(`Выдано всем: ${res?.value ?? grantAmount} B (${res?.mode || grantMode})`);
                    } catch (e) {
                      error && error(e?.response?.data?.message || 'Не удалось выдать монеты');
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
