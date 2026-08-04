import React, { useEffect, useRef, useState } from 'react';
import { useGameMusic } from '../hooks/useGameMusic';
import { createGame } from '../game/createGame';
import { uiFontFamily, titleFontFamily, numberFontFamily } from '../theme/typography';
import { getScoreLeaderboard, getMyBest, submitSession } from '../lib/api';
import GameShell from './game/GameShell';

type Props = { onExit: () => void };
type Screen = 'rules' | 'realm-select' | 'game' | 'results';

// ─── Realm definitions ────────────────────────────────────────────────────────

type Realm = {
  id: string
  name: string
  tagline: string
  icon: string
  accent: string
  cardGradient: string
  bg: string
}

const REALMS: Realm[] = [
  {
    id: 'wind',
    name: 'Wind Spirit Realm',
    tagline: 'Chase spirits through open skies and drifting clouds.',
    icon: '🌬️',
    accent: '#4cb7f1',
    cardGradient: 'linear-gradient(145deg, rgba(12,40,70,0.96) 0%, rgba(20,60,100,0.96) 100%)',
    bg: "linear-gradient(rgba(12,30,52,0.7), rgba(6,18,34,0.85)), url('/assets/backgrounds/spirit-drift/Spirit%20Drift%20Wind%20Realm%20Background.png') center/cover no-repeat",
  },
  {
    id: 'forest',
    name: 'Forest Spirit Realm',
    tagline: 'Spirits weave between ancient trees in dappled light.',
    icon: '🌿',
    accent: '#6AAF60',
    cardGradient: 'linear-gradient(145deg, rgba(10,28,14,0.96) 0%, rgba(18,44,20,0.96) 100%)',
    bg: "linear-gradient(rgba(10,28,14,0.72), rgba(5,20,8,0.88)), url('/assets/backgrounds/spirit-drift/Spirit%20Drift%20Forest%20Realm%20Background.png') center/cover no-repeat",
  },
  {
    id: 'lake',
    name: 'Lake Spirit Realm',
    tagline: 'Spirits shimmer above still waters under moonlight.',
    icon: '🌊',
    accent: '#5DD6C8',
    cardGradient: 'linear-gradient(145deg, rgba(8,24,36,0.96) 0%, rgba(12,40,54,0.96) 100%)',
    bg: "linear-gradient(rgba(8,24,36,0.72), rgba(4,18,30,0.88)), url('/assets/backgrounds/spirit-drift/Spirit%20Drift%20Lake%20Realm%20Background.png') center/cover no-repeat",
  },
  {
    id: 'mountain',
    name: 'Mountain Spirit Realm',
    tagline: 'Ancient spirits drift through misty, cloud-wrapped peaks.',
    icon: '⛰️',
    accent: '#A78BC4',
    cardGradient: 'linear-gradient(145deg, rgba(18,14,30,0.96) 0%, rgba(30,22,48,0.96) 100%)',
    bg: "linear-gradient(rgba(18,14,30,0.72), rgba(10,6,22,0.88)), url('/assets/backgrounds/spirit-drift/Spirit%20Drift%20Mountain%20Realm%20Background.png') center/cover no-repeat",
  },
]

const SHELL_BG = "linear-gradient(rgba(12,30,52,0.7), rgba(6,18,34,0.85)), url('/assets/backgrounds/spirit-drift/Spirit%20Drift%20Wind%20Realm%20Background.png') center/cover no-repeat"

// ─── Rules content ───────────────────────────────────────────────────────────

