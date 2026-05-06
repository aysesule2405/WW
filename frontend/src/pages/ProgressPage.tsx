import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'
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
  // for score-based games not yet on sessions (spirit-drift, half-moon)
  highScore: number | null
  recentScores: ScoreEntry[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GAME_META: Record<string, { title: string; icon: string }> = {
  'spirit-drift':         { title: 'Spirit Drift',            icon: '🌊' },
  'delivery-on-the-wind': { title: 'Delivery on the Wind',    icon: '📦' },
  'spirit-sapling':       { title: 'Spirit Sapling',          icon: '🌱' },
  'half-moon':            { title: 'Rise of the Half Moon',   icon: '🌙' },
}

const GUARDIAN_NAMES: Record<string, string> = {
  deer: 'Deer', fox: 'Fox', kodama: 'Kodama', mononoke: 'Mononoke',
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCell({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={s.statCell}>
      <p style={s.statValue}>{value}</p>
      <p style={s.statLabel}>{label}</p>
    </div>
  )
}

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
        <div style={s.sessionRow}>
          <span style={s.sessionDot} />
          <span style={s.sessionMain}>
            Completed in <strong>{formatTime(gs.completionTimeSeconds)}</strong>
          </span>
          <span style={s.sessionDate}>{date}</span>
        </div>
      )
    }
    return (
      <div style={s.sessionRow}>
        <span style={{ ...s.sessionDot, background: 'var(--text-muted)' }} />
        <span style={s.sessionMain}>
          {gs.deliveriesCompleted ?? 0}/4 deliveries — did not finish
        </span>
        <span style={s.sessionDate}>{date}</span>
      </div>
    )
  }

  if (isSapling && isGameSession) {
    const gs = session as Session
    const guardian = gs.guardianId ? GUARDIAN_NAMES[gs.guardianId] ?? gs.guardianId : null
    return (
      <div style={s.sessionRow}>
        <span style={gs.completed ? s.sessionDot : { ...s.sessionDot, background: 'var(--text-muted)' }} />
        <span style={s.sessionMain}>
          {gs.completed
            ? <>Harvested{guardian ? ` with ${guardian}` : ''} — <strong>{gs.score ?? 0} pts</strong>{gs.harmonyBonus ? ' ✨' : ''}</>
            : 'Session ended early'}
        </span>
        <span style={s.sessionDate}>{date}</span>
      </div>
    )
  }

  // Score-based (spirit-drift / half-moon) from ScoreSubmission
  const scoreEntry = session as ScoreEntry
  return (
    <div style={s.sessionRow}>
      <span style={s.sessionDot} />
      <span style={s.sessionMain}>
        <strong>{scoreEntry.score ?? 0} pts</strong>
      </span>
      <span style={s.sessionDate}>{date}</span>
    </div>
  )
}

