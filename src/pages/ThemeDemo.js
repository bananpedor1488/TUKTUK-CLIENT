import React from 'react';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import styles from './ThemeDemo.module.css';

const ThemeDemo = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Tuk Tuk - Система тем</h1>
        <p className={styles.subtitle}>
          Демонстрация всех доступных тем из konekct frontend
        </p>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Переключатель тем</h2>
          <div className={styles.themeToggleContainer}>
            <ThemeToggle variant="buttons" />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Компактный переключатель</h2>
          <div className={styles.compactContainer}>
            <ThemeToggle variant="compact" />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Switch переключатель</h2>
          <div className={styles.switchContainer}>
            <ThemeToggle variant="switch" />
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Демонстрация стилей</h2>
          <div className={styles.cardsGrid}>
            <div className={`${styles.card} theme-card`}>
              <h3 className={styles.cardTitle}>Карточка с темой</h3>
              <p className={styles.cardText}>
                Эта карточка использует класс .theme-card для автоматического применения текущей темы.
              </p>
              <button className={`${styles.cardButton} theme-button`}>
                Кнопка с темой
              </button>
            </div>

            <div className={`${styles.card} theme-card`}>
              <h3 className={styles.cardTitle}>Blur эффекты</h3>
              <p className={styles.cardText}>
                При выборе темы "Blur Glass" эта карточка получит эффект размытия фона.
              </p>
              <button className={`${styles.cardButton} theme-button`}>
                Blur кнопка
              </button>
            </div>

            <div className={`${styles.card} theme-card`}>
              <h3 className={styles.cardTitle}>Цветовая схема</h3>
              <p className={styles.cardText}>
                Каждая тема имеет свою уникальную цветовую схему и атмосферу.
              </p>
              <button className={`${styles.cardButton} theme-button`}>
                Цветная кнопка
              </button>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Доступные темы</h2>
          <div className={styles.themesList}>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🌙</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Классическая</h4>
                <p className={styles.themeDesc}>Темная тема без эффектов</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>✨</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Blur Glass</h4>
                <p className={styles.themeDesc}>Прозрачная с размытием</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🌃</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Midnight</h4>
                <p className={styles.themeDesc}>Глубокий темно-синий с фиолетовым</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🌊</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Ocean</h4>
                <p className={styles.themeDesc}>Яркий синий с бирюзовым оттенком</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🌅</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Sunset</h4>
                <p className={styles.themeDesc}>Яркий красно-оранжевый закат</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🌲</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Forest</h4>
                <p className={styles.themeDesc}>Яркий зеленый лес</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🌌</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Aurora</h4>
                <p className={styles.themeDesc}>Яркий зелено-голубой северные сияния</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🚀</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Cosmic</h4>
                <p className={styles.themeDesc}>Яркий пурпурно-розовый космос</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>⚡</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Neon</h4>
                <p className={styles.themeDesc}>Яркий электрический синий</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>☕</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Vintage</h4>
                <p className={styles.themeDesc}>Теплый коричнево-золотой</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>💖</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Pickme</h4>
                <p className={styles.themeDesc}>Нежно-розовый приятный</p>
              </div>
            </div>
            <div className={styles.themeItem}>
              <span className={styles.themeEmoji}>🏛️</span>
              <div className={styles.themeInfo}>
                <h4 className={styles.themeName}>Marble</h4>
                <p className={styles.themeDesc}>Элегантная мраморная тема</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;