const RULES_SECTIONS = [
  {
    heading: 'Objective',
    items: [
      'Click wind spirits as they drift and weave across the screen.',
      'You have 60 seconds — rack up as many points as possible.',
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
    heading: 'Spirit Types',
    items: [
      'Common spirit — +1 point.',
      'Silver spirit (cyan glow) — +3 points.',
      'Gold spirit (rare, shimmering) — +5 points.',
      'Fleeting spirit (pink, fast) — +3 points, but moves at 1.75× speed.',
      'Cursed spirit (purple glow) — −3 points and breaks your combo.',
    ],
  },
  {
    heading: 'Scoring & Combo',
    items: [
      'Catch spirits without missing to build your streak.',
      'Reach 4 in a row for ×2, 9 for ×3, 16 for a massive ×4 multiplier.',
      'Catch a spirit in the first moments of its flight for a +1 Timing Bonus.',
      'Entering a new phase with a 5+ streak rewards a Phase Bonus: streak × 2 pts.',
    ],
  },
  {
    heading: 'Phases',
    items: [
      'Phase I — The Awakening: slow and gentle, learn the patterns.',
      'Phase II — The Drift: speed picks up, fleeting and cursed spirits appear.',
      'Phase III — The Storm: rapid spawns, high curse rate — keep your combo alive.',
    ],
  },
  {
    heading: 'Wind Surge',
    items: [
      'Every 20 seconds a Wind Surge erupts for 3.5 seconds.',
      'During the Surge, all spirits glow gold — points double.',
      'Prioritise gold and silver spirits when the Surge hits.',
    ],
  },
  {
    heading: 'Tips',
    items: [
      'Let cursed spirits pass — −3 pts plus a broken combo is very costly.',
      'Aim for fleeting spirits early in their path to grab the timing bonus.',
      'Going into Phase III with a long streak triggers a huge phase bonus.',
    ],
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

type LeaderboardRow = { rank: number; username: string; score: number; achievedAt: string }
type PersonalBest   = { score: number; achievedAt: string } | null

export default function SpiritDriftGame({ onExit }: Props) {
  useGameMusic('spirit-drift')

  const containerRef  = useRef<HTMLDivElement | null>(null);
  const apiRef        = useRef<ReturnType<typeof createGame> | null>(null);
  const [screen,       setScreen]       = useState<Screen>('rules');
  const [realm,        setRealm]        = useState<Realm>(REALMS[0]);
  const [hoveredRealm, setHoveredRealm] = useState<string | null>(null);
  const [finalScore,   setFinalScore]   = useState<number | null>(null);
  const [sessionId,    setSessionId]    = useState(0);
  const [leaderboard,  setLeaderboard]  = useState<LeaderboardRow[]>([]);
  const [personalBest, setPersonalBest] = useState<PersonalBest>(null);

  useEffect(() => {
    if (screen !== 'game') return;
    if (!containerRef.current || finalScore !== null) return;

    apiRef.current = createGame(containerRef.current, {
      realmId: realm.id,
      onGameEnd: async (result) => {
        const { score, raresCaught, fleetingCaught, cursedCaught, maxComboStreak, timingBonuses } = result;
        apiRef.current?.destroy();
        apiRef.current = null;
        await submitSession('spirit-drift', {
          completed: true,
          won: true,
          score,
          completionTimeSeconds: 60,
          completionTime: 60,
          realmId:        realm.id,
          raresCaught,
          fleetingCaught,
          cursedCaught,
          maxComboStreak,
          timingBonuses,
        });
        const [lb, me] = await Promise.all([
          getScoreLeaderboard('spirit-drift', 10),
          getMyBest('spirit-drift'),
        ]);
        setLeaderboard(lb.leaderboard ?? []);
        setPersonalBest(me.best ?? null);
        setFinalScore(score);
        setScreen('results');
      },
    });
    apiRef.current.start?.();

    return () => {
      apiRef.current?.destroy();
      apiRef.current = null;
    };
  }, [screen, finalScore, sessionId, realm.id]);

  const startGame = (r: Realm) => {
    setRealm(r);
    setFinalScore(null);
    setScreen('game');
  };

  const playAgain = () => {
    setFinalScore(null);
    setSessionId((v) => v + 1);
    setScreen('game');
  };

  // ── Rules ─────────────────────────────────────────────────────────────────
  if (screen === 'rules') {
    return (
      <GameShell title="Spirit Drift" onExit={onExit} background={SHELL_BG} accentColor="#aeddd9">
        <div className="ww-game-scroll" style={s.scrollArea}>
          <div className="ww-game-info-card" style={s.rulesCard}>
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
                <img src="/assets/sprites/wind-spirit-2.png" alt="" style={{ ...s.legendSprite, filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 8px rgba(255,255,255,0.5))' }} />
                <span style={s.legendText}>Common — <strong>+1 pt</strong></span>
              </div>
              <div style={s.legendItem}>
                <img src="/assets/sprites/wind-spirit-3.png" alt="" style={{ ...s.legendSprite, filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 10px #9decff)' }} />
                <span style={s.legendText}>Silver — <strong>+3 pts</strong></span>
              </div>
              <div style={s.legendItem}>
                <img src="/assets/sprites/wind-spirit-rare.png" alt="" style={{ ...s.legendSprite, filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 10px #ffe070)' }} />
                <span style={s.legendText}>Gold — <strong>+5 pts</strong></span>
              </div>
              <div style={s.legendItem}>
                <img src="/assets/sprites/wind-spirit-1.png" alt="" style={{ ...s.legendSprite, filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 10px #ffb0e0)' }} />
                <span style={s.legendText}>Fleeting — <strong>+3 pts</strong>, fast</span>
              </div>
              <div style={s.legendItem}>
                <img src="/assets/sprites/wind-spirit-2.png" alt="" style={{ ...s.legendSprite, filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 12px #9b30e0)' }} />
                <span style={s.legendText}>Cursed — <strong>−3 pts</strong>, skip it</span>
              </div>
            </div>

            <button style={s.startBtn} onClick={() => setScreen('realm-select')}>
              Choose Your Realm
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  // ── Realm selection ────────────────────────────────────────────────────────
  if (screen === 'realm-select') {
    return (
      <GameShell title="Spirit Drift" onExit={onExit} background={SHELL_BG} accentColor="#aeddd9">
        <div className="ww-game-scroll" style={s.scrollArea}>
          <div style={s.realmSelectWrap}>
            <div style={s.realmHeader}>
              <h3 style={s.realmTitle}>Choose Your Realm</h3>
              <p style={s.realmSubtitle}>Each realm holds its own spirits — where will you drift?</p>
            </div>

            <div style={s.realmGrid} className="sd-realm-grid">
              {REALMS.map((r) => {
                const isHovered = hoveredRealm === r.id
                return (
                  <button
                    key={r.id}
                    style={{
                      ...s.realmCard,
                      background: r.cardGradient,
                      borderColor: isHovered ? r.accent : `${r.accent}44`,
                      boxShadow: isHovered
                        ? `0 0 0 1px ${r.accent}88, 0 20px 48px rgba(0,0,0,0.6), 0 0 32px ${r.accent}22`
                        : '0 8px 28px rgba(0,0,0,0.5)',
                      transform: isHovered ? 'translateY(-4px) scale(1.015)' : 'none',
                    }}
                    onMouseEnter={() => setHoveredRealm(r.id)}
                    onMouseLeave={() => setHoveredRealm(null)}
                    onClick={() => startGame(r)}
                  >
                    <div style={{ ...s.realmAccentBar, background: `linear-gradient(90deg, ${r.accent}, ${r.accent}44)` }} />
                    <div style={{ ...s.realmIconWrap, background: `${r.accent}18`, borderColor: `${r.accent}33` }}>
                      <span style={s.realmIcon}>{r.icon}</span>
                    </div>
                    <div style={s.realmCardBody}>
                      <p style={{ ...s.realmName, color: r.accent }}>{r.name}</p>
                      <p style={s.realmTagline}>{r.tagline}</p>
                    </div>
                    <div style={{ ...s.realmEnterBtn, borderColor: `${r.accent}55`, color: r.accent }}>
                      Enter →
                    </div>
                  </button>
                )
              })}
            </div>

            <button style={s.backLink} onClick={() => setScreen('rules')}>
              ← Back to Rules
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  if (screen === 'results' && finalScore !== null) {
    const isNewBest = personalBest ? finalScore > personalBest.score : true
    return (
      <GameShell title="Spirit Drift" onExit={onExit} background={realm.bg} accentColor={realm.accent}>
        <div className="ww-game-scroll" style={s.scrollArea}>
          <div className="ww-game-info-card" style={s.resultsCard}>
            <div style={{ ...s.resultsIcon, color: realm.accent }}>✦</div>
            <h3 style={s.resultsTitle}>Round Complete</h3>
            <p style={{ ...s.rulesSubtitle, marginTop: -8 }}>{realm.name}</p>

            <div style={{ ...s.scoreBig, borderColor: `${realm.accent}55`, background: `${realm.accent}14` }}>
              <span style={{ ...s.scoreBigLabel, color: realm.accent }}>Final Score</span>
              <span style={s.scoreBigValue}>{finalScore}</span>
              {isNewBest && <span style={{ ...s.newBestTag, background: `${realm.accent}30` }}>New Personal Best!</span>}
              {!isNewBest && personalBest && (
                <span style={s.personalBestNote}>Best: {personalBest.score} pts</span>
              )}
            </div>

            {leaderboard.length > 0 && (
              <div style={s.leaderboardPanel}>
                <div style={{ ...s.leaderboardTitle, color: realm.accent }}>Top Scores</div>
                {leaderboard.slice(0, 8).map((row) => (
                  <div key={row.rank} style={s.leaderboardRow}>
                    <span style={{ ...s.leaderboardRank, color: realm.accent }}>#{row.rank}</span>
                    <span style={s.leaderboardUsername}>{row.username}</span>
                    <span style={s.leaderboardScore}>{row.score}</span>
                    <span style={s.leaderboardDate}>{new Date(row.achievedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={s.resultActions}>
              <button style={{ ...s.primaryBtn, background: `linear-gradient(135deg, ${realm.accent}cc, ${realm.accent}88)` }} onClick={playAgain}>
                Play Again
              </button>
              <button style={s.secondaryBtn} onClick={() => setScreen('realm-select')}>
                Change Realm
              </button>
              <button style={s.ghostBtn} onClick={onExit}>← Grove</button>
            </div>
          </div>
        </div>
      </GameShell>
    );
  }

  // ── Game canvas ───────────────────────────────────────────────────────────
  return (
    <GameShell title="Spirit Drift" onExit={onExit} background={realm.bg} accentColor={realm.accent}>
      <p className="ww-game-orientation-hint">Rotate your phone for a larger play area.</p>
      <div className="ww-phaser-game-wrap ww-drift-game-wrap" key={sessionId} ref={containerRef} style={s.gameWrap} />
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

  /* Realm selection */
  realmSelectWrap: {
    width: 'min(760px, 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  realmHeader: { textAlign: 'center' as const, display: 'flex', flexDirection: 'column', gap: 8 },
  realmTitle: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 34,
    color: '#fffbdc',
  },
  realmSubtitle: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 15,
    color: '#aeddd9',
    lineHeight: 1.5,
  },
  realmGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  realmCard: {
    position: 'relative' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    padding: '28px 20px 20px',
    borderRadius: 18,
    border: '1.5px solid',
    cursor: 'pointer',
    overflow: 'hidden' as const,
    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
    textAlign: 'center' as const,
  },
  realmAccentBar: {
    position: 'absolute' as const,
    top: 0, left: 0, right: 0,
    height: 3,
    borderRadius: '18px 18px 0 0',
  },
  realmIconWrap: {
    width: 64, height: 64,
    borderRadius: 16,
    border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  realmIcon: { fontSize: 32, lineHeight: 1 },
  realmCardBody: { display: 'flex', flexDirection: 'column' as const, gap: 6 },
  realmName: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 18,
    fontWeight: 700,
  },
  realmTagline: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: 'rgba(255,251,220,0.65)',
    lineHeight: 1.45,
  },
  realmEnterBtn: {
    marginTop: 4,
    padding: '7px 22px',
    borderRadius: 999,
    border: '1px solid',
    background: 'transparent',
    fontFamily: uiFontFamily,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.3,
    pointerEvents: 'none' as const,
  },
  backLink: {
    alignSelf: 'center' as const,
    padding: '8px 18px',
    border: 'none',
    background: 'transparent',
    fontFamily: uiFontFamily,
    fontSize: 14,
    color: 'rgba(174,221,217,0.6)',
    cursor: 'pointer',
    letterSpacing: 0.2,
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
