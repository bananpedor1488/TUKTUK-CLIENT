import React, { useEffect, useState } from 'react';
import { FaCoins, FaMeteor } from 'react-icons/fa';
import { FiArrowLeft } from 'react-icons/fi';
import WalletService from '../services/WalletService';
import { useToast } from '../contexts/ToastContext';
import styles from './WalletPage.module.css';

const WalletPage = ({ onClose, user }) => {
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [promo, setPromo] = useState('');
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantMode, setGrantMode] = useState('add');
  const [createType, setCreateType] = useState('premium');
  const [createAmount, setCreateAmount] = useState(300);
  const toast = useToast();
  const { success, error } = toast || {};

  useEffect(() => {
    (async () => {
      try {
        const res = await WalletService.getBalance();
        setBalance(typeof res === 'number' ? res : (res?.balance ?? 0));
      } catch {}
    })();
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <button onClick={onClose} className={styles.actionBtn}>
            <FiArrowLeft />
          </button>
          <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Кошелёк</h3>
        </div>
      </div>

      <div className={styles.content}>
        {/* Hero баланс */}
        <section className={styles.hero}>
          <div className={styles.heroHead}>
            <FaCoins size={22} />
            <div>
              <div className={styles.caption}>Баланс</div>
              <div className={styles.valueBig}>{balance} B</div>
            </div>
          </div>
          <div className={styles.actions}>
            {!user?.isPremium && (
              <button
                className={`${styles.actionBtn} ${styles.primary}`}
                disabled={busy || balance < 300}
                onClick={async () => {
                  try {
                    setBusy(true);
                    await WalletService.purchasePremium();
                    const b = await WalletService.getBalance();
                    setBalance(typeof b === 'number' ? b : (b?.balance ?? 0));
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
        </section>

        {/* Сетка из двух карточек: Промокод / Создать промокод (для админа) */}
        <div className={styles.grid}>
          <section className={styles.card}>
            <h4 className={styles.sectionTitle}>Активировать промокод</h4>
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="Введите промокод"
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
                    setBalance(typeof b === 'number' ? b : (b?.balance ?? 0));
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
          </section>

          <section className={styles.card}>
            <h4 className={styles.sectionTitle}>Создать промокод</h4>
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
                  style={{ maxWidth: 160 }}
                />
              )}
              <button
                className={styles.button}
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    const res = await WalletService.createPromo({ type: createType, amount: createAmount });
                    res?.code && success && success(`Промокод создан: ${res.code}`);
                  } catch (e) {
                    error && error(e?.response?.data?.message || 'Не удалось создать промокод');
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Создать
              </button>
            </div>
          </section>
        </div>

        {/* Админ блок */}
        {String(user?.username || '').toLowerCase() === 'admin' && (
          <section className={styles.card}>
            <h4 className={styles.sectionTitle}>Админ · Выдача монет всем</h4>
            <div className={styles.row}>
              <select
                className={styles.input}
                value={grantMode}
                onChange={(e) => setGrantMode(e.target.value)}
                style={{ maxWidth: 160 }}
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
                placeholder="Сумма B"
                style={{ maxWidth: 160 }}
              />
              <button
                className={styles.button}
                disabled={busy}
                onClick={async () => {
                  try {
                    setBusy(true);
                    const res = await WalletService.grantToAll(grantAmount, grantMode);
                    const b = await WalletService.getBalance();
                    setBalance(typeof b === 'number' ? b : (b?.balance ?? 0));
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
          </section>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
