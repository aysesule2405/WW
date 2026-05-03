import { useEffect, useRef, useState } from 'react';
import { createGame } from '../game/createGame';
import { bodyFontFamily, headingFontFamily } from '../theme/typography';

type Props = {
  onExit: () => void;
};

// ─── Rule items ──────────────────────────────────────────────────────────────

const RULES = [
  {
    img: '/assets/sprites/wind-spirit-2.png',
    label: 'Click spirits as they drift across the screen to collect points.',
  },
  {
    img: '/assets/sprites/wind-spirit-gold.png',
    label: 'Gold spirits are rare — each one is worth 5 points.',
  },
  {
    icon: '💜',
    label: 'Cursed spirits glow purple. Clicking one costs 3 points and breaks your combo.',
  },
  {
    icon: '🔥',
    label: 'Chain clicks without missing to build a combo multiplier — up to 4×.',
  },
  {
    icon: '✦',
    label: 'Wind Surge events light up all spirits gold and double your points for 4 seconds.',
  },
  {
    icon: '⚡',
    label: 'The grove gets more restless over 60 seconds — three phases, each faster than the last.',
  },
  {
    icon: '✗',
    label: 'Clicking empty air costs 1 point and resets your combo. Aim carefully.',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function SpiritDriftGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ReturnType<typeof createGame> | null>(null);
  const [showRules, setShowRules] = useState(true);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState(0);

  useEffect(() => {
    if (showRules) return;
    if (!containerRef.current || finalScore !== null) return;

    apiRef.current = createGame(containerRef.current, {
      onGameEnd: (score) => {
        apiRef.current?.destroy();
        apiRef.current = null;
        setFinalScore(score);
      },
    });
    apiRef.current.start?.();

    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [showRules, finalScore, sessionId]);

  // ── Rules page ─────────────────────────────────────────────────────────────
  if (showRules) {
    return (
      <div style={styles.page}>
        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={onExit}>
            ← Back to Grove
          </button>
          <h2 style={styles.heading}>Spirit Drift</h2>
        </div>

        <div style={styles.rulesWrap}>
          <div style={styles.rulesCard}>
            <h3 style={styles.rulesTitle}>How to Play</h3>
            <p style={styles.rulesSubtitle}>
              You have <strong>60 seconds</strong> — catch as many spirits as you can.
            </p>

            <ul style={styles.rulesList}>
              {RULES.map((rule, i) => (
                <li key={i} style={styles.ruleRow}>
                  <span style={styles.ruleIcon}>
                    {rule.img ? (
                      <img src={rule.img} alt="" style={styles.ruleSprite} />
                    ) : (
                      <span style={styles.ruleEmoji}>{rule.icon}</span>
                    )}
                  </span>
                  <span style={styles.ruleText}>{rule.label}</span>
                </li>
              ))}
            </ul>

            <button style={styles.beginButton} onClick={() => setShowRules(false)}>
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Scoreboard ─────────────────────────────────────────────────────────────
  if (finalScore !== null) {
    return (
      <div style={styles.page}>
        <div style={styles.topBar}>
          <button style={styles.backButton} onClick={onExit}>
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
                  setSessionId((v) => v + 1);
                }}
              >
                Play Again
              </button>
              <button style={styles.secondaryButton} onClick={onExit}>
                Back to Grove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Game canvas ────────────────────────────────────────────────────────────
  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <button style={styles.backButton} onClick={onExit}>
          ← Back to Grove
        </button>
        <h2 style={styles.heading}>Spirit Drift</h2>
      </div>

      <div key={sessionId} ref={containerRef} style={styles.gameWrap} />
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background:
      "linear-gradient(rgba(20,20,20,0.2), rgba(20,20,20,0.2)), url('/assets/backgrounds/spirit-drift/game-bg.png') center/cover no-repeat",
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
    color: '#6C584C',
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 44,
  },

  // Rules page
  rulesWrap: {
    minHeight: 'calc(100vh - 110px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rulesCard: {
    width: 'min(680px, 92vw)',
    background: 'rgba(20, 14, 8, 0.82)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24,
    border: '1px solid rgba(169, 132, 103, 0.28)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.45)',
    padding: '40px 48px 36px',
    boxSizing: 'border-box',
  },
  rulesTitle: {
    fontFamily: headingFontFamily,
    fontSize: 38,
    color: '#F0EAD2',
    margin: '0 0 6px',
    textAlign: 'center',
  },
  rulesSubtitle: {
    fontFamily: bodyFontFamily,
    fontSize: 18,
    color: '#c4b5a0',
    textAlign: 'center',
    margin: '0 0 28px',
    lineHeight: 1.5,
  },
  rulesList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  ruleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  ruleIcon: {
    flexShrink: 0,
    width: 44,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleSprite: {
    width: 44,
    height: 44,
    objectFit: 'contain',
  },
  ruleEmoji: {
    fontSize: 26,
    lineHeight: 1,
  },
  ruleText: {
    fontFamily: bodyFontFamily,
    fontSize: 17,
    color: '#e8ddd0',
    lineHeight: 1.45,
  },
  beginButton: {
    display: 'block',
    width: '100%',
    padding: '16px 0',
    backgroundColor: '#a78bfa',
    color: '#111827',
    border: 'none',
    borderRadius: 14,
    fontFamily: bodyFontFamily,
    fontSize: 26,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.4,
  },

  // Game canvas
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

  // Scoreboard
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
    background:
      "url('/assets/backgrounds/spirit-drift/score-board.png') center/contain no-repeat",
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
    whiteSpace: 'nowrap',
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
