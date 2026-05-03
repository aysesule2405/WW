import { useEffect, useRef, useState } from 'react';
import { createGame } from '../game/createGame';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  onExit: () => void;
};

export default function SpiritDriftGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ReturnType<typeof createGame> | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState(0);

  useEffect(() => {
    if (!containerRef.current || finalScore !== null) return;

    if (!containerRef.current) return;
    apiRef.current = createGame(containerRef.current, {
      onGameEnd: (score) => {
        apiRef.current?.destroy();
        apiRef.current = null;
        setFinalScore(score);
      },
    });
    // start when scene is ready (createGame now defers safely)
    apiRef.current.start?.();

    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [finalScore, sessionId]);

  if (finalScore !== null) {
    return (
      <div style={styles.page}>
        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={() => onExit()}>
            ← Back to Grove
          </button>
          <h2 style={styles.heading}>Spirit Drift</h2>
        </div>

        <div style={styles.scoreBoardWrap}>
          <div style={styles.scoreBoardPanel}>
            <div style={styles.scoreChip}>Final Score: {finalScore}</div>
            <div style={styles.scoreBoardActions}>
              <button
                style={styles.primaryButton}
                onClick={() => {
                  setFinalScore(null);
                  setSessionId((value) => value + 1);
                }}
              >
                Play Again
              </button>
              <button style={styles.secondaryButton} onClick={() => onExit()}>
                Back to Grove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={() => onExit()}>
          ← Back to Grove
        </button>
        <h2 style={styles.heading}>Spirit Drift</h2>
      </div>

      <div key={sessionId} ref={containerRef} style={styles.gameWrap} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: "linear-gradient(rgba(20, 20, 20, 0.2), rgba(20, 20, 20, 0.2)), url('/assets/backgrounds/spirit-drift/game-bg.png') center/cover no-repeat",
    padding: 24,
    boxSizing: 'border-box',
  },
  topBar: {
    maxWidth: 1920,
    margin: '0 auto 18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  backButton: {
    backgroundColor: '#A98467',
    color: '#F0EAD2',
    border: 'none',
    borderRadius: 12,
    padding: '14px 22px',
    cursor: 'pointer',
    fontWeight: 600,
    fontFamily: bodyFontFamily,
    fontSize: 28,
  },
  heading: {
  color: '#ffffff',
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 44,
  },
  gameWrap: {
    width: 'min(1920px, calc(100vw - 48px))',
    height: 'min(1080px, calc(100vh - 150px))',
    aspectRatio: '16 / 9',
    margin: '0 auto',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: '0 18px 40px rgba(108, 88, 76, 0.18)',
    border: '1px solid rgba(169, 132, 103, 0.2)',
  },
  scoreBoardWrap: {
    minHeight: 'calc(100vh - 110px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreBoardPanel: {
    width: 'min(960px, 92vw)',
    height: 'min(540px, 72vh)',
    aspectRatio: '16 / 9',
    borderRadius: 24,
    position: 'relative',
    background: "url('/assets/backgrounds/spirit-drift/score-board.png') center/contain no-repeat",
    backgroundColor: 'rgba(255,255,255,0.08)',
    boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
  },
  scoreChip: {
    position: 'absolute',
    left: '50%',
    bottom: 84,
    transform: 'translateX(-50%)',
    padding: '12px 24px',
    borderRadius: 999,
    background: 'rgba(38, 27, 18, 0.82)',
    color: '#F9F3E8',
    fontSize: 42,
    fontWeight: 800,
    letterSpacing: 0.5,
    fontFamily: bodyFontFamily,
  },
  scoreBoardActions: {
    position: 'absolute',
    left: '50%',
    bottom: 24,
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#A98467',
    color: '#F0EAD2',
    border: 'none',
    borderRadius: 12,
    padding: '14px 22px',
    cursor: 'pointer',
    fontWeight: 700,
    fontFamily: bodyFontFamily,
    fontSize: 28,
  },
  secondaryButton: {
    backgroundColor: 'rgba(240, 234, 210, 0.92)',
    color: '#6C584C',
    border: 'none',
    borderRadius: 12,
    padding: '14px 22px',
    cursor: 'pointer',
    fontWeight: 700,
    fontFamily: bodyFontFamily,
    fontSize: 28,
  },
};