function GameProgressCard({ card }: { card: GameCard }) {
  const [expanded, setExpanded] = useState(false)
  const { slug, title, icon, summary, highScore, recentScores } = card
  const isDelivery = slug === 'delivery-on-the-wind'
  const isSapling  = slug === 'spirit-sapling'
  const hasActivity = summary
    ? summary.totalSessions > 0
    : recentScores.length > 0

  const primaryMetric = () => {
    if (isDelivery && summary?.bestCompletionTimeSeconds != null) {
      return { label: 'Best Time', value: formatTime(summary.bestCompletionTimeSeconds) }
    }
    const best = summary?.highScore ?? highScore
    if (best !== null && best !== undefined) {
      return { label: 'Best Score', value: `${best} pts` }
    }
    return null
  }

  const metric = primaryMetric()
  const totalPlays = summary?.totalSessions ?? recentScores.length
  const lastPlayed = summary?.lastPlayedAt
    ?? (recentScores[0]?.createdAt ?? null)

  const sessions: (Session | ScoreEntry)[] = summary
    ? summary.recentSessions
    : recentScores

  const favoriteGuardian = summary?.favoriteGuardianId
    ? GUARDIAN_NAMES[summary.favoriteGuardianId] ?? summary.favoriteGuardianId
    : null

  return (
    <div style={s.gameCard}>
      {/* Header */}
      <button style={s.gameCardHeader} onClick={() => setExpanded((v) => !v)}>
        <div style={s.gameCardLeft}>
          <span style={s.gameIcon}>{icon}</span>
          <div>
            <p style={s.gameTitle}>{title}</p>
            {!hasActivity && <p style={s.gameNotPlayed}>Not played yet</p>}
          </div>
        </div>
        <div style={s.gameCardRight}>
          {metric && (
            <div style={s.metricChip}>
              <span style={s.metricValue}>{metric.value}</span>
              <span style={s.metricLabel}>{metric.label}</span>
            </div>
          )}
          <span style={s.expandArrow}>{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={s.gameCardBody}>
          {/* Quick stats row */}
          <div style={s.miniStatRow}>
            <div style={s.miniStat}>
              <span style={s.miniStatVal}>{totalPlays}</span>
              <span style={s.miniStatLbl}>Plays</span>
            </div>
            {summary && (
              <div style={s.miniStat}>
                <span style={s.miniStatVal}>{summary.completedSessions}</span>
                <span style={s.miniStatLbl}>Completed</span>
              </div>
            )}
            {favoriteGuardian && (
              <div style={s.miniStat}>
                <span style={s.miniStatVal}>{favoriteGuardian}</span>
                <span style={s.miniStatLbl}>Fav. Guardian</span>
              </div>
            )}
            {lastPlayed && (
              <div style={s.miniStat}>
                <span style={s.miniStatVal}>{formatDate(lastPlayed)}</span>
                <span style={s.miniStatLbl}>Last Played</span>
              </div>
            )}
          </div>

          {/* Timeline */}
          {sessions.length > 0 ? (
            <div style={s.timeline}>
              <p style={s.timelineLabel}>Recent Sessions</p>
              {sessions.map((ses, i) => (
                <SessionRow
                  key={'id' in ses ? ses.id : i}
                  session={ses}
                  isDelivery={isDelivery}
                  isSapling={isSapling}
                />
              ))}
            </div>
          ) : (
            <p style={s.emptyTimeline}>Play a game to see your history here.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user } = useAuth()
  const [cards, setCards]     = useState<GameCard[]>([])
  const [loading, setLoading] = useState(() => Boolean(user))

  useEffect(() => {
    if (!user) return

    const slugs = ['spirit-drift', 'delivery-on-the-wind', 'spirit-sapling', 'half-moon']

    Promise.all([
      // Session-based summary (Delivery + Sapling data lives here)
      getProgressSummary(),
      // Score-based bests + history for Spirit Drift + Half Moon
      getMyBest('spirit-drift'),
      getMyBest('half-moon'),
      getRecentScores('spirit-drift', 5),
      getRecentScores('half-moon', 5),
    ]).then(([summaryRes, sdBest, hmBest, sdRecent, hmRecent]) => {
      const summaryMap = new Map<string, GameSummary>(
        (summaryRes.games ?? []).map((g: GameSummary) => [g.gameSlug, g])
      )

      const sdBestVal  = sdBest?.best?.score ?? null
      const hmBestVal  = hmBest?.best?.score ?? null
      const sdScores   = (sdRecent?.recent ?? []) as ScoreEntry[]
      const hmScores   = (hmRecent?.recent ?? []) as ScoreEntry[]

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

  const totalPlayed = cards.filter(
    (c) => (c.summary?.totalSessions ?? c.recentScores.length) > 0
  ).length

  const globalBest = cards.reduce((acc, c) => {
    const s = c.summary?.highScore ?? c.highScore ?? 0
    return s > acc ? s : acc
  }, 0)

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Your Progress</h2>
      <p style={s.pageSub}>Private history visible only to you.</p>

      {/* Top stats */}
      <div style={s.statRow}>
        <StatCell value={totalPlayed}     label="Games Explored" />
        <StatCell value={cards.length}    label="Total Worlds" />
        <StatCell value={globalBest || '—'} label="All-time Best" />
      </div>

      {/* Per-game cards */}
      {!user ? (
        <p style={s.hint}>Sign in to track your progress across sessions.</p>
      ) : loading ? (
        <p style={s.hint}>Loading your progress…</p>
      ) : (
        <div style={s.cardList}>
          {cards.map((card) => (
            <GameProgressCard key={card.slug} card={card} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    display: 'flex', flexDirection: 'column', gap: 22,
    maxWidth: 700, fontFamily: bodyFontFamily,
  },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  pageSub:   { margin: '-14px 0 0', fontSize: 13, color: 'var(--text-muted)' },

  statRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 },
  statCell: {
    background: 'var(--bg-surface)', borderRadius: 14,
    border: '1px solid var(--border)', padding: '16px 12px',
    textAlign: 'center', boxShadow: 'var(--shadow-sm)',
  },
  statValue: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)', lineHeight: 1 },
  statLabel: { margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', fontFamily: bodyFontFamily },

  cardList: { display: 'flex', flexDirection: 'column', gap: 10 },

  gameCard: {
    background: 'var(--bg-surface)', borderRadius: 16,
    border: '1px solid var(--border)', overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  gameCardHeader: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'transparent', border: 'none',
    cursor: 'pointer', textAlign: 'left', gap: 12,
  },
  gameCardLeft:  { display: 'flex', alignItems: 'center', gap: 12 },
  gameCardRight: { display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 },
  gameIcon:      { fontSize: 26, lineHeight: 1 },
  gameTitle:     { margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-body)', fontFamily: bodyFontFamily },
  gameNotPlayed: { margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },

  metricChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1,
  },
  metricValue: { fontSize: 18, fontWeight: 700, color: 'var(--accent)', fontFamily: headingFontFamily },
  metricLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  expandArrow: { fontSize: 11, color: 'var(--text-muted)' },

  gameCardBody: {
    borderTop: '1px solid var(--border-muted)',
    padding: '14px 20px 16px',
    display: 'flex', flexDirection: 'column', gap: 14,
  },

  miniStatRow:  { display: 'flex', gap: 20, flexWrap: 'wrap' },
  miniStat:     { display: 'flex', flexDirection: 'column', gap: 1 },
  miniStatVal:  { fontSize: 15, fontWeight: 700, color: 'var(--text-body)', fontFamily: headingFontFamily },
  miniStatLbl:  { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.4 },

  timeline:      { display: 'flex', flexDirection: 'column', gap: 6 },
  timelineLabel: { margin: 0, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
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

  hint: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
}
