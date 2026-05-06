import React, { useEffect, useRef, useState } from 'react';
import { createGame } from '../game/createGame';
import { uiFontFamily, titleFontFamily, numberFontFamily } from '../theme/typography';
import { getScoreLeaderboard, getMyBest, submitScore, submitSession } from '../lib/api';
import GameShell from './game/GameShell';
import AchievementToast from './AchievementToast';
import type { UnlockedAchievement } from './AchievementToast';

type Props = { onExit: () => void };

const BG = "linear-gradient(rgba(12,30,52,0.7), rgba(6,18,34,0.85)), url('/assets/backgrounds/spirit-drift/game-bg.png') center/cover no-repeat"

// ─── Rules content ───────────────────────────────────────────────────────────

const RULES_SECTIONS = [
  {
    heading: 'Objective',
    items: [
      'Click wind spirits as they drift across the screen.',
      'You have 60 seconds — collect as many points as possible.',
    ],
  },
  {
    heading: 'Controls',
    items: [
      'Click or tap a spirit to capture it.',
      'Clicking empty air costs 1 point and resets your combo.',
    ],
  },
  {
    heading: 'Scoring',
    items: [
      'Regular spirit: +1 point.',
      'Gold spirit (rare): +5 points.',
      'Cursed spirit (purple glow): −3 points and breaks your combo.',
      'Chain combo: catch spirits without missing to build up to a 4× multiplier.',
    ],
  },
  {
    heading: 'Special Events',
    items: [
      'Wind Surge: all spirits glow gold for 4 seconds — points are doubled.',
      'The grove gets more restless as time passes — three phases, each faster.',
    ],
  },
  {
    heading: 'Tips',
    items: [
      'Keep your combo alive for massive multiplier bonuses.',
      'Skip cursed spirits — losing 3 points plus your combo hurts.',
      'Prioritize gold spirits during Wind Surge events.',
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

type LeaderboardRow = { rank: number; username: string; score: number; achievedAt: string }
type PersonalBest   = { score: number; achievedAt: string } | null

export default function SpiritDriftGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<ReturnType<typeof createGame> | null>(null);
  const [showRules,   setShowRules]   = useState(true);
  const [finalScore,  setFinalScore]  = useState<number | null>(null);
  const [sessionId,   setSessionId]   = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [personalBest, setPersonalBest] = useState<PersonalBest>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);

  useEffect(() => {
    if (showRules) return;
    if (!containerRef.current || finalScore !== null) return;

    apiRef.current = createGame(containerRef.current, {
      onGameEnd: async (score) => {
        apiRef.current?.destroy();
        apiRef.current = null;
        const saveResults = await Promise.all([
          submitScore('spirit-drift', {
            score,
            metadata: { completed: true, won: true },
          }),
          submitSession('spirit-drift', {
            completed: true,
            won: true,
            score,
            completionTimeSeconds: 60,
            completionTime: 60,
          }),
        ]);
        setUnlockedAchievements(
          saveResults.flatMap((result) => result?.achievements ?? [])
        );
        const [lb, me] = await Promise.all([
          getScoreLeaderboard('spirit-drift', 10),
          getMyBest('spirit-drift'),
        ]);
        setLeaderboard(lb.leaderboard ?? []);
        setPersonalBest(me.best ?? null);
        setFinalScore(score);
      },
    });
    apiRef.current.start?.();

    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [showRules, finalScore, sessionId]);

  const restart = () => {
    setFinalScore(null);
    setSessionId((v) => v + 1);
  };

  // ── Rules ─────────────────────────────────────────────────────────────────
  if (showRules) {
    return (
      <GameShell title="Spirit Drift" onExit={onExit} background={BG} accentColor="#aeddd9">
        <AchievementToast achievements={unlockedAchievements} onDone={() => setUnlockedAchievements([])} />
        <div style={s.scrollArea}>
          <div style={s.rulesCard}>
            <div style={s.rulesHeader}>
              <h3 style={s.rulesTitle}>How to Play</h3>
              <p style={s.rulesSubtitle}>
                Catch drifting spirits across changing elemental worlds.
              </p>
            </div>

            <div style={s.rulesSections}>
              {RULES_SECTIONS.map((sec) => (
                <div key={sec.heading} style={s.rulesBlock}>
                  <p style={s.rulesBlockTitle}>{sec.heading}</p>
                  <ul style={s.rulesList}>
                    {sec.items.map((item, i) => (
                      <li key={i} style={s.rulesItem}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={s.spiritLegend}>
              <div style={s.legendItem}>
                <img src="/assets/sprites/wind-spirit-2.png" alt="" style={s.legendSprite} />
                <span style={s.legendText}>Regular spirit — <strong>+1 pt</strong></span>
              </div>
              <div style={s.legendItem}>
                <img src="/assets/sprites/wind-spirit-gold.png" alt="" style={s.legendSprite} />
                <span style={s.legendText}>Gold spirit — <strong>+5 pts</strong></span>
              </div>
              <div style={s.legendItem}>
                <span style={{ ...s.legendSprite, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>💜</span>
                <span style={s.legendText}>Cursed spirit — <strong>−3 pts</strong></span>
              </div>
            </div>

            <button style={s.startBtn} onClick={() => setShowRules(false)}>
              Begin
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (finalScore !== null) {
    const isNewBest = personalBest ? finalScore > personalBest.score : true
    return (
      <GameShell title="Spirit Drift" onExit={onExit} background={BG} accentColor="#aeddd9">
        <div style={s.scrollArea}>
          <div style={s.resultsCard}>
            <div style={s.resultsIcon}>✦</div>
            <h3 style={s.resultsTitle}>Round Complete</h3>

            <div style={s.scoreBig}>
              <span style={s.scoreBigLabel}>Final Score</span>
              <span style={s.scoreBigValue}>{finalScore}</span>
              {isNewBest && <span style={s.newBestTag}>New Personal Best!</span>}
              {!isNewBest && personalBest && (
                <span style={s.personalBestNote}>Best: {personalBest.score} pts</span>
              )}
            </div>

            {leaderboard.length > 0 && (
              <div style={s.leaderboardPanel}>
                <div style={s.leaderboardTitle}>Top Scores</div>
                {leaderboard.slice(0, 8).map((row) => (
                  <div key={row.rank} style={s.leaderboardRow}>
                    <span style={s.leaderboardRank}>#{row.rank}</span>
                    <span style={s.leaderboardUsername}>{row.username}</span>
                    <span style={s.leaderboardScore}>{row.score}</span>
                    <span style={s.leaderboardDate}>{new Date(row.achievedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={s.resultActions}>
              <button style={s.primaryBtn} onClick={restart}>Play Again</button>
              <button style={s.secondaryBtn} onClick={() => setShowRules(true)}>Rules</button>
              <button style={s.ghostBtn} onClick={onExit}>← Grove</button>
            </div>
          </div>
        </div>
      </GameShell>
    );
  }

  // ── Game canvas ───────────────────────────────────────────────────────────
  return (
    <GameShell title="Spirit Drift" onExit={onExit} background={BG} accentColor="#aeddd9">
      <AchievementToast achievements={unlockedAchievements} onDone={() => setUnlockedAchievements([])} />
      <div key={sessionId} ref={containerRef} style={s.gameWrap} />
    </GameShell>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  /* Rules / results shared scroll container */
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '28px 20px 36px',
    boxSizing: 'border-box',
  },

  /* Rules card */
  rulesCard: {
    width: 'min(660px, 100%)',
    background: 'rgba(9,20,31,0.82)',
    backdropFilter: 'blur(16px)',
    borderRadius: 22,
    border: '1px solid rgba(76,183,241,0.22)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.55)',
    padding: '32px 36px 28px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  rulesHeader: { display: 'flex', flexDirection: 'column', gap: 6 },
  rulesTitle: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 30,
    color: '#fffbdc',
    textAlign: 'center',
  },
  rulesSubtitle: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 15,
    color: '#aeddd9',
    textAlign: 'center',
    lineHeight: 1.5,
  },

  rulesSections: { display: 'flex', flexDirection: 'column', gap: 14 },
  rulesBlock: { display: 'flex', flexDirection: 'column', gap: 5 },
  rulesBlockTitle: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontWeight: 700,
    fontSize: 13,
    color: '#4cb7f1',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  rulesList: { margin: 0, padding: '0 0 0 18px', display: 'flex', flexDirection: 'column', gap: 4 },
  rulesItem: {
    fontFamily: uiFontFamily,
    fontSize: 14,
    color: '#e3deb9',
    lineHeight: 1.5,
  },

  spiritLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    padding: '14px 16px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    border: '1px solid rgba(76,183,241,0.14)',
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 10 },
  legendSprite: { width: 36, height: 36, objectFit: 'contain', flexShrink: 0 },
  legendText: {
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#c4bd8e',
    lineHeight: 1.3,
  },

  startBtn: {
    width: '100%',
    padding: '14px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #2c8dc2, #186b99)',
    color: '#fffbdc',
    fontFamily: uiFontFamily,
    fontSize: 17,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: '0 8px 24px rgba(44,141,194,0.45)',
  },

  /* Results card */
  resultsCard: {
    width: 'min(480px, 100%)',
    background: 'rgba(9,20,31,0.88)',
    backdropFilter: 'blur(16px)',
    borderRadius: 22,
    border: '1px solid rgba(76,183,241,0.25)',
    boxShadow: '0 24px 56px rgba(0,0,0,0.60)',
    padding: '36px 40px 32px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 20,
    textAlign: 'center',
  },
  resultsIcon: {
    fontSize: 48,
    color: '#4cb7f1',
    fontFamily: titleFontFamily,
    lineHeight: 1,
  },
  resultsTitle: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 30,
    color: '#fffbdc',
  },
  scoreBig: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'rgba(44,141,194,0.14)',
    border: '1px solid rgba(44,141,194,0.35)',
    borderRadius: 14,
    padding: '16px 36px',
  },
  scoreBigLabel: {
    fontFamily: uiFontFamily, fontSize: 12, fontWeight: 700,
    color: '#4cb7f1', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  scoreBigValue: {
    fontFamily: numberFontFamily, fontSize: 56, color: '#fffbdc', lineHeight: 1,
  },
  scoreBigUnit: { fontFamily: uiFontFamily, fontSize: 13, color: '#7aaca8' },
  newBestTag: {
    fontSize: 11, fontWeight: 700, color: '#fffbdc',
    background: 'rgba(44,141,194,0.3)', borderRadius: 999,
    padding: '2px 10px', letterSpacing: 0.5,
  },
  personalBestNote: { fontSize: 13, color: '#7aaca8' },

  leaderboardPanel: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 5,
    padding: '12px 16px', borderRadius: 12,
    background: 'rgba(44,141,194,0.07)', border: '1px solid rgba(76,183,241,0.18)',
    boxSizing: 'border-box',
  },
  leaderboardTitle: {
    fontSize: 11, color: '#4cb7f1', textTransform: 'uppercase' as const,
    letterSpacing: 0.8, marginBottom: 4, fontWeight: 700,
  },
  leaderboardRow: {
    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between',
  },
  leaderboardRank:     { fontSize: 11, color: '#4cb7f1', minWidth: 26 },
  leaderboardUsername: { fontSize: 13, color: '#e3deb9', flex: 1 },
  leaderboardScore:    { fontSize: 13, color: '#fffbdc', fontFamily: numberFontFamily, minWidth: 40, textAlign: 'right' as const },
  leaderboardDate:     { fontSize: 11, color: '#445566', minWidth: 70, textAlign: 'right' as const },

  scoreboard: { display: 'none' },

  resultActions: {
    display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', width: '100%',
  },
  primaryBtn: {
    flex: 1, minWidth: 110,
    padding: '12px 0',
    borderRadius: 11, border: 'none',
    background: 'linear-gradient(135deg, #2c8dc2, #186b99)',
    color: '#fffbdc', fontFamily: uiFontFamily, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 5px 16px rgba(44,141,194,0.4)',
  },
  secondaryBtn: {
    flex: 1, minWidth: 80,
    padding: '12px 0',
    borderRadius: 11,
    border: '1px solid rgba(76,183,241,0.35)',
    background: 'transparent',
    color: '#aeddd9', fontFamily: uiFontFamily, fontSize: 15,
    cursor: 'pointer',
  },
  ghostBtn: {
    flex: 1, minWidth: 80,
    padding: '12px 0',
    borderRadius: 11,
    border: '1px solid rgba(196,189,142,0.25)',
    background: 'transparent',
    color: '#c4bd8e', fontFamily: uiFontFamily, fontSize: 15,
    cursor: 'pointer',
  },

  /* Game canvas */
  gameWrap: {
    flex: 1,
    width: 'min(1280px, calc(100vw - 32px))',
    height: 'min(720px, calc(100vh - 88px))',
    maxWidth: 1280,
    maxHeight: 720,
    margin: 'auto',
    alignSelf: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
};
