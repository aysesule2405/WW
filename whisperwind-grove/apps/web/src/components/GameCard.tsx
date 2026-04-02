import React from 'react';
import type { GameInfo } from './gameData';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

const palette = {
  paper: '#F0EAD2',
  leafLight: '#DDE5B6',
  leaf: '#ADC178',
  bark: '#A98467',
  accent: '#6C584C',
};

type Props = {
  game: GameInfo;
  onPlay?: (id: string) => void;
};

export default function GameCard({ game, onPlay }: Props) {
  const cardImage = game.gameBg ?? game.thumbnail;

  const styles: { [k: string]: React.CSSProperties } = {
    card: {
      background: `linear-gradient(180deg, ${palette.leafLight}, ${palette.leaf})`,
      borderRadius: 14,
      padding: 16,
      width: 260,
      boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      alignItems: 'center',
    },
    image: {
      width: '100%',
      height: 140,
      objectFit: 'contain' as const,
      objectPosition: 'center',
      borderRadius: 10,
      background: '#fff',
      display: 'block',
    },
    title: {
      margin: 0,
      color: palette.accent,
      fontSize: 18,
      fontWeight: 700,
      fontFamily: headingFontFamily,
    },
    description: {
      margin: 0,
      color: palette.accent,
      fontSize: 15,
      textAlign: 'center' as const,
      opacity: 0.95,
      lineHeight: 1.45,
      letterSpacing: 0.2,
      fontFamily: bodyFontFamily,
    },
    button: {
      background: palette.bark,
      color: palette.paper,
      border: 'none',
      borderRadius: 8,
      padding: '8px 14px',
      cursor: 'pointer',
      fontWeight: 700,
      fontFamily: bodyFontFamily,
      fontSize: 18,
      letterSpacing: 0.2,
      lineHeight: 1.1,
    },
    comingSoon: {
      color: palette.accent,
      fontStyle: 'italic',
      padding: '6px 10px',
      borderRadius: 8,
      border: `1px dashed ${palette.accent}`,
      background: 'transparent',
      fontFamily: bodyFontFamily,
      fontSize: 16,
      letterSpacing: 0.2,
    },
  };

  return (
    <div
      style={styles.card}
      role="button"
      aria-label={`${game.title} card`}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(-6px)';
        el.style.boxShadow = '0 16px 34px rgba(108, 88, 76, 0.2)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
      }}
    >
      <div style={{ width: '100%' }}>
        {cardImage ? (
          <img src={cardImage} alt={game.title} style={styles.image} />
        ) : (
          <div style={{ ...styles.image, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.accent, fontFamily: headingFontFamily }}>
            {game.title}
          </div>
        )}
      </div>

      <h3 style={styles.title}>{game.title}</h3>
      <p style={styles.description}>{game.description}</p>

      {game.available ? (
        <button style={styles.button} onClick={() => onPlay?.(game.id)}>
          Play
        </button>
      ) : (
        <div style={styles.comingSoon}>Coming Soon</div>
      )}
    </div>
  );
}
