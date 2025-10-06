import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiCalendar, FiMapPin, FiAtSign, FiPhone, FiVideo } from 'react-icons/fi';
import { FaMeteor } from 'react-icons/fa';
import { FaCoins } from 'react-icons/fa';
import CallService from '../services/CallService';
import axios from '../services/axiosConfig';
import CallModal from './calls/CallModal';
import { useToast } from '../contexts/ToastContext';
import styles from './UserProfileModal.module.css';
import WalletService from '../services/WalletService';

const UserProfileModal = ({ user, isOpen, onClose, isOwnProfile = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'premium'
  const [balance, setBalance] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [creatingPromo, setCreatingPromo] = useState({ type: 'premium', amount: 300 });
  const [isBusy, setIsBusy] = useState(false);
  const [callUI, setCallUI] = useState({ isOpen: false, call: null, isIncoming: false });
  const [profileData, setProfileData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    phone: user?.phone || '',
    birthday: user?.birthday || ''
  });
  const [bannerImage, setBannerImage] = useState(user?.bannerImage || null);

  // Toast helpers (like on mobile)
  const toast = useToast();
  const { success, error } = toast || {};

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startCall = async (type) => {
    try {
      if (!user?._id) return;
      // Create or find private chat with this user
      const chatResp = await axios.post('/chat', { participants: [user._id], type: 'private' });
      const chatId = chatResp?.data?.chat?._id || chatResp?.data?._id;
      if (!chatId) throw new Error('Не удалось открыть чат для звонка');
      // Open outgoing UI immediately here (in case ChatWindow isn't mounted)
      setCallUI({
        isOpen: true,
        isIncoming: false,
        call: {
          _id: null,
          type,
          caller: { _id: 'me' },
          callee: { _id: user._id, username: user.username, displayName: user.displayName, avatar: user.avatar },
          chat: { _id: chatId }
        }
      });
      // Initiate call
      const res = await CallService.initiate({ chatId, type });
      setCallUI(prev => prev.isOpen ? { ...prev, call: { ...prev.call, _id: res.callId } } : prev);
      if (onClose) onClose();
    } catch (e) {
      // Handle 409 by cleanup and retry once
      if (e?.response?.status === 409) {
        try {
          await CallService.cleanup();
          // retry: need chat again if previous failed before chat
          const chatResp2 = await axios.post('/chat', { participants: [user._id], type: 'private' });
          const chatId2 = chatResp2?.data?.chat?._id || chatResp2?.data?._id;
          const res2 = await CallService.initiate({ chatId: chatId2, type });
          setCallUI(prev => prev.isOpen ? { ...prev, call: { ...prev.call, _id: res2.callId } } : prev);
          if (onClose) onClose();
          return;
        } catch (e2) {
          alert(e2?.response?.data?.message || 'Не удалось начать звонок после очистки');
        }
      } else {
        const msg = e?.response?.data?.message || e.message || 'Не удалось начать звонок';
        alert(msg);
      }
      // Close local UI if still failed
      setCallUI({ isOpen: false, call: null, isIncoming: false });
    }
  };

  const handleSave = () => {
    // Здесь будет логика сохранения профиля
    console.log('Сохранение профиля:', profileData);
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const b = await WalletService.getBalance();
        if (typeof b === 'number') setBalance(b);
      } catch {}
    })();
  }, [isOpen]);

  const handleCancel = () => {
    setProfileData({
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      phone: user?.phone || '',
      birthday: user?.birthday || ''
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Профиль пользователя</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <FiX size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Tabs */}
          <div className={styles.editButtons}>
            <button
              className={activeTab === 'info' ? styles.saveButton : styles.cancelButton}
              onClick={() => setActiveTab('info')}
            >
              Профиль
            </button>
            <button
              className={activeTab === 'premium' ? styles.saveButton : styles.cancelButton}
              onClick={() => setActiveTab('premium')}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <FaMeteor /> Premium
              </span>
            </button>
          </div>
          {/* Баннер с оверлеем (аватар + имя) */}
          <div className={styles.bannerContainer}>
            {bannerImage ? (
              <>
                <img src={bannerImage} alt="Banner" className={styles.bannerImage} />
                <div className={styles.bannerShade} />
              </>
            ) : (
              <div className={styles.bannerColorFallback} style={{ background: 'transparent' }} />
            )}
            <div className={styles.bannerOverlay}>
              <div className={styles.avatarContainer}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.displayName} className={styles.avatar} />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {user?.displayName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <h3 className={styles.displayName}>
                <span className={styles.nameRow}>
                  {user?.displayName}
                  {user?.isPremium && (
                    <FaMeteor className={styles.premiumBadge} size={18} />
                  )}
                </span>
              </h3>
              <p
                className={styles.username}
                title="Нажмите, чтобы скопировать"
                onClick={async () => {
                  if (!user?.username) return;
                  const value = `@${user.username}`;
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(value);
                    } else {
                      const ta = document.createElement('textarea');
                      ta.value = value;
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                    }
                  } catch (e) {}
                }}
              >@{user?.username}</p>
            </div>
          </div>

          {/* Управление баннером перенесено в Настройки -> Профиль */}

          {/* Tabs content */}
          {activeTab === 'info' && (
          <div className={styles.profileInfo}>
            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}>Личная информация</h4>
              <div className={styles.infoItem}>
                <FiUser className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Имя</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className={styles.infoInput}
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.displayName}</span>
                  )}
                </div>
              </div>

              {/* Username row under Name */}
              <div className={styles.infoItem}>
                <FiAtSign className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Юзернейм</label>
                  <span className={styles.infoValue}>@{user?.username}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <FiCalendar className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Дата рождения</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={profileData.birthday}
                      onChange={(e) => handleInputChange('birthday', e.target.value)}
                      className={styles.infoInput}
                    />
                  ) : (
                    <span className={styles.infoValue}>
                      {profileData.birthday ? new Date(profileData.birthday).toLocaleDateString('ru-RU') : 'Не указана'}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.infoItem}>
                <FiMapPin className={styles.infoIcon} />
                <div className={styles.infoContent}>
                  <label className={styles.infoLabel}>Местоположение</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profileData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className={styles.infoInput}
                      placeholder="Город, страна"
                    />
                  ) : (
                    <span className={styles.infoValue}>{profileData.location || 'Не указано'}</span>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.infoSection}>
              <h4 className={styles.sectionTitle}>О себе</h4>
              <div className={styles.bioContainer}>
                {isEditing ? (
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className={styles.bioInput}
                    placeholder="Расскажите о себе..."
                    rows={4}
                  />
                ) : (
                  <p className={styles.bioText}>
                    {profileData.bio || 'Пользователь пока не добавил информацию о себе.'}
                  </p>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === 'premium' && (
            <div className={styles.profileInfo}>
              <div className={styles.infoSection}>
                <h4 className={styles.sectionTitle}>Premium и баланс</h4>
                <div className={styles.infoItem}>
                  <FaCoins className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Баланс B‑коинов</div>
                    <div className={styles.infoValue}>
                      {balance} B
                    </div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <FaMeteor className={styles.infoIcon} />
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Premium статус</div>
                    <div className={styles.infoValue} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user?.isPremium ? 'Активен' : 'Не активен'}
                      {!user?.isPremium && (
                        <button
                          className={styles.editButton}
                          disabled={isBusy || balance < 300}
                          onClick={async () => {
                            try {
                              setIsBusy(true);
                              await WalletService.purchasePremium();
                              const b = await WalletService.getBalance();
                              setBalance(b);
                              success && success('Premium активирован');
                            } catch (e) {
                              error && error(e?.response?.data?.message || 'Не удалось активировать Premium');
                            } finally {
                              setIsBusy(false);
                            }
                          }}
                        >
                          Купить за 300 B
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <h4 className={styles.sectionTitle}>Промокоды</h4>
                <div className={styles.infoItem}>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Активировать промокод</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className={styles.infoInput}
                        placeholder="Введите код"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                      />
                      <button
                        className={styles.editButton}
                        disabled={isBusy || !promoCode.trim()}
                        onClick={async () => {
                          try {
                            setIsBusy(true);
                            const res = await WalletService.redeemPromo(promoCode.trim());
                            const b = await WalletService.getBalance();
                            setBalance(b);
                            success && success(res?.message || 'Промокод активирован');
                            setPromoCode('');
                          } catch (e) {
                            error && error(e?.response?.data?.message || 'Не удалось активировать промокод');
                          } finally {
                            setIsBusy(false);
                          }
                        }}
                      >
                        Активировать
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <div className={styles.infoContent}>
                    <div className={styles.infoLabel}>Создать промокод</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <select
                        className={styles.infoInput}
                        value={creatingPromo.type}
                        onChange={(e) => setCreatingPromo(p => ({ ...p, type: e.target.value }))}
                        style={{ maxWidth: 180 }}
                      >
                        <option value="premium">Premium</option>
                        <option value="coins">B‑коины</option>
                      </select>
                      {creatingPromo.type === 'coins' && (
                        <input
                          className={styles.infoInput}
                          type="number"
                          min={1}
                          value={creatingPromo.amount}
                          onChange={(e) => setCreatingPromo(p => ({ ...p, amount: Number(e.target.value) }))}
                          placeholder="Сумма B"
                          style={{ maxWidth: 180 }}
                        />
                      )}
                      <button
                        className={styles.editButton}
                        disabled={isBusy}
                        onClick={async () => {
                          try {
                            setIsBusy(true);
                            const res = await WalletService.createPromo(creatingPromo);
                            success && success(`Создано: ${res?.code || 'код'}`);
                          } catch (e) {
                            error && error(e?.response?.data?.message || 'Не удалось создать промокод');
                          } finally {
                            setIsBusy(false);
                          }
                        }}
                      >
                        Создать
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Edit profile footer removed by request */}
      </div>
    </div>
  );
};

export default UserProfileModal;
