import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { bodyFontFamily, headingFontFamily, numberFontFamily } from '../theme/typography'
import { getProgressSummary, getMyBest, getRecentScores } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type Session = {
  id?: string
  score: number | null
  completed: boolean
  completionTimeSeconds: number | null
  deliveriesCompleted: number | null
  guardianId: string | null
  harmonyBonus: boolean | null
  createdAt: string
}

type GameSummary = {
  gameSlug: string
  totalSessions: number
  completedSessions: number
  lastPlayedAt: string | null
  highScore: number | null
  recentSessions: Session[]
  bestCompletionTimeSeconds?: number | null
  favoriteGuardianId?: string | null
}

type ScoreEntry = {
  score: number | null
  metadata?: Record<string, unknown>
  createdAt: string
}

type GameCard = {
  slug: string
  title: string
  icon: string
  summary: GameSummary | null
  highScore: number | null
  recentScores: ScoreEntry[]
}

type TrendPoint = {
  label: string
  value: number
  valueText: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GAME_META: Record<string, { title: string; icon: string }> = {
  'spirit-drift':         { title: 'Spirit Drift',          icon: '🌊' },
  'delivery-on-the-wind': { title: 'Delivery on the Wind',  icon: '📦' },
  'spirit-sapling':       { title: 'Spirit Sapling',        icon: '🌱' },
  'half-moon':            { title: 'Rise of the Half Moon', icon: '🌙' },
}

const GUARDIAN_NAMES: Record<string, string> = {
  deer: 'Deer', fox: 'Fox', kodama: 'Kodama', mononoke: 'Mononoke',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getTrendPoints(slug: string, sessions: (Session | ScoreEntry)[]): TrendPoint[] {
  return sessions.slice(0, 7).reverse().map((session) => {
    const label = formatDate(session.createdAt)

    if ('completed' in session && slug === 'delivery-on-the-wind') {
      if (session.completed && session.completionTimeSeconds !== null) {
        const paceValue = Math.max(1, 240 - session.completionTimeSeconds)
        return { label, value: paceValue, valueText: formatTime(session.completionTimeSeconds) }
      }
      const deliveries = session.deliveriesCompleted ?? 0
      return { label, value: deliveries, valueText: `${deliveries}/4` }
    }

    const score = session.score ?? 0
    return { label, value: score, valueText: `${score}` }
  })
}

// ── CompletionRing ─────────────────────────────────────────────────────────────

function CompletionRing({ completed, total, size = 80 }: { completed: number; total: number; size?: number }) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const dash = (pct / 100) * circumference
  const cx = size / 2
  const cy = size / 2

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="var(--chart-track)"
        strokeWidth={10}
      />
      {/* Arc */}
      <circle
        cx={cx} cy={cy} r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        strokeDashoffset={0}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 600ms ease' }}
      />
      {/* Label */}
      <text
        x={cx} y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontFamily: numberFontFamily, fontSize: Math.round(size * 0.22), fontWeight: 700, fill: 'var(--text-body)' } as React.CSSProperties}
      >
        {pct}%
      </text>
    </svg>
  )
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ points, slug }: { points: TrendPoint[]; slug: string }) {
  if (points.length < 2) return null
  const W = 640
  const H = 64
  const pad = 8
  const innerW = W - pad * 2
  const innerH = H - pad * 2
  const maxVal = Math.max(...points.map((p) => p.value), 1)

  const coords = points.map((p, i) => ({
    x: pad + (i / (points.length - 1)) * innerW,
    y: pad + innerH - (p.value / maxVal) * innerH,
  }))

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ')

  // Area fill path
  const first = coords[0]
  const last = coords[coords.length - 1]
  const areaPath = [
    `M ${first.x},${H - pad}`,
    ...coords.map((c) => `L ${c.x},${c.y}`),
    `L ${last.x},${H - pad}`,
    'Z',
  ].join(' ')

  const gradId = `prog-spark-${slug}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="64"
      preserveAspectRatio="none"
      style={{ display: 'block', borderRadius: 8, overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Dots */}
      {coords.map((c, i) => {
        const isLast = i === coords.length - 1
        return (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={isLast ? 5 : 3.5}
            fill={isLast ? 'var(--accent)' : 'var(--bg-surface)'}
            stroke="var(--accent)"
            strokeWidth={isLast ? 2 : 2}
          />
        )
      })}
    </svg>
  )
}

// ── SessionRow ────────────────────────────────────────────────────────────────

function SessionRow({ session, isDelivery, isSapling }: {
  session: Session | ScoreEntry
  isDelivery?: boolean
  isSapling?: boolean
}) {
  const isGameSession = 'completed' in session
  const date = formatDate(session.createdAt)

  if (isDelivery && isGameSession) {
    const gs = session as Session
    if (gs.completed && gs.completionTimeSeconds !== null) {
      return (
        <div style={sp.sessionRow}>
          <span style={sp.sessionDot} />
          <span style={sp.sessionMain}>Completed in <strong>{formatTime(gs.completionTimeSeconds)}</strong></span>
          <span style={sp.sessionDate}>{date}</span>
        </div>
      )
    }
    return (
      <div style={sp.sessionRow}>
        <span style={{ ...sp.sessionDot, background: 'var(--text-muted)' }} />
        <span style={sp.sessionMain}>{gs.deliveriesCompleted ?? 0}/4 deliveries — did not finish</span>
        <span style={sp.sessionDate}>{date}</span>
      </div>
    )
  }

  if (isSapling && isGameSession) {
    const gs = session as Session
    const guardian = gs.guardianId ? GUARDIAN_NAMES[gs.guardianId] ?? gs.guardianId : null
    return (
      <div style={sp.sessionRow}>
        <span style={gs.completed ? sp.sessionDot : { ...sp.sessionDot, background: 'var(--text-muted)' }} />
        <span style={sp.sessionMain}>
          {gs.completed
            ? <>Harvested{guardian ? ` with ${guardian}` : ''} — <strong>{gs.score ?? 0} pts</strong>{gs.harmonyBonus ? ' ✨' : ''}</>
            : 'Session ended early'}
        </span>
        <span style={sp.sessionDate}>{date}</span>
      </div>
    )
  }

  const scoreEntry = session as ScoreEntry
  return (
    <div style={sp.sessionRow}>
      <span style={sp.sessionDot} />
      <span style={sp.sessionMain}><strong>{scoreEntry.score ?? 0} pts</strong></span>
      <span style={sp.sessionDate}>{date}</span>
    </div>
  )
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ card, onClose }: { card: GameCard; onClose: () => void }) {
  const { slug, title, icon, summary, highScore, recentScores } = card
  const isDelivery = slug === 'delivery-on-the-wind'
  const isSapling  = slug === 'spirit-sapling'

  const totalPlays = summary?.totalSessions ?? recentScores.length
  const completedPlays = summary?.completedSessions ?? 0
  const lastPlayed = summary?.lastPlayedAt ?? (recentScores[0]?.createdAt ?? null)
  const favoriteGuardian = summary?.favoriteGuardianId
    ? GUARDIAN_NAMES[summary.favoriteGuardianId] ?? summary.favoriteGuardianId
    : null

  const primaryMetric = (() => {
    if (isDelivery && summary?.bestCompletionTimeSeconds != null) {
      return { label: 'Best Time', value: formatTime(summary.bestCompletionTimeSeconds) }
    }
    const best = summary?.highScore ?? highScore
    if (best !== null && best !== undefined) {
      return { label: 'Best Score', value: `${best} pts` }
    }
    return null
  })()

  const sessions: (Session | ScoreEntry)[] = summary ? summary.recentSessions : recentScores
  const trendPoints = getTrendPoints(slug, sessions)

  const [showAll, setShowAll] = useState(false)
  const displayedSessions = showAll ? sessions.slice(0, 15) : sessions.slice(0, 5)

  return (
    <div style={sp.detailPanel}>
      {/* Header row */}
      <div style={sp.detailHeader}>
        <div style={sp.detailHeaderLeft}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>{icon}</span>
          <div>
            <p style={sp.detailTitle}>{title}</p>
            {primaryMetric && (
              <p style={{ margin: '2px 0 0', fontFamily: numberFontFamily, fontSize: 22, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {primaryMetric.value}
                <span style={{ fontFamily: bodyFontFamily, fontSize: 12, color: 'var(--text-muted)', marginLeft: 6, fontWeight: 400 }}>
                  {primaryMetric.label}
                </span>
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <CompletionRing completed={completedPlays} total={Math.max(totalPlays, 1)} size={80} />
          <button style={sp.closeBtn} onClick={onClose} aria-label="Close detail">✕</button>
        </div>
      </div>

      {/* Stats row */}
      <div style={sp.statsRow}>
        <div style={sp.statChip}>
          <span style={sp.statChipVal}>{totalPlays}</span>
          <span style={sp.statChipLbl}>Plays</span>
        </div>
        {summary && (
          <div style={sp.statChip}>
            <span style={sp.statChipVal}>{completedPlays}</span>
            <span style={sp.statChipLbl}>Completed</span>
          </div>
        )}
        {lastPlayed && (
          <div style={sp.statChip}>
            <span style={sp.statChipVal}>{formatDate(lastPlayed)}</span>
            <span style={sp.statChipLbl}>Last Played</span>
          </div>
        )}
        {favoriteGuardian && (
          <div style={sp.statChip}>
            <span style={sp.statChipVal}>{favoriteGuardian}</span>
            <span style={sp.statChipLbl}>Fav. Guardian</span>
          </div>
        )}
      </div>

      {/* Sparkline */}
      {trendPoints.length >= 2 && (
        <div style={sp.sparkWrap}>
          <p style={sp.sparkLabel}>
            {isDelivery ? 'Delivery pace' : 'Score trend'}
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
              {isDelivery ? 'Faster finishes rise higher' : 'Recent runs, oldest → newest'}
            </span>
          </p>
          <Sparkline points={trendPoints} slug={slug} />
        </div>
      )}

      {/* Recent sessions */}
      {sessions.length > 0 ? (
        <div style={sp.timeline}>
          <p style={sp.timelineLabel}>Recent Sessions</p>
          {displayedSessions.map((ses, i) => (
            <SessionRow
              key={'id' in ses ? ses.id : i}
              session={ses}
              isDelivery={isDelivery}
              isSapling={isSapling}
            />
          ))}
          {sessions.length > 5 && (
            <button
              style={sp.showAllBtn}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? 'Show less' : `Show all ${Math.min(sessions.length, 15)}`}
            </button>
          )}
        </div>
      ) : (
        <p style={sp.emptyTimeline}>Play a game to see your history here.</p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useAuth()
  const [cards, setCards]     = useState<GameCard[]>([])
  const [loading, setLoading] = useState(() => Boolean(user))
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const slugs = ['spirit-drift', 'delivery-on-the-wind', 'spirit-sapling', 'half-moon']

    Promise.all([
      getProgressSummary(),
      getMyBest('spirit-drift'),
      getMyBest('half-moon'),
      getRecentScores('spirit-drift', 5),
      getRecentScores('half-moon', 5),
    ]).then(([summaryRes, sdBest, hmBest, sdRecent, hmRecent]) => {
      const summaryMap = new Map<string, GameSummary>(
        (summaryRes.games ?? []).map((g: GameSummary) => [g.gameSlug, g])
      )

      const sdBestVal = sdBest?.best?.score ?? null
      const hmBestVal = hmBest?.best?.score ?? null
      const sdScores  = (sdRecent?.recent ?? []) as ScoreEntry[]
      const hmScores  = (hmRecent?.recent ?? []) as ScoreEntry[]

      const built: GameCard[] = slugs.map((slug) => {
        const meta = GAME_META[slug]
        const sum  = summaryMap.get(slug) ?? null
        let highScore: number | null = null
        let recentScores: ScoreEntry[] = []
        if (slug === 'spirit-drift') { highScore = sdBestVal; recentScores = sdScores }
        if (slug === 'half-moon')    { highScore = hmBestVal; recentScores = hmScores }
        return { slug, title: meta.title, icon: meta.icon, summary: sum, highScore, recentScores }
      })

      setCards(built)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  // ── Overview stats ──────────────────────────────────────────────────────────
  const totalSessions = cards.reduce((acc, c) => acc + (c.summary?.totalSessions ?? c.recentScores.length), 0)
  const totalCompletions = cards.reduce((acc, c) => acc + (c.summary?.completedSessions ?? 0), 0)
  const gamesExplored = cards.filter((c) => (c.summary?.totalSessions ?? c.recentScores.length) > 0).length

  const bestScore = cards.reduce((acc, c) => {
    const s = c.summary?.highScore ?? c.highScore ?? 0
    return s > acc ? s : acc
  }, 0)
  const bestTime = cards.reduce<number | null>((acc, c) => {
    const t = c.summary?.bestCompletionTimeSeconds ?? null
    if (t === null) return acc
    return acc === null || t < acc ? t : acc
  }, null)

  const selectedCard = selectedSlug ? cards.find((c) => c.slug === selectedSlug) ?? null : null

  return (
    <div style={sp.page}>
      <h2 style={sp.pageTitle}>Your Progress</h2>
      <p style={sp.pageSub}>Private history visible only to you.</p>

      {/* Overview stat strip */}
      <div style={sp.overviewStrip}>
        <div style={sp.overviewTile}>
          <span style={sp.overviewIcon}>🎮</span>
          <span style={sp.overviewNum}>{totalSessions || '—'}</span>
          <span style={sp.overviewLbl}>Total Sessions</span>
        </div>
        <div style={sp.overviewTile}>
          <span style={sp.overviewIcon}>✅</span>
          <span style={sp.overviewNum}>{totalCompletions || '—'}</span>
          <span style={sp.overviewLbl}>Completions</span>
        </div>
        <div style={sp.overviewTile}>
          <span style={sp.overviewIcon}>🗺️</span>
          <span style={sp.overviewNum}>{gamesExplored}<span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: bodyFontFamily }}>/4</span></span>
          <span style={sp.overviewLbl}>Games Explored</span>
        </div>
        <div style={sp.overviewTile}>
          <span style={sp.overviewIcon}>🏆</span>
          <span style={sp.overviewNum}>
            {bestTime !== null ? formatTime(bestTime) : bestScore ? `${bestScore}` : '—'}
          </span>
          <span style={sp.overviewLbl}>{bestTime !== null ? 'Best Time' : 'Best Score'}</span>
        </div>
      </div>

      {/* Per-game content */}
      {!user ? (
        <p style={sp.hint}>Sign in to track your progress across sessions.</p>
      ) : loading ? (
        <p style={sp.hint}>Loading your progress…</p>
      ) : (
        <>
          {/* 2×2 game selector grid */}
          <div style={sp.selectorGrid}>
            {cards.map((card) => {
              const isSelected = selectedSlug === card.slug
              const plays = card.summary?.totalSessions ?? card.recentScores.length
              const isDelivery = card.slug === 'delivery-on-the-wind'
              const primaryMetric = (() => {
                if (isDelivery && card.summary?.bestCompletionTimeSeconds != null)
                  return formatTime(card.summary.bestCompletionTimeSeconds)
                const best = card.summary?.highScore ?? card.highScore
                return best !== null && best !== undefined ? `${best} pts` : null
              })()

              return (
                <button
                  key={card.slug}
                  style={{ ...sp.selectorCard, ...(isSelected ? sp.selectorCardActive : {}) }}
                  onClick={() => setSelectedSlug(isSelected ? null : card.slug)}
                >
                  <span style={{ fontSize: 32, lineHeight: 1 }}>{card.icon}</span>
                  <p style={sp.selectorTitle}>{card.title}</p>
                  <p style={{ ...sp.selectorMetric, color: primaryMetric ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {primaryMetric ?? 'Not played'}
                  </p>
                  <p style={sp.selectorPlays}>{plays} {plays === 1 ? 'session' : 'sessions'}</p>
                </button>
              )
            })}
          </div>

          {/* Detail panel */}
          {selectedCard && (
            <DetailPanel
              key={selectedCard.slug}
              card={selectedCard}
              onClose={() => setSelectedSlug(null)}
            />
          )}
        </>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sp: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    display: 'flex', flexDirection: 'column', gap: 22,
    maxWidth: 800, fontFamily: bodyFontFamily,
  },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  pageSub:   { margin: '-14px 0 0', fontSize: 13, color: 'var(--text-muted)' },

  // Overview strip
  overviewStrip: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
  },
  overviewTile: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '16px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    boxShadow: 'var(--shadow-sm)', textAlign: 'center',
  },
  overviewIcon: { fontSize: 22, lineHeight: 1 },
  overviewNum:  { fontFamily: headingFontFamily, fontSize: 26, fontWeight: 700, color: 'var(--text-h)', lineHeight: 1.1 },
  overviewLbl:  { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.4 },

  // Selector grid
  selectorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: 12,
  },
  selectorCard: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 16, padding: '20px 16px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    cursor: 'pointer', fontFamily: bodyFontFamily,
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 160ms',
    textAlign: 'center' as const,
  },
  selectorCardActive: {
    background: 'var(--bg-accent-soft)',
    border: '2px solid var(--border-focus)',
    boxShadow: 'var(--shadow-md)',
    transform: 'translateY(-2px)',
  },
  selectorTitle: {
    margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-body)',
    lineHeight: 1.3,
  },
  selectorMetric: {
    margin: 0, fontFamily: numberFontFamily, fontSize: 18, fontWeight: 700, lineHeight: 1,
  },
  selectorPlays: {
    margin: 0, fontSize: 11, color: 'var(--text-muted)',
  },

  // Detail panel
  detailPanel: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 18, padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 18,
    boxShadow: 'var(--shadow-md)',
  },
  detailHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
  },
  detailHeaderLeft: {
    display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1,
  },
  detailTitle: {
    margin: 0, fontFamily: headingFontFamily, fontSize: 20, color: 'var(--text-h)',
  },
  closeBtn: {
    background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 999, padding: '4px 10px',
    cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13,
    flexShrink: 0, fontFamily: bodyFontFamily,
  },

  // Stats row in detail
  statsRow: {
    display: 'flex', gap: 16, flexWrap: 'wrap' as const,
  },
  statChip: {
    display: 'flex', flexDirection: 'column', gap: 2,
    background: 'var(--bg-badge)', borderRadius: 10,
    padding: '8px 14px',
  },
  statChipVal: {
    fontFamily: headingFontFamily, fontSize: 18, fontWeight: 700, color: 'var(--text-body)', lineHeight: 1,
  },
  statChipLbl: {
    fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.4,
  },

  // Sparkline
  sparkWrap: {
    background: 'var(--chart-bg)', border: '1px solid var(--chart-border)',
    borderRadius: 12, padding: '12px 14px',
  },
  sparkLabel: {
    margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-body)',
    textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },

  // Timeline
  timeline:      { display: 'flex', flexDirection: 'column', gap: 0 },
  timelineLabel: { margin: '0 0 6px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  emptyTimeline: { margin: 0, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' },

  sessionRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '7px 0', borderBottom: '1px solid var(--border-muted)',
  },
  sessionDot: {
    width: 8, height: 8, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), #6C584C)',
    flexShrink: 0,
  },
  sessionMain: { flex: 1, fontSize: 13, color: 'var(--text-body)' },
  sessionDate: { fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 },

  showAllBtn: {
    marginTop: 8, background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 999, padding: '5px 14px', cursor: 'pointer',
    fontSize: 12, color: 'var(--text-muted)', fontFamily: bodyFontFamily,
    alignSelf: 'flex-start' as const,
  },

  hint: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
}
