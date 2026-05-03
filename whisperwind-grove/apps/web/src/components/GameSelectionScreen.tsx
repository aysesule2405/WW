import React from 'react';
import GameCard from './GameCard';
import games from './gameData';
import { createGame } from '../game/createGame';
import { useState, useRef, useEffect, useMemo } from 'react';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

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

type FilterKey = 'all' | 'playable' | 'coming-soon';

export const GameSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const phaserParentRef = useRef<HTMLDivElement | null>(null);
  const phaserInstanceRef = useRef<{ start?: () => void; stop?: () => void; destroy?: (force?: boolean) => void } | null>(null);
  const parallaxFrameRef = useRef<number | null>(null);

  const playableCount = useMemo(() => games.filter((game) => game.available).length, []);
  const comingSoonCount = games.length - playableCount;
  const featuredGame = useMemo(() => games.find((game) => game.available) ?? games[0], []);
  const visibleGames = useMemo(() => {
    if (filter === 'playable') return games.filter((game) => game.available);
    if (filter === 'coming-soon') return games.filter((game) => !game.available);
    return games;
  }, [filter]);

  useEffect(() => {
    return () => {
      if (phaserInstanceRef.current) {
        phaserInstanceRef.current.destroy?.();
        phaserInstanceRef.current = null;
      }
      if (parallaxFrameRef.current) {
        window.cancelAnimationFrame(parallaxFrameRef.current);
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

  const gamePill = (id: string) => {
    if (id === 'spirit-drift') return 'Wind Chase';
    if (id === 'delivery-on-the-wind') return 'Route Craft';
    return 'Growth Ritual';
  };

  const gameDuration = (id: string) => {
    if (id === 'spirit-drift') return '~1 min run';
    if (id === 'delivery-on-the-wind') return '~2 min route';
    return '~3 min nurture';
  };

  const handleParallaxMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const rx = (e.clientX - bounds.left) / bounds.width;
    const ry = (e.clientY - bounds.top) / bounds.height;
    const next = {
      x: (rx - 0.5) * 1.3,
      y: (ry - 0.5) * 1.3,
    };

    if (parallaxFrameRef.current) {
      window.cancelAnimationFrame(parallaxFrameRef.current);
    }

    parallaxFrameRef.current = window.requestAnimationFrame(() => {
      setParallax(next);
      parallaxFrameRef.current = null;
    });
  };

  const styles: { [k: string]: React.CSSProperties } = {
    root: {
      minHeight: '100vh',
      width: '100vw',
      padding: 28,
      backgroundImage: `radial-gradient(circle at 85% 15%, rgba(173,193,120,0.3), rgba(173,193,120,0) 36%), linear-gradient(180deg, #f6f1de 0%, #e5edd0 52%, #d9e6bf 100%), url('/assets/backgrounds/grove-home.png')`,
      backgroundPosition: `${50 - parallax.x * 1.2}% ${50 - parallax.y * 1.2}%, center, ${50 + parallax.x * 2.1}% ${50 + parallax.y * 2.1}%`,
      backgroundSize: 'cover, cover, auto',
      backgroundRepeat: 'no-repeat, no-repeat, no-repeat',
      fontFamily: bodyFontFamily,
      color: palette.bark,
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      alignItems: 'center',
      boxSizing: 'border-box',
      transition: 'background-position 320ms ease-out',
    },
    shell: {
      width: 'min(1380px, 100%)',
      display: 'grid',
      gap: 16,
    },
    topBar: {
      borderRadius: 16,
      border: '1px solid rgba(108, 88, 76, 0.25)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.7), rgba(250,245,231,0.62))',
      boxShadow: '0 12px 30px rgba(66, 52, 41, 0.12)',
      padding: '12px 14px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
      flexWrap: 'wrap' as const,
    },
    topBarLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },
    orb: {
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: 'radial-gradient(circle at 35% 35%, #f6f3dd 0%, #adc178 72%)',
      border: '1px solid rgba(108,88,76,0.34)',
      boxShadow: '0 0 14px rgba(173,193,120,0.6)',
      animation: 'bloom-pulse 2.6s ease-in-out infinite',
    },
    topBarTitle: {
      margin: 0,
      fontFamily: headingFontFamily,
      color: '#6C584C',
      fontSize: 30,
      lineHeight: 1,
    },
    topBarMeta: {
      margin: 0,
      fontSize: 16,
      color: '#795f4e',
      lineHeight: 1,
    },
    topBarRight: {
      display: 'flex',
      gap: 8,
      alignItems: 'center',
      flexWrap: 'wrap' as const,
    },
    navChip: {
      borderRadius: 999,
      border: '1px solid rgba(108,88,76,0.35)',
      background: 'rgba(253, 248, 238, 0.86)',
      color: '#6C584C',
      padding: '8px 12px',
      fontSize: 15,
      lineHeight: 1,
      letterSpacing: 0.2,
    },
    heroGrid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(300px, 1.6fr) minmax(260px, 1fr)',
      gap: 14,
      alignItems: 'stretch',
    },
    heroCard: {
      borderRadius: 18,
      overflow: 'hidden',
      position: 'relative',
      minHeight: 280,
      border: '1px solid rgba(108, 88, 76, 0.28)',
      boxShadow: '0 16px 32px rgba(58, 45, 36, 0.2)',
      background: `linear-gradient(180deg, rgba(13, 23, 26, 0.25), rgba(13, 23, 26, 0.58)), url('${featuredGame.gameBg ?? featuredGame.thumbnail}') center/cover no-repeat`,
      display: 'flex',
      alignItems: 'flex-end',
    },
    heroContent: {
      width: '100%',
      padding: 18,
      background: 'linear-gradient(180deg, rgba(20,20,20,0), rgba(20,20,20,0.72))',
      color: '#f8efda',
      display: 'grid',
      gap: 8,
    },
    heroPill: {
      borderRadius: 999,
      display: 'inline-block',
      width: 'fit-content',
      background: 'rgba(240, 234, 210, 0.28)',
      border: '1px solid rgba(240, 234, 210, 0.6)',
      padding: '4px 10px',
      fontSize: 14,
      letterSpacing: 0.4,
      textTransform: 'uppercase' as const,
    },
    title: {
      fontSize: 44,
      margin: 0,
      color: palette.accent,
      fontFamily: headingFontFamily,
    },
    subtitle: {
      margin: 0,
      color: '#f8efda',
      opacity: 0.96,
      fontSize: 20,
      letterSpacing: 0.25,
      lineHeight: 1.45,
      fontFamily: bodyFontFamily,
    },
    heroActions: {
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap' as const,
    },
    heroButtonPrimary: {
      borderRadius: 10,
      border: 'none',
      background: '#DDE5B6',
      color: '#3F4D26',
      fontFamily: bodyFontFamily,
      fontSize: 18,
      fontWeight: 700,
      padding: '10px 14px',
      cursor: 'pointer',
      transition: 'transform 120ms ease, filter 120ms ease, box-shadow 120ms ease',
      boxShadow: '0 8px 16px rgba(19, 25, 19, 0.2)',
    },
    heroButtonGhost: {
      borderRadius: 10,
      border: '1px solid rgba(240, 234, 210, 0.7)',
      background: 'rgba(240, 234, 210, 0.08)',
      color: '#f8efda',
      fontFamily: bodyFontFamily,
      fontSize: 17,
      padding: '9px 13px',
    },
    sideStack: {
      display: 'grid',
      gap: 12,
    },
    statPanel: {
      borderRadius: 16,
      border: '1px solid rgba(108, 88, 76, 0.25)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.8), rgba(248,241,224,0.86))',
      boxShadow: '0 10px 24px rgba(74, 57, 44, 0.12)',
      padding: 14,
      display: 'grid',
      gap: 10,
    },
    statTitle: {
      margin: 0,
      fontFamily: headingFontFamily,
      fontSize: 28,
      color: '#6C584C',
      lineHeight: 1,
    },
    statRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    },
    statCell: {
      borderRadius: 10,
      border: '1px solid rgba(108,88,76,0.22)',
      background: 'rgba(255,255,255,0.56)',
      padding: '8px 8px 7px',
      textAlign: 'center' as const,
    },
    statValue: {
      margin: 0,
      color: '#5a4739',
      fontSize: 24,
      lineHeight: 1,
      fontFamily: headingFontFamily,
    },
    statLabel: {
      margin: '4px 0 0',
      color: '#6b5648',
      fontSize: 14,
      lineHeight: 1.2,
    },
    updatePanel: {
      borderRadius: 16,
      border: '1px solid rgba(108, 88, 76, 0.25)',
      background: 'linear-gradient(180deg, rgba(108,88,76,0.86), rgba(83,66,54,0.86))',
      boxShadow: '0 10px 24px rgba(74, 57, 44, 0.18)',
      padding: 14,
      color: '#f3ebd8',
      display: 'grid',
      gap: 8,
    },
    updateTitle: {
      margin: 0,
      fontFamily: headingFontFamily,
      fontSize: 26,
      lineHeight: 1,
    },
    updateText: {
      margin: 0,
      fontSize: 15,
      lineHeight: 1.4,
    },
    updateBadge: {
      width: 'fit-content',
      borderRadius: 999,
      border: '1px solid rgba(243, 235, 216, 0.45)',
      padding: '5px 10px',
      fontSize: 13,
      letterSpacing: 0.25,
      textTransform: 'uppercase' as const,
    },
    controlsBar: {
      borderRadius: 14,
      border: '1px solid rgba(108, 88, 76, 0.22)',
      background: 'rgba(255,255,255,0.66)',
      boxShadow: '0 8px 22px rgba(74,57,44,0.1)',
      padding: '10px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      flexWrap: 'wrap' as const,
    },
    filterGroup: {
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap' as const,
      alignItems: 'center',
    },
    filterButton: {
      borderRadius: 999,
      border: '1px solid rgba(108,88,76,0.3)',
      background: 'rgba(240, 234, 210, 0.65)',
      color: '#6C584C',
      fontFamily: bodyFontFamily,
      fontSize: 16,
      padding: '7px 12px',
      cursor: 'pointer',
      transition: 'transform 120ms ease, filter 120ms ease',
    },
    controlsHint: {
      margin: 0,
      color: '#6C584C',
      fontSize: 15,
      opacity: 0.95,
    },
    row: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: 14,
      alignItems: 'stretch',
    },
    emptyState: {
      borderRadius: 14,
      border: '1px dashed rgba(108,88,76,0.4)',
      background: 'rgba(255,255,255,0.6)',
      color: '#6C584C',
      textAlign: 'center' as const,
      padding: 24,
      fontSize: 18,
    },
  };

  return (
    <div
      style={styles.root}
      onMouseMove={handleParallaxMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <div style={styles.shell}>
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <div style={styles.orb} />
            <div>
              <p style={styles.topBarTitle}>Whisperwind Grove</p>
              <p style={styles.topBarMeta}>Cozy mini-game platform for short sessions</p>
            </div>
          </div>
          <div style={styles.topBarRight}>
            <span style={styles.navChip}>Grove Pass</span>
            <span style={styles.navChip}>Daily Calm</span>
            <span style={styles.navChip}>Settings</span>
          </div>
        </div>

        <div style={styles.heroGrid}>
          <section style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.heroPill}>Featured Journey</span>
              <h1 style={styles.title}>{featuredGame.title}</h1>
              <p style={styles.subtitle}>{featuredGame.description}</p>
              <div style={styles.heroActions}>
                <button
                  style={styles.heroButtonPrimary}
                  onMouseDown={(e) => {
                    const el = e.currentTarget as HTMLButtonElement;
                    el.style.transform = 'translateY(1px) scale(0.985)';
                    el.style.filter = 'brightness(0.95)';
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
                  onClick={() => {
                    if (onSelect) {
                      onSelect(featuredGame.id);
                      return;
                    }
                    setActiveGame(featuredGame.id);
                  }}
                >
                  Continue Adventure
                </button>
                <span style={styles.heroButtonGhost}>{gameDuration(featuredGame.id)}</span>
              </div>
            </div>
          </section>

          <aside style={styles.sideStack}>
            <section style={styles.statPanel}>
              <h2 style={styles.statTitle}>Grove Snapshot</h2>
              <div style={styles.statRow}>
                <div style={styles.statCell}>
                  <p style={styles.statValue}>{games.length}</p>
                  <p style={styles.statLabel}>Total Worlds</p>
                </div>
                <div style={styles.statCell}>
                  <p style={styles.statValue}>{playableCount}</p>
                  <p style={styles.statLabel}>Playable Now</p>
                </div>
                <div style={styles.statCell}>
                  <p style={styles.statValue}>{comingSoonCount}</p>
                  <p style={styles.statLabel}>Coming Soon</p>
                </div>
              </div>
            </section>

            <section style={styles.updatePanel}>
              <span style={styles.updateBadge}>Latest Update</span>
              <h3 style={styles.updateTitle}>Spirit Sapling Harvest</h3>
              <p style={styles.updateText}>Grow a tree to stage six and collect guardian fruits with the new basket flow.</p>
            </section>
          </aside>
        </div>

        <section style={styles.controlsBar}>
          <div style={styles.filterGroup}>
            <button
              type="button"
              style={{
                ...styles.filterButton,
                background: filter === 'all' ? '#6C584C' : 'rgba(240, 234, 210, 0.65)',
                color: filter === 'all' ? '#F0EAD2' : '#6C584C',
              }}
              onMouseDown={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(1px) scale(0.985)';
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(0) scale(1)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(0) scale(1)';
              }}
              onClick={() => setFilter('all')}
            >
              All Games
            </button>
            <button
              type="button"
              style={{
                ...styles.filterButton,
                background: filter === 'playable' ? '#6C584C' : 'rgba(240, 234, 210, 0.65)',
                color: filter === 'playable' ? '#F0EAD2' : '#6C584C',
              }}
              onMouseDown={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(1px) scale(0.985)';
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(0) scale(1)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(0) scale(1)';
              }}
              onClick={() => setFilter('playable')}
            >
              Playable
            </button>
            <button
              type="button"
              style={{
                ...styles.filterButton,
                background: filter === 'coming-soon' ? '#6C584C' : 'rgba(240, 234, 210, 0.65)',
                color: filter === 'coming-soon' ? '#F0EAD2' : '#6C584C',
              }}
              onMouseDown={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(1px) scale(0.985)';
              }}
              onMouseUp={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(0) scale(1)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.transform = 'translateY(0) scale(1)';
              }}
              onClick={() => setFilter('coming-soon')}
            >
              Coming Soon
            </button>
          </div>
          <p style={styles.controlsHint}>Choose a world below to start. Tip: {gamePill(featuredGame.id)} is great for short sessions.</p>
        </section>

        <div style={styles.row}>
          {visibleGames.length > 0 ? visibleGames.map((g, index) => (
            <GameCard
              key={`${filter}-${g.id}`}
              game={g}
              revealDelayMs={index * 70}
              onPlay={(id) => {
                console.log('GameSelection: Play clicked', id);
                if (onSelect) {
                  onSelect(id);
                  return;
                }
                setActiveGame(id);
              }}
            />
          )) : (
            <div style={styles.emptyState}>No games match this filter yet. Try another view.</div>
          )}
        </div>
      </div>

      {activeGame && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,5,4,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 40 }}>
          <div style={{ width: 'min(1920px, 96vw)', height: 'min(1080px, 88vh)', aspectRatio: '16 / 9', background: '#000000', borderRadius: 8, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>
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
            style={{ position: 'fixed', top: 18, right: 18, padding: '8px 12px', borderRadius: 8, border: 'none', background: '#fff', fontFamily: bodyFontFamily, transition: 'transform 120ms ease, filter 120ms ease' }}
            onMouseDown={(e) => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.transform = 'translateY(1px) scale(0.985)';
              el.style.filter = 'brightness(0.95)';
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
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default GameSelectionScreen;
