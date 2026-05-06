import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createHalfMoonGame } from './systems/createHalfMoonGame'
import type { HalfMoonAPI, ScoreState } from './systems/createHalfMoonGame'
import { WILD_CARDS } from './data/halfMoonConfig'
import type { Difficulty, AIMode, WildCardType } from './data/halfMoonConfig'
import { getScoreLeaderboard, getMyBest, getRecentScores, submitScore, submitSession } from '../../lib/api'
import { uiFontFamily, titleFontFamily, numberFontFamily } from '../../theme/typography'
import { GAME_BG_HTML } from './assets'
import GameShell from '../../components/game/GameShell'
import AchievementToast from '../../components/AchievementToast'
import type { UnlockedAchievement } from '../../components/AchievementToast'
import { useGameMusic } from '../../hooks/useGameMusic'

const bodyFontFamily    = uiFontFamily
const headingFontFamily = titleFontFamily

const SHELL_BG = `radial-gradient(ellipse at top, rgba(10,22,40,0.92) 0%, rgba(6,12,26,0.96) 100%), url("${GAME_BG_HTML}") center / cover no-repeat fixed`

type Props = { onExit: () => void }
type Screen = 'rules' | 'game' | 'level-end' | 'game-over'

type LevelResult      = { scores: ScoreState; won: boolean; level: number }
type HighScore        = { score: number; achievedAt: string } | null
type RecentScore      = { score: number; metadata: { level?: number; won?: boolean }; createdAt: string }
type LeaderboardRow   = { rank?: number; username: string; score: number; achievedAt: string }

const MAX_LEVELS      = 3
const STREAK_FOR_WILD = 3
const GAME_SLUG       = 'half-moon'
const SCOREBOARD_ACCENT = '#63e8e7'
const RESULT_MUTED_ACCENT = '#D6D3A9'

async function fetchHighScore(): Promise<HighScore> {
  const data = await getMyBest(GAME_SLUG)
  return data.best ?? null
}

function LeaderboardBars({ rows }: { rows: LeaderboardRow[] }) {
  const chartRows = rows.slice(0, 5)
  const maxScore = Math.max(...chartRows.map((row) => row.score), 1)
  if (chartRows.length === 0) return null

  return (
    <div style={s.scoreChart}>
      {chartRows.map((row) => (
        <div key={`${row.rank}-${row.username}`} style={s.scoreChartRow}>
          <span style={s.scoreChartName}>#{row.rank ?? '?'} {row.username}</span>
          <div style={s.scoreChartTrack}>
            <div style={{ ...s.scoreChartFill, width: `${Math.max(10, (row.score / maxScore) * 100)}%` }} />
          </div>
          <span style={s.scoreChartValue}>{row.score}</span>
        </div>
      ))}
    </div>
  )
}

