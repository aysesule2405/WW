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
  revealDelayMs?: number;
};

export default function GameCard({ game, onPlay, revealDelayMs = 0 }: Props) {
  const cardImage = game.gameBg ?? game.thumbnail;

  const gameMeta = (() => {
    if (game.id === 'spirit-drift') return { mode: 'Arcade', duration: '~1 min', vibe: 'Swift & airy' };
    if (game.id === 'delivery-on-the-wind') return { mode: 'Strategy', duration: '~2 min', vibe: 'Cozy routing' };
    return { mode: 'Nurture', duration: '~3 min', vibe: 'Calm progression' };
  })();

  const styles: { [k: string]: React.CSSProperties } = {
    card: {
      background: `linear-gradient(180deg, rgba(240,234,210,0.88), rgba(221,229,182,0.82))`,
      borderRadius: 16,
      border: `1px solid rgba(108,88,76,0.26)`,
      padding: 14,
      width: '100%',
      minHeight: 320,
      boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'stretch',
      transition: 'transform 200ms ease, box-shadow 220ms ease',
      animation: 'card-reveal 560ms cubic-bezier(0.22, 1, 0.36, 1) both',
      animationDelay: `${revealDelayMs}ms`,
    },
    imageWrap: {
      width: '100%',
      height: 145,
      borderRadius: 10,
      background: 'linear-gradient(180deg, rgba(255, 252, 245, 0.98), rgba(245, 236, 214, 0.88))',
      border: '1px solid rgba(108,88,76,0.18)',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      boxSizing: 'border-box',
    },
    image: {
      width: '100%',
      height: '100%',
      objectFit: 'contain' as const,
      objectPosition: 'center',
      display: 'block',
    },
    badgesRow: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: 6,
      alignItems: 'center',
    },
    badge: {
      borderRadius: 999,
      border: '1px solid rgba(108,88,76,0.25)',
      background: 'rgba(255,255,255,0.56)',
      color: palette.accent,
      fontFamily: bodyFontFamily,
      fontSize: 13,
      lineHeight: 1,
      padding: '6px 8px',
      letterSpacing: 0.15,
    },
    title: {
      margin: 0,
      color: palette.accent,
      fontSize: 26,
      fontWeight: 700,
      fontFamily: headingFontFamily,
      lineHeight: 1,
    },
    description: {
      margin: 0,
      color: palette.accent,
      fontSize: 17,
      textAlign: 'left' as const,
      opacity: 0.95,
      lineHeight: 1.35,
      letterSpacing: 0.2,
      fontFamily: bodyFontFamily,
      flexGrow: 1,
    },
    footerRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
      marginTop: 'auto',
      flexWrap: 'wrap' as const,
    },
    statusPill: {
      borderRadius: 999,
      border: '1px solid rgba(108,88,76,0.3)',
      background: game.available ? 'rgba(173,193,120,0.35)' : 'rgba(169,132,103,0.24)',
      color: palette.accent,
      fontFamily: bodyFontFamily,
      fontSize: 14,
      padding: '6px 9px',
      lineHeight: 1,
    },
    button: {
      background: palette.bark,
      color: palette.paper,
      border: 'none',
      borderRadius: 9,
      padding: '8px 13px',
      cursor: 'pointer',
      fontWeight: 700,
      fontFamily: bodyFontFamily,
      fontSize: 17,
      letterSpacing: 0.2,
      lineHeight: 1.1,
      transition: 'transform 120ms ease, filter 120ms ease, box-shadow 120ms ease',
      boxShadow: '0 6px 14px rgba(108,88,76,0.3)',
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
        el.style.boxShadow = '0 10px 24px rgba(0,0,0,0.1)';
      }}
    >
      <div style={styles.imageWrap}>
        {cardImage ? (
          <img src={cardImage} alt={game.title} style={styles.image} />
        ) : (
          <div style={{ ...styles.image, display: 'flex', alignItems: 'center', justifyContent: 'center', color: palette.accent, fontFamily: headingFontFamily }}>
            {game.title}
          </div>
        )}
      </div>

      <div style={styles.badgesRow}>
        <span style={styles.badge}>{gameMeta.mode}</span>
        <span style={styles.badge}>{gameMeta.duration}</span>
        <span style={styles.badge}>{gameMeta.vibe}</span>
      </div>

      <h3 style={styles.title}>{game.title}</h3>
      <p style={styles.description}>{game.description}</p>

      <div style={styles.footerRow}>
        <span style={styles.statusPill}>{game.available ? 'Ready to play' : 'In development'}</span>
        {game.available ? (
          <button
            style={styles.button}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(1px) scale(0.98)';
              el.style.filter = 'brightness(0.94)';
            }}
            onMouseUp={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0) scale(1)';
              el.style.filter = 'brightness(1)';
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(0) scale(1)';
              el.style.filter = 'brightness(1)';
            }}
            onClick={() => onPlay?.(game.id)}
          >
            Launch
          </button>
        ) : (
          <div style={styles.comingSoon}>Coming Soon</div>
        )}
      </div>
    </div>
  );
}
