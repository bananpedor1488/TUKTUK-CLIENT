import React, { useEffect, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { FaCoins, FaMeteor, FaWallet, FaPlus, FaChevronDown } from 'react-icons/fa';
import WalletService from '../services/WalletService';
import styles from './MobileWalletPage.module.css';
import { useToast } from '../contexts/ToastContext';

const MobileWalletPage = ({ isOpen, onClose, user }) => {
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const [promo, setPromo] = useState('');
  const [createType, setCreateType] = useState('premium');
  const [createAmount, setCreateAmount] = useState(300);
  const [grantAmount, setGrantAmount] = useState(100);
  const [grantMode, setGrantMode] = useState('add');
  const [currency, setCurrency] = useState('kballs');
  const [tabsIndex, setTabsIndex] = useState(0);
  const [howOpen, setHowOpen] = useState(false);
  const toast = useToast();
  const { success, error } = toast || {};

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
        {/* Hero Баланс */}
        <section className={styles.hero}>
          <div className={styles.heroHead}>
            <FaCoins />
            <div>
              <div className={styles.caption}>Баланс</div>
              <div className={styles.valueBig}>{balance} B</div>
            </div>
          </div>
          <div className={styles.circleActions}>
            <div className={styles.circleItem}><div className={styles.circleIcon}><FaWallet /></div><div className={styles.circleLabel}>Оплатить</div></div>
            <div className={styles.circleItem}><div className={styles.circleIcon}><FaPlus /></div><div className={styles.circleLabel}>Пополнить</div></div>
            <div className={styles.circleItem}><div className={styles.circleIcon}><FaMeteor /></div><div className={styles.circleLabel}>Перевести</div></div>
          </div>
          <div className={styles.heroFooter}>
            <div className={styles.pillToggle}>
              <div className={`${styles.pillBtn} ${currency==='kballs'?styles.pillBtnActive:''}`} onClick={()=>setCurrency('kballs')}>Kballs</div>
              <div className={`${styles.pillBtn} ${currency==='mcoin'?styles.pillBtnActive:''}`} onClick={()=>setCurrency('mcoin')}>MCoin</div>
            </div>
          </div>
        </section>

        {/* Админ: массовая выдача монет */}
        {String(user?.username || '').toLowerCase() === 'admin' && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Админ · Выдача монет всем</h3>
            </div>
            <div className={styles.sectionBody}>
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
                  style={{ maxWidth: 140 }}
                />
                <button
                  className={styles.buttonPrimary}
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      await WalletService.grantToAll(grantAmount, grantMode);
                      const b = await WalletService.getBalance();
                      setBalance(typeof b === 'number' ? b : (b?.balance ?? 0));
                      success && success(`Выдано всем: ${grantAmount} B (${grantMode})`);
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
          </section>
        )}

        

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
                    res?.code && success && success(`Промокод создан: ${res.code}`);
                  } catch (e) {
                    error && error(e?.response?.data?.message || 'Не удалось создать промокод');
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
