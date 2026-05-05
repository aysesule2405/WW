import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createHalfMoonGame } from './systems/createHalfMoonGame'
import type { HalfMoonAPI, ScoreState } from './systems/createHalfMoonGame'
import { PHASE_NAMES, WILD_CARDS } from './data/halfMoonConfig'
import type { Phase, Difficulty, WildCardType } from './data/halfMoonConfig'
import { getToken } from '../../lib/api'
import { bodyFontFamily, headingFontFamily } from '../../theme/typography'

type Props = { onExit: () => void }

type Screen = 'rules' | 'game' | 'level-end' | 'game-over'

type LevelResult = {
  scores: ScoreState
  won: boolean
  level: number
}

const MAX_LEVELS = 9
const STREAK_FOR_WILD = 3

// ── Helpers ───────────────────────────────────────────────────────────────────

function submitScore(score: number, level: number, won: boolean, aiScore: number) {
  const token = getToken()
  if (!token) return
  fetch('/api/v1/games/half-moon/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ score, metadata: { level, won, aiScore } }),
  }).catch(() => {})
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HalfMoonGame({ onExit }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef       = useRef<HalfMoonAPI | null>(null)

  const [screen,     setScreen]     = useState<Screen>('rules')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [level,      setLevel]      = useState(1)
  const [sessionId,  setSessionId]  = useState(0)

  const [scores,       setScores]       = useState<ScoreState>({ player: 0, ai: 0, playerCards: 0, aiCards: 0 })
  const [levelResult,  setLevelResult]  = useState<LevelResult | null>(null)
  const [totalScore,   setTotalScore]   = useState(0)
  const [streak,       setStreak]       = useState(0)
  const [wilds,        setWilds]        = useState<WildCardType[]>([])
  const [wildPrompt,   setWildPrompt]   = useState(false)

  const [hand,        setHand]        = useState<Phase[]>([])
  const [activeHandIdx, setActiveHandIdx] = useState<number | null>(null)
  const [isPlayerTurn, setIsPlayerTurn] = useState(true)
  const [eventMsg,    setEventMsg]    = useState<{ msg: string; color: string } | null>(null)
  const eventTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Game lifecycle ────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'game' || !containerRef.current) return

    apiRef.current = createHalfMoonGame(containerRef.current, {
      difficulty,
      onLevelEnd: (s, won, lv) => {
        setLevelResult({ scores: s, won, level: lv })
        setTotalScore(prev => prev + s.player)
        setStreak(prev => {
          const next = won ? prev + 1 : 0
          if (next > 0 && next % STREAK_FOR_WILD === 0) {
            const pool: WildCardType[] = ['eclipse-shield', 'moonrise', 'star-burst', 'crescent-charm']
            const earned = pool[Math.floor(Math.random() * pool.length)]
            setWilds(w => [...w, earned])
            setWildPrompt(true)
          }
          return next
        })
        submitScore(s.player, lv, won, s.ai)
        setScreen('level-end')
      },
      onScoreUpdate: (s) => setScores({ ...s }),
      onEvent: (msg, color) => {
        if (eventTimer.current) clearTimeout(eventTimer.current)
        setEventMsg({ msg, color })
        eventTimer.current = setTimeout(() => setEventMsg(null), 2200)
      },
      onHandUpdate: (h, idx) => { setHand([...h]); setActiveHandIdx(idx) },
      onTurnChange: (pt) => setIsPlayerTurn(pt),
    })

    apiRef.current.startLevel(level)

    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [screen, sessionId])  // eslint-disable-line

  const advanceLevel = useCallback(() => {
    const next = level + 1
    if (next > MAX_LEVELS) {
      setScreen('game-over')
    } else {
      setLevel(next)
      setLevelResult(null)
      setScreen('game')
      setSessionId(v => v + 1)
    }
  }, [level])

  const retryLevel = useCallback(() => {
    setLevelResult(null)
    setScreen('game')
    setSessionId(v => v + 1)
  }, [])

  const restartGame = useCallback(() => {
    setLevel(1)
    setTotalScore(0)
    setStreak(0)
    setWilds([])
    setLevelResult(null)
    setScreen('rules')
  }, [])

  const useWild = useCallback((type: WildCardType) => {
    apiRef.current?.activateWild(type)
    setWilds(prev => {
      const idx = prev.indexOf(type)
      if (idx < 0) return prev
      const next = [...prev]
      next.splice(idx, 1)
      return next
    })
    setWildPrompt(false)
  }, [])

  // ── Rules screen ──────────────────────────────────────────────────────────

  if (screen === 'rules') {
    return (
      <div style={s.page}>
        <TopBar onExit={onExit} />
        <div style={s.centre}>
          <div style={s.rulesCard}>
            <h2 style={s.rulesTitle}>Rise of the Half Moon</h2>
            <p style={s.rulesSub}>A moon-phase card placement game across 9 enchanted levels.</p>

            <div style={s.rulesGrid}>
              <RuleBlock title="The Deck" body="8 lunar phases — New Moon (1) to Waning Crescent (8). Four copies each. Draw 3 cards to start." />
              <RuleBlock title="Phase Pair"     body="Place a card adjacent to the same phase → +1 point." />
              <RuleBlock title="Full Moon Pair" body="Place a card adjacent to its opposite phase (numbers sum to 9) → +2 points." />
              <RuleBlock title="Lunar Cycle"    body="3+ consecutive phases in a connected chain → points equal chain length." />
              <RuleBlock title="Chain Stealing" body="Extend your opponent's chain to 3+ cards and you claim the whole chain and its points!" />
              <RuleBlock title="Win"            body="Most points when the board fills. Win 3 levels in a row to earn a Wild Card power." />
            </div>

            <div style={s.diffRow}>
              <span style={s.diffLabel}>Difficulty:</span>
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                <button
                  key={d}
                  style={{ ...s.diffBtn, ...(difficulty === d ? s.diffBtnActive : {}) }}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>

            <button style={s.startBtn} onClick={() => setScreen('game')}>
              Begin the Ritual
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game over screen ──────────────────────────────────────────────────────

  if (screen === 'game-over') {
    return (
      <div style={s.page}>
        <TopBar onExit={onExit} />
        <div style={s.centre}>
          <div style={s.endCard}>
            <div style={s.endMoon}>☽</div>
            <h2 style={s.endTitle}>The Ritual is Complete</h2>
            <p style={s.endSub}>All 9 levels conquered.</p>
            <div style={s.scoreBadge}>
              <span style={s.scoreBadgeLabel}>Total Score</span>
              <span style={s.scoreBadgeValue}>{totalScore}</span>
            </div>
            <div style={s.endActions}>
              <button style={s.primaryBtn} onClick={restartGame}>Play Again</button>
              <button style={s.secondaryBtn} onClick={onExit}>Back to Grove</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Level end screen ──────────────────────────────────────────────────────

  if (screen === 'level-end' && levelResult) {
    const { scores: ls, won } = levelResult
    return (
      <div style={s.page}>
        <TopBar onExit={onExit} />
        <div style={s.centre}>
          <div style={{ ...s.endCard, borderColor: won ? 'rgba(200,168,75,0.5)' : 'rgba(180,80,80,0.4)' }}>
            <div style={s.endMoon}>{won ? '◯' : '☾'}</div>
            <h2 style={{ ...s.endTitle, color: won ? '#FFF8C0' : '#FF9988' }}>
              {won ? `Level ${levelResult.level} Complete!` : 'Half Moon Wins This Round'}
            </h2>
            <div style={s.scoreComparison}>
              <ScoreCol label="You" score={ls.player} cards={ls.playerCards} highlight={won} />
              <div style={s.vsText}>vs</div>
              <ScoreCol label="Half Moon" score={ls.ai} cards={ls.aiCards} highlight={!won} />
            </div>
            {levelResult.level < MAX_LEVELS && (
              <div style={s.endActions}>
                <button style={s.primaryBtn} onClick={advanceLevel}>
                  {won ? `Level ${levelResult.level + 1} →` : 'Next Level'}
                </button>
                <button style={s.secondaryBtn} onClick={retryLevel}>Retry</button>
                <button style={s.ghostBtn} onClick={onExit}>Exit</button>
              </div>
            )}
            {levelResult.level >= MAX_LEVELS && (
              <div style={s.endActions}>
                <button style={s.primaryBtn} onClick={() => setScreen('game-over')}>
                  See Final Score
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      <TopBar onExit={onExit} />

      <div style={s.gameArea}>
        {/* Phaser canvas */}
        <div key={sessionId} ref={containerRef} style={s.gameWrap} />

        {/* Event toast */}
        {eventMsg && (
          <div style={{ ...s.toast, color: eventMsg.color }}>{eventMsg.msg}</div>
        )}

        {/* Turn indicator */}
        <div style={{ ...s.turnBadge, background: isPlayerTurn ? 'rgba(136,170,255,0.18)' : 'rgba(255,136,187,0.18)' }}>
          {isPlayerTurn ? 'Your turn' : 'Half Moon thinks…'}
        </div>

        {/* Wild cards */}
        {wilds.length > 0 && (
          <div style={s.wildBar}>
            {wilds.map((w, i) => (
              <button key={i} style={s.wildBtn} onClick={() => useWild(w)} title={WILD_CARDS[w].description}>
                <span style={s.wildIcon}>{wildIcon(w)}</span>
                <span style={s.wildLabel}>{WILD_CARDS[w].label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Hand display (mirrors Phaser hand) */}
        <div style={s.handBar}>
          <span style={s.handLabel}>Your hand:</span>
          {hand.map((ph, i) => (
            <div
              key={i}
              style={{
                ...s.handPill,
                background: activeHandIdx === i ? 'rgba(200,168,75,0.35)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${activeHandIdx === i ? '#C8A84B' : 'rgba(200,168,75,0.25)'}`,
              }}
            >
              {ph} · {PHASE_NAMES[ph]}
            </div>
          ))}
          {!isPlayerTurn && <span style={s.handHint}>Waiting for Half Moon…</span>}
        </div>

        {/* Scores overlay */}
        <div style={s.scoresOverlay}>
          <span style={s.scoresYou}>You {scores.player}</span>
          <span style={s.scoresSep}>·</span>
          <span style={s.scoresAi}>Half Moon {scores.ai}</span>
        </div>
      </div>

      {/* Wild card earned prompt */}
      {wildPrompt && wilds.length > 0 && (
        <div style={s.wildModal}>
          <div style={s.wildModalCard}>
            <h3 style={s.wildModalTitle}>Wild Card Earned!</h3>
            <p style={s.wildModalSub}>3-level win streak — choose a power to activate now or save it.</p>
            {wilds.slice(-1).map((w) => (
              <div key={w} style={s.wildModalItem}>
                <span style={s.wildIcon}>{wildIcon(w)}</span>
                <div>
                  <div style={s.wildModalName}>{WILD_CARDS[w].label}</div>
                  <div style={s.wildModalDesc}>{WILD_CARDS[w].description}</div>
                </div>
              </div>
            ))}
            <div style={s.wildModalActions}>
              <button style={s.primaryBtn} onClick={() => useWild(wilds[wilds.length - 1])}>Use Now</button>
              <button style={s.secondaryBtn} onClick={() => setWildPrompt(false)}>Save for Later</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TopBar({ onExit }: { onExit: () => void }) {
  return (
    <div style={s.topBar}>
      <button style={s.backBtn} onClick={onExit}>← Back to Grove</button>
      <h2 style={s.heading}>Rise of the Half Moon</h2>
      <div style={{ width: 140 }} />
    </div>
  )
}

function RuleBlock({ title, body }: { title: string; body: string }) {
  return (
    <div style={s.ruleBlock}>
      <div style={s.ruleBlockTitle}>{title}</div>
      <div style={s.ruleBlockBody}>{body}</div>
    </div>
  )
}

function ScoreCol({ label, score, cards, highlight }: { label: string; score: number; cards: number; highlight: boolean }) {
  return (
    <div style={{ ...s.scoreCol, opacity: highlight ? 1 : 0.65 }}>
      <div style={s.scoreColLabel}>{label}</div>
      <div style={{ ...s.scoreColValue, color: highlight ? '#FFF8C0' : '#AABBCC' }}>{score}</div>
      <div style={s.scoreColCards}>{cards} cards</div>
    </div>
  )
}

function wildIcon(type: WildCardType): string {
  const icons: Record<WildCardType, string> = {
    'eclipse-shield': '🛡',
    'moonrise': '✦',
    'star-burst': '✸',
    'crescent-charm': '☽',
  }
  return icons[type]
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at top, #0A1628 0%, #060C1A 100%)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: bodyFontFamily,
    color: '#F0EAD2',
    boxSizing: 'border-box',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 22px',
    background: 'rgba(6,12,26,0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(200,168,75,0.2)',
    flexShrink: 0,
  },
  backBtn: {
    width: 140,
    padding: '8px 14px',
    borderRadius: 9,
    border: '1px solid rgba(200,168,75,0.3)',
    background: 'rgba(200,168,75,0.08)',
    color: '#F0EAD2',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    cursor: 'pointer',
  },
  heading: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 26,
    color: '#FFF8C0',
    textShadow: '0 0 20px rgba(200,168,75,0.5)',
  },
  centre: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },

  // ── Rules ──
  rulesCard: {
    background: 'rgba(10,22,40,0.97)',
    border: '1px solid rgba(200,168,75,0.3)',
    borderRadius: 22,
    boxShadow: '0 24px 56px rgba(0,0,0,0.7)',
    padding: '36px 42px',
    maxWidth: 680,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
  },
  rulesTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 32,
    color: '#FFF8C0',
    textAlign: 'center',
  },
  rulesSub: {
    margin: 0,
    fontSize: 15,
    color: '#AABBCC',
    textAlign: 'center',
    lineHeight: 1.5,
  },
  rulesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  ruleBlock: {
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,168,75,0.15)',
  },
  ruleBlockTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#C8A84B',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  ruleBlockBody: { fontSize: 13, color: '#AABBCC', lineHeight: 1.5 },

  diffRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  diffLabel: { fontSize: 14, color: '#AABBCC' },
  diffBtn: {
    padding: '7px 18px',
    borderRadius: 999,
    border: '1px solid rgba(200,168,75,0.3)',
    background: 'transparent',
    color: '#AABBCC',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    cursor: 'pointer',
  },
  diffBtnActive: {
    background: 'rgba(200,168,75,0.18)',
    borderColor: '#C8A84B',
    color: '#FFF8C0',
  },
  startBtn: {
    padding: '14px 0',
    borderRadius: 13,
    border: 'none',
    background: 'linear-gradient(135deg, #C8A84B, #8A6A22)',
    color: '#060C1A',
    fontFamily: bodyFontFamily,
    fontSize: 19,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: '0 8px 24px rgba(200,168,75,0.4)',
  },

  // ── Game ──
  gameArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    position: 'relative',
    boxSizing: 'border-box',
  },
  gameWrap: {
    position: 'relative',
    width: 'min(100%, calc((100vh - 80px) * (960/620)))',
    aspectRatio: '960 / 620',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    border: '1px solid rgba(200,168,75,0.2)',
  },
  toast: {
    position: 'absolute',
    top: 70,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '8px 20px',
    background: 'rgba(6,12,26,0.9)',
    border: '1px solid rgba(200,168,75,0.35)',
    borderRadius: 999,
    fontSize: 15,
    fontWeight: 700,
    fontFamily: bodyFontFamily,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    zIndex: 20,
    backdropFilter: 'blur(8px)',
    textShadow: '0 0 10px currentColor',
  },
  turnBadge: {
    position: 'absolute',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    padding: '5px 14px',
    borderRadius: 999,
    border: '1px solid rgba(200,168,75,0.25)',
    fontSize: 12,
    color: '#AABBCC',
    pointerEvents: 'none',
    backdropFilter: 'blur(6px)',
    zIndex: 20,
  },
  wildBar: {
    position: 'absolute',
    top: 60,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    zIndex: 20,
  },
  wildBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 10,
    border: '1px solid rgba(200,168,75,0.4)',
    background: 'rgba(6,12,26,0.9)',
    color: '#FFF8C0',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  wildIcon: { fontSize: 14 },
  wildLabel: { fontSize: 12, color: '#C8A84B' },
  handBar: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 14px',
    borderRadius: 999,
    background: 'rgba(6,12,26,0.85)',
    border: '1px solid rgba(200,168,75,0.2)',
    backdropFilter: 'blur(8px)',
    pointerEvents: 'none',
    zIndex: 20,
    whiteSpace: 'nowrap',
  },
  handLabel: { fontSize: 11, color: '#556677', marginRight: 4 },
  handPill: {
    padding: '3px 10px',
    borderRadius: 999,
    fontSize: 11,
    color: '#C8A84B',
    fontFamily: bodyFontFamily,
  },
  handHint: { fontSize: 11, color: '#556677', fontStyle: 'italic' },
  scoresOverlay: {
    position: 'absolute',
    top: 58,
    right: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 12px',
    borderRadius: 10,
    background: 'rgba(6,12,26,0.7)',
    border: '1px solid rgba(200,168,75,0.15)',
    backdropFilter: 'blur(6px)',
    pointerEvents: 'none',
    zIndex: 20,
  },
  scoresYou:  { fontSize: 12, color: '#88AAFF', fontWeight: 700 },
  scoresSep:  { fontSize: 12, color: '#334466' },
  scoresAi:   { fontSize: 12, color: '#FF88BB', fontWeight: 700 },

  // ── Level end ──
  endCard: {
    background: 'rgba(10,22,40,0.97)',
    border: '2px solid rgba(200,168,75,0.4)',
    borderRadius: 22,
    boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
    padding: '40px 48px',
    maxWidth: 480,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 18,
    textAlign: 'center',
  },
  endMoon: { fontSize: 52, lineHeight: 1 },
  endTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 30,
    color: '#FFF8C0',
  },
  endSub: { margin: 0, fontSize: 16, color: '#AABBCC', lineHeight: 1.5 },
  scoreComparison: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '16px 28px',
    borderRadius: 14,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,168,75,0.15)',
    width: '100%',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  vsText: { fontSize: 14, color: '#445566' },
  scoreCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  scoreColLabel: { fontSize: 12, color: '#778899', textTransform: 'uppercase', letterSpacing: 0.8 },
  scoreColValue: { fontFamily: headingFontFamily, fontSize: 36, lineHeight: 1 },
  scoreColCards: { fontSize: 12, color: '#556677' },
  endActions: { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  scoreBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    background: 'rgba(200,168,75,0.1)',
    border: '1px solid rgba(200,168,75,0.35)',
    borderRadius: 12,
    padding: '12px 28px',
  },
  scoreBadgeLabel: { fontSize: 12, color: '#C8A84B', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' },
  scoreBadgeValue: { fontFamily: headingFontFamily, fontSize: 42, color: '#FFF8C0', lineHeight: 1 },

  primaryBtn: {
    padding: '12px 28px',
    borderRadius: 11,
    border: 'none',
    background: 'linear-gradient(135deg, #C8A84B, #8A6A22)',
    color: '#060C1A',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 5px 16px rgba(200,168,75,0.4)',
  },
  secondaryBtn: {
    padding: '12px 22px',
    borderRadius: 11,
    border: '1px solid rgba(200,168,75,0.35)',
    background: 'transparent',
    color: '#C8A84B',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    cursor: 'pointer',
  },
  ghostBtn: {
    padding: '12px 22px',
    borderRadius: 11,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent',
    color: '#556677',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    cursor: 'pointer',
  },

  // ── Wild modal ──
  wildModal: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(4px)',
  },
  wildModalCard: {
    background: 'rgba(10,22,40,0.98)',
    border: '1px solid rgba(200,168,75,0.4)',
    borderRadius: 20,
    padding: '28px 34px',
    maxWidth: 380,
    width: '92%',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    boxShadow: '0 24px 56px rgba(0,0,0,0.6)',
  },
  wildModalTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 24, color: '#FFF8C0', textAlign: 'center' },
  wildModalSub:   { margin: 0, fontSize: 14, color: '#AABBCC', textAlign: 'center', lineHeight: 1.5 },
  wildModalItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(200,168,75,0.08)',
    border: '1px solid rgba(200,168,75,0.2)',
  },
  wildModalName: { fontSize: 15, fontWeight: 700, color: '#C8A84B' },
  wildModalDesc: { fontSize: 13, color: '#AABBCC', lineHeight: 1.4 },
  wildModalActions: { display: 'flex', gap: 10, justifyContent: 'center' },
}