function RecentRunBars({ rows }: { rows: RecentScore[] }) {
  const chartRows = rows.slice(0, 5).reverse()
  const maxScore = Math.max(...chartRows.map((row) => row.score), 1)
  if (chartRows.length === 0) return null

  return (
    <div style={s.runChart} aria-label="Recent run score trend">
      {chartRows.map((row, index) => (
        <div key={`${row.createdAt}-${index}`} style={s.runChartColumn}>
          <div style={s.runChartTrack}>
            <div style={{ ...s.runChartFill, height: `${Math.max(14, (row.score / maxScore) * 100)}%` }} />
          </div>
          <span style={s.runChartLabel}>{row.score}</span>
        </div>
      ))}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function HalfMoonGame({ onExit }: Props) {
  useGameMusic('halfmoon')

  const containerRef = useRef<HTMLDivElement | null>(null)
  const apiRef       = useRef<HalfMoonAPI | null>(null)

  const [screen,     setScreen]     = useState<Screen>('rules')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [aiMode,     setAiMode]     = useState<AIMode>('local')
  const [level,      setLevel]      = useState(1)
  const [sessionId,  setSessionId]  = useState(0)

  const [scores,      setScores]      = useState<ScoreState>({ player: 0, ai: 0, playerCards: 0, aiCards: 0 })
  const [levelResult, setLevelResult] = useState<LevelResult | null>(null)
  const [totalScore,  setTotalScore]  = useState(0)
  const [wilds,       setWilds]       = useState<WildCardType[]>([])
  const [wildPrompt,  setWildPrompt]  = useState(false)

  const [isPlayerTurn,  setIsPlayerTurn]  = useState(true)
  const [eventMsg,      setEventMsg]      = useState<{ msg: string; color: string } | null>(null)
  const eventTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [gameResult,      setGameResult]      = useState<'victory' | 'defeat' | null>(null)
  const startTimeRef         = useRef<number>(0)
  const totalScoreRef        = useRef(0)
  const totalCardPointsRef   = useRef(0)
  const winStreakRef         = useRef(0)
  const [completionSeconds, setCompletionSeconds] = useState(0)

  const [highScore,     setHighScore]     = useState<HighScore>(null)
  const [recentScores,  setRecentScores]  = useState<RecentScore[]>([])
  const [leaderboard,   setLeaderboard]   = useState<LeaderboardRow[]>([])
  const [scoreLoading,  setScoreLoading]  = useState(false)
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([])

  const refreshScorePanels = useCallback(async () => {
    const [recent, board, best] = await Promise.all([
      getRecentScores(GAME_SLUG, 5),
      getScoreLeaderboard(GAME_SLUG, 8),
      getMyBest(GAME_SLUG),
    ])
    setRecentScores((recent.recent ?? []) as RecentScore[])
    setLeaderboard(board.leaderboard ?? [])
    setHighScore(best.best ?? null)
  }, [])

  const saveRunAndRefresh = useCallback(async ({
    completed,
    won,
    levelReached,
    playerScore,
    cardPoints,
    moonScore,
    winner,
    completionTimeSeconds,
  }: {
    completed: boolean
    won: boolean
    levelReached: number
    playerScore: number
    cardPoints: number
    moonScore: number
    winner: 'player' | 'moon'
    completionTimeSeconds: number
  }) => {
    setScoreLoading(true)
    const saveResults = await Promise.all([
      submitScore(GAME_SLUG, {
        score: playerScore,
        metadata: { level: levelReached, won, aiScore: moonScore, completed },
      }),
      submitSession(GAME_SLUG, {
        completed,
        score: playerScore,
        completionTimeSeconds,
        completionTime: completionTimeSeconds,
        totalCardPoints: cardPoints,
        moonScore,
        winner,
        won,
        levelReached,
        finalPlayerScore: playerScore,
      }),
    ])
    setUnlockedAchievements(
      saveResults.flatMap((result) => result?.achievements ?? [])
    )
    await refreshScorePanels()
    setScoreLoading(false)
  }, [refreshScorePanels])

  // Fetch personal best once on mount
  useEffect(() => {
    fetchHighScore().then(setHighScore)
  }, [])

  // ── Game lifecycle ────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'game' || !containerRef.current) return

    if (level === 1) startTimeRef.current = Date.now()

    apiRef.current = createHalfMoonGame(containerRef.current, {
      difficulty,
      aiMode,
      level,
      onLevelEnd: (s, won, lv) => {
        const nextTotalScore = totalScoreRef.current + s.player
        const nextCardPoints = totalCardPointsRef.current + s.playerCards
        totalScoreRef.current = nextTotalScore
        totalCardPointsRef.current = nextCardPoints
        setLevelResult({ scores: s, won, level: lv })
        setTotalScore(nextTotalScore)

        if (!won) {
          const seconds = Math.round((Date.now() - startTimeRef.current) / 1000)
          setCompletionSeconds(seconds)
          setGameResult('defeat')
          setScoreLoading(true)
          void saveRunAndRefresh({
            completed: false,
            won: false,
            levelReached: lv,
            playerScore: nextTotalScore,
            cardPoints: nextCardPoints,
            moonScore: s.ai,
            winner: 'moon',
            completionTimeSeconds: seconds,
          }).finally(() => setScreen('game-over'))
          return
        }

        winStreakRef.current += 1
        if (winStreakRef.current % STREAK_FOR_WILD === 0) {
          const pool: WildCardType[] = ['eclipse-shield', 'moonrise', 'star-burst', 'crescent-charm']
          const earned = pool[Math.floor(Math.random() * pool.length)]
          setWilds(w => [...w, earned])
          setWildPrompt(true)
        }
        setScreen('level-end')
      },
      onScoreUpdate: (s) => setScores({ ...s }),
      onEvent: (msg, color) => {
        if (eventTimer.current) clearTimeout(eventTimer.current)
        setEventMsg({ msg, color })
        eventTimer.current = setTimeout(() => setEventMsg(null), 2200)
      },
      onHandUpdate:  () => {},
      onTurnChange:  (pt) => setIsPlayerTurn(pt),
    })

    return () => {
      apiRef.current?.destroy()
      apiRef.current = null
    }
  }, [screen, sessionId, difficulty, aiMode, level, saveRunAndRefresh])

  const advanceLevel = useCallback(() => {
    const next = level + 1
    if (next > MAX_LEVELS) {
      // Won all 3 levels → victory!
      const seconds = Math.round((Date.now() - startTimeRef.current) / 1000)
      setCompletionSeconds(seconds)
      setGameResult('victory')
      setScoreLoading(true)
      void saveRunAndRefresh({
        completed: true,
        won: true,
        levelReached: MAX_LEVELS,
        playerScore: totalScoreRef.current,
        cardPoints: totalCardPointsRef.current,
        moonScore: levelResult?.scores.ai ?? 0,
        winner: 'player',
        completionTimeSeconds: seconds,
      }).finally(() => setScreen('game-over'))
    } else {
      setLevel(next)
      setLevelResult(null)
      setScreen('game')
      setSessionId(v => v + 1)
    }
  }, [level, levelResult, saveRunAndRefresh])

  const restartGame = useCallback(() => {
    setLevel(1)
    setTotalScore(0)
    totalScoreRef.current = 0
    totalCardPointsRef.current = 0
    winStreakRef.current = 0
    setCompletionSeconds(0)
    setWilds([])
    setLevelResult(null)
    setGameResult(null)
    setRecentScores([])
    setLeaderboard([])
    setScreen('rules')
  }, [])

  const activateWildCard = useCallback((type: WildCardType) => {
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
      <GameShell title="Rise of the Half Moon" onExit={onExit} background={SHELL_BG} accentColor="#D6D3A9">
        {highScore && (
          <div style={s.highScoreBanner}>
            Personal Best: <strong style={{ color: '#FFF8C0' }}>{highScore.score}</strong>
          </div>
        )}
        <div style={s.centre}>
          <div style={s.rulesCard}>
            <h2 style={s.rulesTitle}>Rise of the Half Moon</h2>
            <p style={s.rulesSub}>A moon-phase card placement game. Win all 3 levels to complete the ritual — one loss ends your run.</p>

            <div style={s.rulesGrid}>
              <RuleBlock title="The Deck"          body="8 lunar phases — New Moon (1) to Waning Crescent (8). Four copies each. Draw 3 to start." />
              <RuleBlock title="Same Match +1"     body="Place a card adjacent to the same moon phase." />
              <RuleBlock title="Complementary +2"  body="1+5, 2+6, 3+7, or 4+8 adjacent — opposite phases of the cycle." />
              <RuleBlock title="Moon Cycle"        body="3+ consecutive phases in order (wraps: 8→1) scores +1 per card in the chain." />
              <RuleBlock title="Chain Stealing"    body="Extend your opponent's chain to 3+ and you claim the whole chain and its points!" />
              <RuleBlock title="Win"               body="Most points when the board fills. Win 3 in a row to earn a Wild Card power." />
            </div>

            {/* Difficulty */}
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

            {/* AI Mode */}
            <div style={s.diffRow}>
              <span style={s.diffLabel}>AI Mode:</span>
              {(['local', 'gemini'] as AIMode[]).map(m => (
                <button
                  key={m}
                  style={{ ...s.diffBtn, ...(aiMode === m ? s.diffBtnActive : {}) }}
                  onClick={() => setAiMode(m)}
                  title={m === 'gemini' ? 'Requires GEMINI_API_KEY on the server' : 'Deterministic local AI'}
                >
                  {m === 'local' ? 'Local AI' : 'Gemini AI'}
                </button>
              ))}
            </div>

            <button style={s.startBtn} onClick={() => setScreen('game')}>
              Begin the Ritual
            </button>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── Game-over screen ──────────────────────────────────────────────────────

  if (screen === 'game-over') {
    const isVictory = gameResult === 'victory'
    const isNewBest = highScore ? totalScore > highScore.score : isVictory
    const resultAccent = isVictory ? SCOREBOARD_ACCENT : RESULT_MUTED_ACCENT
    return (
      <GameShell title="Rise of the Half Moon" onExit={onExit} background={SHELL_BG} accentColor="#D6D3A9">
        <AchievementToast achievements={unlockedAchievements} onDone={() => setUnlockedAchievements([])} />
        <div style={s.centre}>
          <div style={{ ...s.endCard, borderColor: isVictory ? 'rgba(99,232,231,0.6)' : 'rgba(214,211,169,0.42)' }}>
            <div style={s.endMoon}>{isVictory ? '◯' : '☾'}</div>
            <h2 style={{ ...s.endTitle, color: resultAccent }}>
              {isVictory ? 'The Ritual is Complete' : 'The Half Moon Prevails'}
            </h2>
            <p style={s.endSub}>
              {isVictory
                ? `All 3 levels conquered in ${completionSeconds}s`
                : `Defeated at level ${levelResult?.level ?? '?'}`}
            </p>

            <div style={s.scoreBadge}>
              <span style={s.scoreBadgeLabel}>Total Score</span>
              <span style={s.scoreBadgeValue}>{totalScore}</span>
              {isVictory && isNewBest && <span style={s.newBestTag}>New Personal Best!</span>}
            </div>

            {highScore && !(isVictory && isNewBest) && (
              <div style={s.prevBest}>
                Personal Best: <strong style={{ color: SCOREBOARD_ACCENT }}>{highScore.score}</strong>
              </div>
            )}

            {!scoreLoading && leaderboard.length > 0 && (
              <div style={s.recentPanel}>
                <div style={s.recentTitle}>Top Scores</div>
                <LeaderboardBars rows={leaderboard} />
                {leaderboard.map((row) => (
                  <div key={row.rank} style={s.recentRow}>
                    <span style={{ ...s.recentScore, minWidth: 24, fontSize: 11, color: SCOREBOARD_ACCENT }}>#{row.rank}</span>
                    <span style={{ ...s.recentMeta, textAlign: 'left' }}>{row.username}</span>
                    <span style={s.recentScore}>{row.score}</span>
                    <span style={s.recentDate}>{new Date(row.achievedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            {!scoreLoading && recentScores.length > 0 && (
              <div style={s.recentPanel}>
                <div style={s.recentTitle}>Your Recent Runs</div>
                <RecentRunBars rows={recentScores} />
                {recentScores.map((r, i) => (
                  <div key={i} style={s.recentRow}>
                    <span style={s.recentScore}>{r.score} pts</span>
                    <span style={s.recentMeta}>
                      Level {r.metadata?.level ?? '?'} · {r.metadata?.won ? 'Won' : 'Lost'}
                    </span>
                    <span style={s.recentDate}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={s.endActions}>
              <button style={{ ...s.primaryBtn, ...s.scoreboardPrimaryBtn }} onClick={restartGame}>Play Again</button>
              <button style={s.secondaryBtn} onClick={onExit}>Back to Grove</button>
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── Level-end screen ──────────────────────────────────────────────────────

  if (screen === 'level-end' && levelResult) {
    const { scores: ls } = levelResult
    const isLastLevel = levelResult.level >= MAX_LEVELS
    const wonText = `You won the ${ordinalLevel(levelResult.level)} level`
    return (
    <GameShell title="Rise of the Half Moon" onExit={onExit} background={SHELL_BG} accentColor="#D6D3A9">
      <AchievementToast achievements={unlockedAchievements} onDone={() => setUnlockedAchievements([])} />
      <div style={s.centre}>
          <div style={{ ...s.endCard, borderColor: 'rgba(200,168,75,0.5)' }}>
            <div style={s.endMoon}>◯</div>
            <h2 style={{ ...s.endTitle, color: '#FFF8C0' }}>
              {wonText}
            </h2>
            <p style={s.endSub}>
              {isLastLevel ? 'All three levels are cleared. Review the final score board.' : levelIntro(levelResult.level + 1)}
            </p>
            <div style={s.scoreComparison}>
              <ScoreCol label="You"       score={ls.player} cards={ls.playerCards} highlight={true} />
              <div style={s.vsText}>vs</div>
              <ScoreCol label="Half Moon" score={ls.ai}     cards={ls.aiCards}     highlight={false} />
            </div>
            <div style={s.runningScore}>
              <span style={s.runningScoreLabel}>Run total</span>
              <span style={s.runningScoreValue}>{totalScore}</span>
            </div>
            <div style={s.endActions}>
              <button style={s.primaryBtn} onClick={advanceLevel}>
                {isLastLevel ? 'See Final Scoreboard' : `Begin Level ${levelResult.level + 1}`}
              </button>
              <button style={s.ghostBtn} onClick={onExit}>Exit</button>
            </div>
          </div>
        </div>
      </GameShell>
    )
  }

  // ── Game screen ───────────────────────────────────────────────────────────

  return (
    <GameShell title="Rise of the Half Moon" onExit={onExit} background={SHELL_BG} accentColor="#D6D3A9">
      <AchievementToast achievements={unlockedAchievements} onDone={() => setUnlockedAchievements([])} />

      <div style={s.gameArea}>
        <div key={sessionId} ref={containerRef} style={s.gameWrap} />

        {eventMsg && (
          <div style={{ ...s.toast, color: eventMsg.color }}>{eventMsg.msg}</div>
        )}

        <div style={{ ...s.turnBadge, background: isPlayerTurn ? 'rgba(240,234,210,0.12)' : 'rgba(0,0,0,0.25)' }}>
          {isPlayerTurn ? 'Your turn' : 'Half Moon thinks…'}
        </div>

        {wilds.length > 0 && (
          <div style={s.wildBar}>
            {wilds.map((w, i) => (
              <button key={i} style={s.wildBtn} onClick={() => activateWildCard(w)} title={WILD_CARDS[w].description}>
                <span style={s.wildIcon}>{wildIcon(w)}</span>
                <span style={s.wildLabel}>{WILD_CARDS[w].label}</span>
              </button>
            ))}
          </div>
        )}

        <div style={s.scoresOverlay}>
          <span style={s.scoresYou}>You {scores.player}</span>
          <span style={s.scoresSep}>·</span>
          <span style={s.scoresAi}>Half Moon {scores.ai}</span>
          {highScore && (
            <span style={s.scoresBest}> · Best {highScore.score}</span>
          )}
        </div>
      </div>

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
              <button style={s.primaryBtn} onClick={() => activateWildCard(wilds[wilds.length - 1])}>Use Now</button>
              <button style={s.secondaryBtn} onClick={() => setWildPrompt(false)}>Save for Later</button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function ordinalLevel(level: number): string {
  if (level === 1) return 'first'
  if (level === 2) return 'second'
  if (level === 3) return 'third'
  return `${level}th`
}

function levelIntro(level: number): string {
  if (level === 2) return 'Level 2 opens a larger crescent map.'
  if (level === 3) return 'Level 3 reveals the full silver glade.'
  return `Level ${level} awaits.`
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
  // page / topBar / backBtn / heading → handled by GameShell
  page:    {},
  topBar:  {},
  backBtn: {},
  heading: {},
  highScoreBanner: {
    textAlign: 'center', padding: '8px 0',
    fontSize: 13, color: '#AABBCC',
    background: 'rgba(200,168,75,0.06)',
    borderBottom: '1px solid rgba(200,168,75,0.1)',
  },
  centre: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: '18px 20px 22px',
    overflowY: 'auto', boxSizing: 'border-box',
  },

  // ── Rules ──
  rulesCard: {
    background: 'rgba(10,22,40,0.97)', border: '1px solid rgba(200,168,75,0.3)',
    borderRadius: 22, boxShadow: '0 24px 56px rgba(0,0,0,0.7)',
    padding: '24px 34px', maxWidth: 920, width: '100%',
    maxHeight: 'calc(100vh - 128px)', overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 16,
  },
  rulesTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 30, color: '#FFF8C0', textAlign: 'center' },
  rulesSub:   { margin: 0, fontSize: 14, color: '#AABBCC', textAlign: 'center', lineHeight: 1.45 },
  rulesGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 10 },
  ruleBlock: {
    padding: '10px 12px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,168,75,0.15)',
  },
  ruleBlockTitle: { fontSize: 13, fontWeight: 700, color: '#C8A84B', marginBottom: 3, letterSpacing: 0.3 },
  ruleBlockBody:  { fontSize: 13, color: '#AABBCC', lineHeight: 1.38 },

  diffRow: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', flexWrap: 'wrap' },
  diffLabel: { fontSize: 14, color: '#AABBCC', minWidth: 70 },
  diffBtn: {
    padding: '7px 16px', borderRadius: 999, border: '1px solid rgba(200,168,75,0.3)',
    background: 'transparent', color: '#AABBCC',
    fontFamily: bodyFontFamily, fontSize: 14, cursor: 'pointer',
  },
  diffBtnActive: { background: 'rgba(200,168,75,0.18)', borderColor: '#C8A84B', color: '#FFF8C0' },
  startBtn: {
    padding: '12px 0', borderRadius: 13, border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2', fontFamily: bodyFontFamily, fontSize: 18, fontWeight: 700,
    cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 8px 24px rgba(58,88,32,0.45)',
  },

  // ── Game screen ──
  gameArea: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 12, position: 'relative', boxSizing: 'border-box',
  },
  gameWrap: {
    position: 'relative',
    width: 'min(100%, calc((100vh - 80px) * (960/620)))',
    aspectRatio: '960 / 620',
    borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
    border: '1px solid rgba(200,168,75,0.2)',
  },
  toast: {
    position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
    padding: '8px 20px', background: 'rgba(6,12,26,0.9)',
    border: '1px solid rgba(200,168,75,0.35)', borderRadius: 999,
    fontSize: 15, fontWeight: 700, fontFamily: bodyFontFamily,
    pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 20,
    backdropFilter: 'blur(8px)', textShadow: '0 0 10px currentColor',
  },
  turnBadge: {
    position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
    padding: '5px 14px', borderRadius: 999, border: '1px solid rgba(240,234,210,0.15)',
    fontSize: 12, color: '#AABBCC', pointerEvents: 'none',
    backdropFilter: 'blur(6px)', zIndex: 20,
  },
  wildBar: {
    position: 'absolute', top: 60, left: 16,
    display: 'flex', flexDirection: 'column', gap: 6, zIndex: 20,
  },
  wildBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
    borderRadius: 10, border: '1px solid rgba(200,168,75,0.4)',
    background: 'rgba(6,12,26,0.9)', color: '#FFF8C0',
    fontFamily: bodyFontFamily, fontSize: 12, cursor: 'pointer',
    backdropFilter: 'blur(8px)',
  },
  wildIcon:  { fontSize: 14 },
  wildLabel: { fontSize: 12, color: '#C8A84B' },
  scoresOverlay: {
    position: 'absolute', top: 58, right: 16,
    display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px',
    borderRadius: 10, background: 'rgba(6,12,26,0.7)',
    border: '1px solid rgba(200,168,75,0.15)', backdropFilter: 'blur(6px)',
    pointerEvents: 'none', zIndex: 20,
  },
  scoresYou:  { fontSize: 12, color: '#F0EAD2', fontWeight: 700 },
  scoresSep:  { fontSize: 12, color: '#556677' },
  scoresAi:   { fontSize: 12, color: '#998FAA', fontWeight: 700 },
  scoresBest: { fontSize: 11, color: '#ADC178' },

  // ── End screens ──
  endCard: {
    background: 'rgba(10,22,40,0.97)', border: '2px solid rgba(200,168,75,0.4)',
    borderRadius: 22, boxShadow: '0 24px 60px rgba(0,0,0,0.7)',
    padding: '40px 48px', maxWidth: 500, width: '100%',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 18, textAlign: 'center',
  },
  endMoon:   { fontSize: 52, lineHeight: 1 },
  endTitle:  { margin: 0, fontFamily: headingFontFamily, fontSize: 30, color: '#FFF8C0' },
  endSub:    { margin: 0, fontSize: 16, color: '#AABBCC', lineHeight: 1.5 },
  prevBest:  { fontSize: 13, color: '#AABBCC' },
  scoreComparison: {
    display: 'flex', alignItems: 'center', gap: 24, padding: '16px 28px',
    borderRadius: 14, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(200,168,75,0.15)',
    width: '100%', justifyContent: 'center', boxSizing: 'border-box',
  },
  vsText:        { fontSize: 14, color: '#445566' },
  scoreCol:      { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  scoreColLabel: { fontSize: 12, color: '#778899', textTransform: 'uppercase', letterSpacing: 0.8 },
  scoreColValue: { fontFamily: numberFontFamily, fontSize: 36, lineHeight: 1 },
  scoreColCards: { fontSize: 12, color: '#556677' },
  endActions:    { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' },
  runningScore: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)',
    borderRadius: 10, padding: '8px 24px',
  },
  runningScoreLabel: { fontSize: 11, color: '#C8A84B', textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  runningScoreValue: { fontFamily: numberFontFamily, fontSize: 28, color: '#FFF8C0', lineHeight: 1 },
  scoreBadge: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'rgba(99,232,231,0.1)', border: '1px solid rgba(99,232,231,0.45)',
    borderRadius: 12, padding: '12px 28px',
  },
  scoreBadgeLabel: { fontSize: 12, color: SCOREBOARD_ACCENT, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' },
  scoreBadgeValue: { fontFamily: numberFontFamily, fontSize: 42, color: SCOREBOARD_ACCENT, lineHeight: 1 },
  newBestTag: {
    fontSize: 11, fontWeight: 700, color: '#062022',
    background: SCOREBOARD_ACCENT, borderRadius: 999,
    padding: '2px 10px', letterSpacing: 0.5,
  },

  recentPanel: {
    width: '100%', display: 'flex', flexDirection: 'column', gap: 6,
    padding: '12px 16px', borderRadius: 12,
    background: 'rgba(99,232,231,0.045)', border: '1px solid rgba(99,232,231,0.16)',
    boxSizing: 'border-box',
  },
  recentTitle: { fontSize: 11, color: SCOREBOARD_ACCENT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  recentRow: { display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  recentScore: { fontSize: 13, color: SCOREBOARD_ACCENT, fontFamily: numberFontFamily, minWidth: 60 },
  recentMeta:  { fontSize: 12, color: '#AABBCC', flex: 1, textAlign: 'center' },
  recentDate:  { fontSize: 11, color: '#445566' },
  scoreChart: {
    display: 'flex', flexDirection: 'column', gap: 5,
    padding: '2px 0 8px',
  },
  scoreChartRow: {
    display: 'grid', gridTemplateColumns: '92px 1fr 34px',
    alignItems: 'center', gap: 8,
  },
  scoreChartName: {
    fontSize: 10, color: '#AABBCC', textAlign: 'left',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  scoreChartTrack: {
    height: 8, borderRadius: 999,
    background: 'var(--chart-track, rgba(99,232,231,0.08))', overflow: 'hidden',
    border: '1px solid var(--chart-border, rgba(99,232,231,0.12))',
  },
  scoreChartFill: {
    height: '100%', borderRadius: 999,
    background: 'var(--chart-fill, linear-gradient(90deg, rgba(99,232,231,0.36), #63e8e7))',
  },
  scoreChartValue: {
    fontFamily: numberFontFamily, fontSize: 11, color: 'var(--chart-accent, #63e8e7)',
    textAlign: 'right',
  },
  runChart: {
    height: 64, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8, alignItems: 'end', padding: '2px 0 8px',
  },
  runChartColumn: {
    height: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'flex-end', gap: 4,
  },
  runChartTrack: {
    width: '100%', height: 44, borderRadius: 8,
    background: 'var(--chart-track, rgba(99,232,231,0.08))',
    border: '1px solid var(--chart-border, rgba(99,232,231,0.12))',
    display: 'flex', alignItems: 'flex-end', overflow: 'hidden',
  },
  runChartFill: {
    width: '100%', borderRadius: '8px 8px 0 0',
    background: 'var(--chart-fill-vertical, linear-gradient(180deg, #63e8e7, rgba(99,232,231,0.22)))',
  },
  runChartLabel: {
    fontFamily: numberFontFamily, fontSize: 10, color: '#AABBCC',
  },

  primaryBtn: {
    padding: '12px 28px', borderRadius: 11, border: 'none',
    background: 'linear-gradient(135deg, #5A9030, #3E6820)',
    color: '#F0EAD2', fontFamily: bodyFontFamily, fontSize: 16, fontWeight: 700,
    cursor: 'pointer', boxShadow: '0 5px 16px rgba(58,88,32,0.4)',
  },
  scoreboardPrimaryBtn: {
    background: `linear-gradient(135deg, ${SCOREBOARD_ACCENT}, #2aa6b0)`,
    color: '#06191c',
    boxShadow: '0 5px 16px rgba(99,232,231,0.28)',
  },
  secondaryBtn: {
    padding: '12px 22px', borderRadius: 11, border: '1px solid rgba(200,168,75,0.35)',
    background: 'transparent', color: '#C8A84B',
    fontFamily: bodyFontFamily, fontSize: 15, cursor: 'pointer',
  },
  ghostBtn: {
    padding: '12px 22px', borderRadius: 11, border: '1px solid rgba(255,255,255,0.1)',
    background: 'transparent', color: '#556677',
    fontFamily: bodyFontFamily, fontSize: 15, cursor: 'pointer',
  },

  // ── Wild modal ──
  wildModal: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)',
  },
  wildModalCard: {
    background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(200,168,75,0.4)',
    borderRadius: 20, padding: '28px 34px', maxWidth: 380, width: '92%',
    display: 'flex', flexDirection: 'column', gap: 14,
    boxShadow: '0 24px 56px rgba(0,0,0,0.6)',
  },
  wildModalTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 24, color: '#FFF8C0', textAlign: 'center' },
  wildModalSub:   { margin: 0, fontSize: 14, color: '#AABBCC', textAlign: 'center', lineHeight: 1.5 },
  wildModalItem: {
    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
    borderRadius: 12, background: 'rgba(200,168,75,0.08)', border: '1px solid rgba(200,168,75,0.2)',
  },
  wildModalName: { fontSize: 15, fontWeight: 700, color: '#C8A84B' },
  wildModalDesc: { fontSize: 13, color: '#AABBCC', lineHeight: 1.4 },
  wildModalActions: { display: 'flex', gap: 10, justifyContent: 'center' },
}
