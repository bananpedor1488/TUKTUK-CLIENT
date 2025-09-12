import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { FiMoon, FiSun, FiUpload, FiUser } from 'react-icons/fi';

const RegisterProfile = () => {
  const [formData, setFormData] = useState({
    name: '',
    interests: '',
    about: '',
    agree_terms: false,
    agree_privacy: false,
    referral_code: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { registerProfile, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlReferralCode = params.get('ref');
    
    if (urlReferralCode) {
      setFormData(prev => ({
        ...prev,
        referral_code: urlReferralCode.toUpperCase().replace(/\s/g, ''),
      }));
    }
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    let newValue = name === 'agree_terms' || name === 'agree_privacy' ? checked : value;

    // Обработка реферального кода: преобразование в верхний регистр и удаление пробелов
    if (name === 'referral_code') {
      newValue = value.toUpperCase().replace(/\s/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: newValue }));
    setError('');
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, выберите изображение');
      return;
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Имя не может быть пустым');
      return false;
    }

    if (!formData.agree_terms || !formData.agree_privacy) {
      setError('Необходимо согласиться с правилами и политикой конфиденциальности');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const profileFormData = new FormData();

      Object.keys(formData).forEach(key => {
        profileFormData.append(key, formData[key]);
      });

      if (avatar) {
        profileFormData.append('photo', avatar);
      }

      const result = await registerProfile(profileFormData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/chat');
        }, 2000);
      } else {
        setError(result.error || 'Ошибка при создании профиля');
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError(err.response?.data?.error || 'Ошибка при создании профиля');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="success-icon">
              <FiUser size={48} />
            </div>
            <h1 className="auth-title">Профиль создан успешно!</h1>
            <p className="auth-subtitle">Перенаправляем в чат...</p>
          </div>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">Завершение регистрации</h1>
          <p className="auth-subtitle">Расскажите о себе и заполните свой профиль</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group avatar-group">
            <label className="form-label">Аватар</label>
            <div className="avatar-container">
              <div className="avatar-preview">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <FiUser size={32} />
                )}
              </div>
              <label className="avatar-upload-btn">
                <FiUpload size={16} />
                Загрузить аватар
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
              disabled={loading}
                />
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Ваше имя *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`form-input ${error && !formData.name ? 'border-red-500' : ''}`}
              placeholder="Введите ваше имя"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="interests" className="form-label">
              Интересы
            </label>
            <input
              type="text"
              id="interests"
              name="interests"
              value={formData.interests}
              onChange={handleChange}
              className="form-input"
              placeholder="Музыка, спорт, программирование..."
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="about" className="form-label">
              О себе
            </label>
            <textarea
              id="about"
              name="about"
              value={formData.about}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Расскажите немного о себе..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="referral_code" className="form-label">
              Реферальный код (необязательно)
            </label>
            <input
              type="text"
              id="referral_code"
              name="referral_code"
              value={formData.referral_code}
              onChange={handleChange}
              className="form-input"
              placeholder="Введите код друга для получения бонусов"
              disabled={loading}
            />
            <small className="form-help">
              💡 Попросите реферальный код у друга, чтобы получить бонусы при регистрации
            </small>
          </div>

          <div className="form-group">
            <h3 className="form-section-title">Правовые соглашения</h3>
            
            <label className="checkbox-container">
              <input
                type="checkbox"
                name="agree_terms"
                checked={formData.agree_terms}
                onChange={handleChange}
              disabled={loading}
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">
                Я принимаю{' '}
                <Link to="/terms" className="auth-link">
                  Правила пользования
                </Link>
              </span>
            </label>

            <label className="checkbox-container">
              <input
                type="checkbox"
                name="agree_privacy"
                checked={formData.agree_privacy}
                onChange={handleChange}
              disabled={loading}
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">
                Я согласен с{' '}
                <Link to="/privacy" className="auth-link">
                  Политикой конфиденциальности
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full"
              disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner"></div>
                Создание профиля...
              </>
            ) : (
              'Создать профиль'
            )}
          </button>
        </form>

        <div className="flex justify-center mt-4">
          <button
            onClick={toggleTheme}
            className="btn btn-secondary text-sm"
            title={`Переключить на ${theme === 'light' ? 'темную' : 'светлую'} тему`}
          >
            {theme === 'light' ? <FiMoon size={16} /> : <FiSun size={16} />} {theme === 'light' ? 'Темная' : 'Светлая'} тема
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterProfile;
