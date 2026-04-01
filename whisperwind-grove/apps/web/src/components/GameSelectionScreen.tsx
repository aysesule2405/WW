import React from 'react';
import GameCard from './GameCard';
import games from './gameData';
import { createGame } from '../game/createGame';
import { useState, useRef, useEffect } from 'react';

const palette = {
  paper: '#F0EAD2',
  leafLight: '#DDE5B6',
  leaf: '#ADC178',
  bark: '#A98467',
  accent: '#6C584C',
};

type Props = {
  onSelect?: (id: string) => void;
};

export const GameSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const phaserParentRef = useRef<HTMLDivElement | null>(null);
  const phaserInstanceRef = useRef<{ start?: () => void; stop?: () => void; destroy?: (force?: boolean) => void } | null>(null);

  useEffect(() => {
    return () => {
      if (phaserInstanceRef.current) {
        phaserInstanceRef.current.destroy?.();
        phaserInstanceRef.current = null;
      }
    };
  }, []);

  // close modal on Escape for a better kiosk UX
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveGame(null);
    };
    if (activeGame) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeGame]);

  useEffect(() => {
    if (!activeGame) return;
    console.log('GameSelection: activeGame ->', activeGame);

    // mount Phaser game into the modal container; ref may not be set immediately after render
    const tryMount = () => {
      const parent = phaserParentRef.current;
      if (!parent) {
        // try again next frame
        requestAnimationFrame(tryMount);
        return;
      }

      try {
        console.log('GameSelection: creating game at', parent);
        const api = createGame(parent as HTMLDivElement);
        phaserInstanceRef.current = api;
        try {
          console.log('GameSelection: starting game');
          api.start?.();
        } catch (sErr) {
          console.error('GameSelection: start() threw', sErr);
        }
        if (onSelect) onSelect(activeGame);
      } catch (err) {
        console.error('GameSelection: createGame failed', err);
        // defer closing modal to avoid state updates during render/effect
        setTimeout(() => setActiveGame(null), 0);
      }
    };

    tryMount();

    // cleanup when modal closed
    return () => {
      if (phaserInstanceRef.current) {
        phaserInstanceRef.current.destroy?.();
        phaserInstanceRef.current = null;
      }
    };
  }, [activeGame, onSelect]);
  const styles: { [k: string]: React.CSSProperties } = {
    root: {
      minHeight: '100vh',
      padding: 40,
      background: `linear-gradient(180deg, ${palette.paper} 0%, ${palette.leafLight} 60%), url('/assets/backgrounds/grove-home.png') center/cover no-repeat`,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
      color: palette.bark,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      alignItems: 'center',
    },
    header: {
      textAlign: 'center' as const,
    },
    title: {
      fontSize: 36,
      margin: 0,
      color: palette.accent,
    },
    subtitle: {
      margin: 0,
      color: palette.bark,
      opacity: 0.9,
      fontSize: 14,
    },
    row: {
      display: 'flex',
      gap: 18,
  justifyContent: 'center',
      alignItems: 'stretch',
  flexWrap: 'wrap' as const,
    },
  };

  return (
    <div style={styles.root}>
      <header style={styles.header}>
        <h1 style={styles.title}>Whisperwind Grove</h1>
        <p style={styles.subtitle}>A kiosk of short, calming mini-games about wind and growth</p>
      </header>

      <div style={styles.row}>
          {games.map((g) => (
            <GameCard
              key={g.id}
              game={g}
              onPlay={(id) => {
                // debug: confirm Play click reached
                console.log('GameSelection: Play clicked', id);
                // If a parent supplied an onSelect handler, delegate navigation to it
                if (onSelect) {
                  onSelect(id);
                  return;
                }
                // Otherwise keep the existing modal fallback behavior
                setActiveGame(id);
              }}
            />
          ))}
      </div>

      {activeGame && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,5,4,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <div style={{ width: 'min(900px, 96vw)', height: 'min(560px, 86vh)', background: '#000000', borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
            <div ref={(el) => { phaserParentRef.current = el; }} style={{ width: '100%', height: '100%' }} />
          </div>
          <button
            onClick={() => {
              // cleanup and close
              if (phaserInstanceRef.current) {
                phaserInstanceRef.current.destroy?.(true);
                phaserInstanceRef.current = null;
              }
              setActiveGame(null);
            }}
            style={{ position: 'fixed', top: 18, right: 18, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#fff' }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default GameSelectionScreen;
