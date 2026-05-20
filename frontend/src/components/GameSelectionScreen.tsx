import React, { useState, useEffect, useMemo, useRef } from 'react'
import GameCard from './GameCard'
import games from './gameData'
import { bodyFontFamily, headingFontFamily, numberFontFamily } from '../theme/typography'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { GAME_THEMES } from '../context/themeTypes'
import {
  getScoreLeaderboard,
  getDeliveryLeaderboard,
  getProgressSummary,
  getProfile,
  mediaUrl,
  type AvatarConfig,
} from '../lib/api'
import { AvatarSvg, DEFAULT_RICH_AVATAR, type RichAvatarConfig } from './AvatarCreator'

type Props = {
  onSelect?: (id: string) => void
  onLogout?: () => void
}

type FilterKey = 'all' | 'playable' | 'coming-soon'

type DashEntry = {
  rank: number
  userId: string
  username: string
  avatarUrl?: string | null
  avatarConfig?: AvatarConfig | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
  value: number
  isTime: boolean
}

type ProgressGame = {
  gameSlug: string
  highScore: number | null
  totalSessions: number
  completedSessions: number
  lastPlayedAt: string | null
  bestCompletionTimeSeconds?: number | null
}

const LEADER_GAMES = [
  { slug: 'spirit-drift',         icon: '🌊', label: 'Drift'    },
  { slug: 'delivery-on-the-wind', icon: '📦', label: 'Delivery' },
  { slug: 'spirit-sapling',       icon: '🌱', label: 'Sapling'  },
  { slug: 'half-moon',            icon: '🌙', label: 'Moon'     },
]

const GAME_ICONS: Record<string, string> = {
  'spirit-drift': '🌊',
  'delivery-on-the-wind': '📦',
  'spirit-sapling': '🌱',
  'half-moon': '🌙',
}

function getDashboardBg(): string {
  try { return localStorage.getItem('ww_dashboard_bg') ?? '' } catch { return '' }
}

function timeOfDay(): string {
  const h = new Date().getHours()
  if (h < 5)  return 'Good night'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function timeAgo(iso: string | null): string {
  if (!iso) return ''
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return 'just now'
  const m = Math.floor(sec / 60); if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24); return `${d}d ago`
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function parseRichAvatar(raw: string | null | undefined): RichAvatarConfig | null {
  if (!raw) return null
  try {
    const parsed = { ...DEFAULT_RICH_AVATAR, ...JSON.parse(raw) }
    return JSON.stringify(parsed) !== JSON.stringify(DEFAULT_RICH_AVATAR) ? parsed : null
  } catch { return null }
}

function MiniAvatar({ username, avatarUrl, avatarConfig, richAvatarConfig, avatarPreference, size = 28 }: {
  username: string
  avatarUrl?: string | null
  avatarConfig?: AvatarConfig | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
  size?: number
}) {
  const PALETTE = ['#4a7c59', '#6b5c3e', '#5c6b9e', '#7a3c5c', '#3c6b7a', '#7a6b3c', '#3c5c7a']
  const fallbackColor = PALETTE[username.charCodeAt(0) % PALETTE.length]
  const richAvatar = parseRichAvatar(richAvatarConfig)
  const showRich = avatarPreference === 'rich' ? !!richAvatar : richAvatar && !avatarUrl

  if (showRich && richAvatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, lineHeight: 0, border: '1px solid rgba(0,0,0,0.1)' }}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }
  if (avatarUrl) {
    return (
      <img
        src={mediaUrl(avatarUrl)}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }}
      />
    )
  }
  if (avatarConfig) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 25%, #fff5, transparent 34%), ${avatarConfig.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.46), flexShrink: 0, border: '1px solid rgba(0,0,0,0.08)' }}>
        {avatarConfig.face}
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: fallbackColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.38), fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '0.03em' }}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

const DASH_DARK_OVERLAYS: Record<string, string> = {
  light:    'rgba(14,20,8,0.65)',
  sapling:  'rgba(36,28,9,0.65)',
  delivery: 'rgba(118,39,21,0.62)',
  drift:    'rgba(12,30,52,0.65)',
  halfmoon: 'rgba(4,3,7,0.68)',
  ember:    'rgba(42,21,8,0.65)',
  petal:    'rgba(26,8,24,0.65)',
  frost:    'rgba(6,12,24,0.68)',
}

export const GameSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  const { user } = useAuth()
  const { theme, mode } = useTheme()
  const isDark = mode === 'dark'
  const dashOverlay = isDark
    ? (DASH_DARK_OVERLAYS[theme] ?? 'rgba(0,0,0,0.60)')
    : 'var(--bg-photo-blend)'

  const [dashBg, setDashBg] = useState<string>(getDashboardBg)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const parallaxFrameRef = useRef<number | null>(null)

  const [leaderboards, setLeaderboards] = useState<Record<string, DashEntry[]>>({})
  const [leaderLoading, setLeaderLoading] = useState(true)
  const [selectedLeader, setSelectedLeader] = useState('spirit-drift')

  const [progressSummary, setProgressSummary] = useState<ProgressGame[]>([])

  const [welcomeAvatar, setWelcomeAvatar] = useState<{
    avatarUrl?: string | null
    avatarConfig?: AvatarConfig | null
    richAvatarConfig?: string | null
    avatarPreference?: 'photo' | 'rich' | null
  }>({})

  const playableCount   = useMemo(() => games.filter((g) => g.available).length, [])
  const comingSoonCount = games.length - playableCount
  const featuredGame    = useMemo(() => games.find((g) => g.available) ?? games[0], [])
  const visibleGames    = useMemo(() => {
    if (filter === 'playable')    return games.filter((g) => g.available)
    if (filter === 'coming-soon') return games.filter((g) => !g.available)
    return games
  }, [filter])

  // Fetch all 4 leaderboards on mount
  useEffect(() => {
    setLeaderLoading(true)
    Promise.allSettled([
      getScoreLeaderboard('spirit-drift', 5).then((r) => ({ slug: 'spirit-drift', isTime: false, raw: r.leaderboard ?? [] })),
      getDeliveryLeaderboard().then((r) => ({ slug: 'delivery-on-the-wind', isTime: true, raw: r.leaderboard ?? [] })),
      getScoreLeaderboard('spirit-sapling', 5).then((r) => ({ slug: 'spirit-sapling', isTime: false, raw: r.leaderboard ?? [] })),
      getScoreLeaderboard('half-moon', 5).then((r) => ({ slug: 'half-moon', isTime: false, raw: r.leaderboard ?? [] })),
    ]).then((results) => {
      const map: Record<string, DashEntry[]> = {}
      results.forEach((result) => {
        if (result.status !== 'fulfilled') return
        const { slug, isTime, raw } = result.value
        map[slug] = raw.map((e: any) => ({
          rank: e.rank,
          userId: String(e.userId),
          username: e.username ?? 'Unknown',
          avatarUrl: e.avatarUrl ?? null,
          avatarConfig: e.avatarConfig ?? null,
          richAvatarConfig: e.richAvatarConfig ?? null,
          avatarPreference: e.avatarPreference ?? null,
          value: isTime ? (e.bestTimeSeconds ?? 0) : (e.score ?? 0),
          isTime,
        }))
      })
      setLeaderboards(map)
      setLeaderLoading(false)
    })
  }, [])

  // Fetch progress summary for personal bests
  useEffect(() => {
    if (!user) return
    getProgressSummary()
      .then((res) => setProgressSummary((res as any).games ?? []))
      .catch(() => {})
  }, [user])

  // Fetch profile for welcome bar avatar
  useEffect(() => {
    if (!user) return
    getProfile()
      .then((data) => {
        if (!data?.error) {
          setWelcomeAvatar({ avatarUrl: data.avatarUrl, avatarConfig: data.avatarConfig, richAvatarConfig: data.richAvatarConfig ?? null, avatarPreference: data.avatarPreference ?? null })
        }
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'ww_dashboard_bg') setDashBg(e.newValue ?? '')
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => () => {
    if (parallaxFrameRef.current) window.cancelAnimationFrame(parallaxFrameRef.current)
  }, [])

  const handleParallaxMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect()
    const next = { x: ((e.clientX - b.left) / b.width - 0.5) * 1.2, y: ((e.clientY - b.top) / b.height - 0.5) * 1.2 }
    if (parallaxFrameRef.current) window.cancelAnimationFrame(parallaxFrameRef.current)
    parallaxFrameRef.current = window.requestAnimationFrame(() => { setParallax(next); parallaxFrameRef.current = null })
  }

  const gameDuration = (id: string) => {
    if (id === 'spirit-drift')         return '~1 min run'
    if (id === 'delivery-on-the-wind') return '~2 min route'
    return '~3 min nurture'
  }

  // Derived stats for welcome bar
  const totalSessions = progressSummary.reduce((sum, g) => sum + (g.totalSessions ?? 0), 0)
  const lastPlayed = progressSummary
    .filter((g) => g.lastPlayedAt)
    .sort((a, b) => new Date(b.lastPlayedAt!).getTime() - new Date(a.lastPlayedAt!).getTime())[0]

  // Progress data keyed by slug
  const progressBySlug = useMemo(() => {
    const map: Record<string, ProgressGame> = {}
    progressSummary.forEach((g) => { map[g.gameSlug] = g })
    return map
  }, [progressSummary])

  // Top score for score-bar computation
  const topScores = useMemo(() => {
    const map: Record<string, number> = {}
    ;['spirit-drift', 'spirit-sapling', 'half-moon'].forEach((slug) => {
      const top = leaderboards[slug]?.[0]?.value
      if (top) map[slug] = top
    })
    return map
  }, [leaderboards])

  // Leaderboard entries for the selected tab
  const activeLeaderEntries = leaderboards[selectedLeader] ?? []

  const dashBgSrc = dashBg || '/assets/whisperwind-grove.jpg'

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(${dashOverlay}, ${dashOverlay}), url('${dashBgSrc}')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `${50 + parallax.x * 2}% ${50 + parallax.y * 2}%`,
        fontFamily: bodyFontFamily,
        color: 'var(--text-body)',
        boxSizing: 'border-box',
        transition: 'background-position 300ms ease-out',
      }}
      onMouseMove={handleParallaxMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      {/* ── Ambient decorations ── */}
      <img src="/assets/animation/lily-leaf-1.gif" aria-hidden="true" className="ww-deco-img"
        style={{ position: 'absolute', bottom: 0, left: 0, width: 210, height: 'auto', opacity: 0.30, pointerEvents: 'none', animation: 'ww-float-gentle 12s ease-in-out 0s infinite', filter: 'drop-shadow(0 6px 20px rgba(80,140,60,0.35))', zIndex: 0 }} />
      <img src="/assets/animation/lily-leaf-2.gif" aria-hidden="true" className="ww-deco-img"
        style={{ position: 'absolute', bottom: 0, right: 0, width: 185, height: 'auto', opacity: 0.26, pointerEvents: 'none', animation: 'ww-float-gentle 14s ease-in-out 2.5s infinite', filter: 'drop-shadow(0 6px 20px rgba(80,140,60,0.30))', zIndex: 0 }} />
      <img src="/assets/animation/ray-of-light-animation.gif" aria-hidden="true" className="ww-deco-img"
        style={{ position: 'absolute', top: 40, right: '7%', width: 260, height: 'auto', opacity: 0.12, pointerEvents: 'none', animation: 'float-spirit 18s ease-in-out 5s infinite', zIndex: 0 }} />
      <img src="/assets/animation/willow-leaves.gif" aria-hidden="true" className="ww-deco-img"
        style={{ position: 'absolute', top: 0, left: '38%', width: 130, height: 'auto', opacity: 0.18, pointerEvents: 'none', animation: 'float-spirit 10s ease-in-out 1s infinite', filter: 'drop-shadow(0 4px 12px rgba(120,160,80,0.25))', zIndex: 0 }} />

      <div style={{ ...s.shell, position: 'relative', zIndex: 1 }}>

        {/* ── Welcome bar ── */}
        <div style={{ ...s.welcomeBar, background: 'var(--bg-surface)' }}>
          <div style={s.welcomeLeft}>
            <div className="ww-avatar-ring">
              <MiniAvatar
                username={user?.username ?? '?'}
                avatarUrl={welcomeAvatar.avatarUrl}
                avatarConfig={welcomeAvatar.avatarConfig}
                richAvatarConfig={welcomeAvatar.richAvatarConfig}
                avatarPreference={welcomeAvatar.avatarPreference}
                size={44}
              />
            </div>
            <div>
              <p style={{ ...s.welcomeTitle, color: 'var(--text-h)' }}>
                {timeOfDay()}, {user?.username ?? 'traveller'} 🌿
              </p>
              <p style={{ ...s.welcomeSub, color: 'var(--text-muted)' }}>
                Whisperwind Grove
                {totalSessions > 0 && ` · ${totalSessions} session${totalSessions !== 1 ? 's' : ''} played`}
                {lastPlayed && ` · Last: ${GAME_ICONS[lastPlayed.gameSlug] ?? ''} ${timeAgo(lastPlayed.lastPlayedAt)}`}
              </p>
            </div>
          </div>
          <div style={s.statsRow}>
            <div style={{ ...s.statChip, background: 'var(--bg-accent-soft)', border: '1px solid var(--border)' }}>
              <span style={{ ...s.statNum, color: 'var(--text-h)' }}>{playableCount}</span>
              <span style={{ ...s.statLbl, color: 'var(--text-muted)' }}>Playable</span>
            </div>
            <div style={{ ...s.statChip, background: 'var(--bg-accent-soft)', border: '1px solid var(--border)' }}>
              <span style={{ ...s.statNum, color: 'var(--text-h)' }}>{comingSoonCount}</span>
              <span style={{ ...s.statLbl, color: 'var(--text-muted)' }}>Coming Soon</span>
            </div>
          </div>
        </div>

        {/* ── Hero + side panels ── */}
        <div style={s.heroGrid}>
          <section
            style={{
              ...s.heroCard,
              backgroundImage: `linear-gradient(180deg, rgba(10,20,8,0.22), rgba(10,20,8,0.65)), url('${featuredGame.gameBg ?? featuredGame.thumbnail}')`,
            }}
          >
            <div style={s.heroContent}>
              <span style={s.heroPill}>⭐ Featured Game</span>
              <h2 style={s.heroTitle}>{featuredGame.title}</h2>
              <p style={s.heroDesc}>{featuredGame.description}</p>
              <div style={s.heroActions}>
                <button style={s.heroPrimaryBtn} onClick={() => onSelect?.(featuredGame.id)}>Play Now</button>
                <span style={s.heroDuration}>{gameDuration(featuredGame.id)}</span>
              </div>
            </div>
          </section>

          <aside style={s.sideStack}>
            {/* ── Your Best Scores ── */}
            <section style={{ ...s.panel, background: 'var(--bg-surface)' }}>
              <h3 style={{ ...s.panelTitle, color: 'var(--text-h)' }}>Your Best Scores</h3>
              {games.filter((g) => g.available).map((g) => {
                const prog = progressBySlug[g.id]
                const myScore = prog?.highScore ?? null
                const topScore = topScores[g.id] ?? null
                const barPct = (myScore != null && topScore) ? Math.max(6, (myScore / topScore) * 100) : 0
                const isDelivery = g.id === 'delivery-on-the-wind'
                const myTime = isDelivery ? prog?.bestCompletionTimeSeconds ?? null : null
                const displayVal = isDelivery
                  ? (myTime != null ? fmtTime(myTime) : '—')
                  : (myScore != null ? `${myScore} pts` : '—')
                const hasScore = isDelivery ? myTime != null : myScore != null

                return (
                  <div key={g.id} style={{ ...s.scoreRow, background: 'var(--bg-badge)', border: '1px solid var(--border-muted)' }}>
                    <div style={s.scoreRowTop}>
                      <span style={s.scoreGameIcon}>{GAME_ICONS[g.id]}</span>
                      <span style={s.scoreGameName}>{g.title}</span>
                      <span style={{
                        ...s.scoreValue,
                        color: hasScore ? 'var(--accent)' : 'var(--text-muted)',
                        fontFamily: numberFontFamily,
                      }}>
                        {displayVal}
                      </span>
                    </div>
                    {!isDelivery && (
                      <div style={s.scoreBarTrack}>
                        <div className="ww-bar-in" style={{
                          ...s.scoreBarFill,
                          width: `${barPct}%`,
                          background: barPct >= 100
                            ? 'linear-gradient(90deg, #f9c846, #e6a817)'
                            : barPct > 60
                            ? 'linear-gradient(90deg, var(--accent), var(--accent-dark))'
                            : 'var(--chart-fill)',
                        }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </section>

            {/* ── Leaderboard ── */}
            <section style={{ ...s.leaderPanel, flex: 1 }}>
              {/* Game tabs */}
              <div style={s.leaderTabs}>
                {LEADER_GAMES.map((g) => (
                  <button
                    key={g.slug}
                    style={{
                      ...s.leaderTab,
                      ...(selectedLeader === g.slug ? s.leaderTabActive : {}),
                    }}
                    onClick={() => setSelectedLeader(g.slug)}
                    title={g.slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')}
                  >
                    {g.icon} {g.label}
                  </button>
                ))}
              </div>

              <div style={s.leaderHeaderRow}>
                <span style={s.leaderSub}>
                  {selectedLeader === 'delivery-on-the-wind' ? 'FASTEST TIMES' : 'HIGH SCORES'} · TOP 5
                </span>
              </div>

              {leaderLoading ? (
                <p style={s.leaderEmpty}>Loading…</p>
              ) : activeLeaderEntries.length === 0 ? (
                <p style={s.leaderEmpty}>No scores yet — be first!</p>
              ) : (
                activeLeaderEntries.map((entry, i) => {
                  const isSelf = entry.username === user?.username
                  return (
                    <div
                      key={`${entry.userId}-${i}`}
                      style={{
                        ...s.leaderRow,
                        background: isSelf ? 'var(--bg-accent-soft)' : 'var(--bg-badge)',
                        border: isSelf ? '1px solid var(--border-focus)' : '1px solid var(--border-muted)',
                      }}
                    >
                      <span className={i === 0 ? 'ww-medal-1' : i === 1 ? 'ww-medal-2' : i === 2 ? 'ww-medal-3' : ''} style={s.leaderRank}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                      </span>
                      <MiniAvatar
                        username={entry.username}
                        avatarUrl={entry.avatarUrl}
                        avatarConfig={entry.avatarConfig}
                        richAvatarConfig={entry.richAvatarConfig}
                        avatarPreference={entry.avatarPreference}
                        size={24}
                      />
                      <span style={{ ...s.leaderName, fontWeight: isSelf ? 700 : 500, color: isSelf ? 'var(--accent-dark)' : 'var(--text-body)' }}>
                        {entry.username}
                        {isSelf && <span style={s.youBadge}> you</span>}
                      </span>
                      <span style={s.leaderScore}>
                        {entry.isTime ? fmtTime(entry.value) : entry.value}
                      </span>
                    </div>
                  )
                })
              )}
            </section>
          </aside>
        </div>

        {/* ── Filter bar ── */}
        <div style={{ ...s.filterBar, background: 'var(--bg-surface)' }}>
          <div style={s.filterGroup}>
            {(['all', 'playable', 'coming-soon'] as FilterKey[]).map((f) => (
              <button
                key={f}
                style={{
                  ...s.filterBtn,
                  background: filter === f ? 'var(--bark)' : 'var(--bg-badge)',
                  color: filter === f ? 'var(--paper)' : 'var(--text-secondary)',
                  border: `1px solid ${filter === f ? 'transparent' : 'var(--border)'}`,
                  boxShadow: filter === f ? '0 4px 12px rgba(108,88,76,0.3)' : 'none',
                }}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All Games' : f === 'playable' ? '✦ Playable' : '🌱 Coming Soon'}
              </button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            {visibleGames.length} game{visibleGames.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* ── Game grid ── */}
        <div style={s.grid}>
          {visibleGames.length > 0 ? (
            visibleGames.map((g, i) => (
              <GameCard
                key={`${filter}-${g.id}`}
                game={g}
                revealDelayMs={i * 70}
                onPlay={(id) => onSelect?.(id)}
              />
            ))
          ) : (
            <div style={{ ...s.empty, background: 'var(--bg-muted)', border: '1px dashed var(--border-strong)', color: 'var(--text-secondary)' }}>
              No games match this filter yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default GameSelectionScreen

const s: Record<string, React.CSSProperties> = {
  shell: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 18,
  },
  welcomeBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    padding: '14px 18px',
    borderRadius: 14,
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    transition: 'background 220ms ease',
  },
  welcomeLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  welcomeTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 24, lineHeight: 1.1 },
  welcomeSub:   { margin: '3px 0 0', fontSize: 13, lineHeight: 1, color: 'var(--text-muted)' },
  statsRow: { display: 'flex', gap: 10 },
  statChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 14px', borderRadius: 10,
  },
  statNum: { fontFamily: headingFontFamily, fontSize: 22, lineHeight: 1 },
  statLbl: { fontSize: 12, marginTop: 3 },

  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(300px, 1.7fr) minmax(240px, 1fr)',
    gap: 14,
    alignItems: 'stretch',
  },
  heroCard: {
    borderRadius: 18,
    overflow: 'hidden',
    minHeight: 260,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'flex-end',
  },
  heroContent: {
    width: '100%',
    padding: '16px 20px',
    background: 'linear-gradient(180deg, transparent, rgba(10,20,8,0.78))',
    color: '#f8efda',
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  heroPill: {
    display: 'inline-block',
    width: 'fit-content',
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(240,234,210,0.22)',
    border: '1px solid rgba(240,234,210,0.5)',
    fontSize: 13,
    letterSpacing: 0.3,
  },
  heroTitle:      { margin: 0, fontFamily: headingFontFamily, fontSize: 36, color: '#f8efda', lineHeight: 1 },
  heroDesc:       { margin: 0, fontSize: 15, opacity: 0.9, lineHeight: 1.45 },
  heroActions:    { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  heroPrimaryBtn: {
    padding: '9px 18px',
    borderRadius: 10,
    border: 'none',
    background: '#DDE5B6',
    color: '#3F4D26',
    fontFamily: bodyFontFamily,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 6px 14px rgba(0,0,0,0.2)',
  },
  heroDuration: {
    fontSize: 14,
    color: 'rgba(240,234,210,0.75)',
    border: '1px solid rgba(240,234,210,0.35)',
    padding: '6px 10px',
    borderRadius: 8,
  },

  sideStack: { display: 'flex', flexDirection: 'column', gap: 12 },
  panel: {
    borderRadius: 15,
    border: '1px solid var(--border)',
    backdropFilter: 'blur(10px)',
    boxShadow: 'var(--shadow-md)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    transition: 'background 220ms ease',
  },
  panelTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 18 },

  // Score rows
  scoreRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
    padding: '8px 10px',
    borderRadius: 10,
  },
  scoreRowTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  scoreGameIcon: { fontSize: 14, lineHeight: 1, flexShrink: 0 },
  scoreGameName: { flex: 1, fontSize: 13, color: 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  scoreValue: { fontSize: 14, fontWeight: 700, flexShrink: 0 },
  scoreBarTrack: {
    height: 4,
    borderRadius: 999,
    background: 'var(--border-muted)',
    overflow: 'hidden',
    marginTop: 1,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 999,
    transition: 'width 600ms cubic-bezier(0.22,0.61,0.36,1)',
  },

  // Leaderboard panel
  leaderPanel: {
    borderRadius: 15,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-md)',
    padding: '12px 14px',
    color: 'var(--text-body)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    backdropFilter: 'blur(10px)',
  },
  leaderTabs: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    paddingBottom: 8,
    borderBottom: '1px solid var(--border-muted)',
    marginBottom: 4,
  },
  leaderTab: {
    padding: '5px 10px',
    borderRadius: 8,
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 140ms, color 140ms',
  },
  leaderTabActive: {
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
    border: '1px solid var(--border-focus)',
  },
  leaderHeaderRow: { display: 'flex', justifyContent: 'flex-end' },
  leaderSub: { fontSize: 10, letterSpacing: 0.6, color: 'var(--text-muted)', fontWeight: 700 },
  leaderRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 8px', borderRadius: 8,
    transition: 'background 140ms',
  },
  leaderRank: { fontSize: 13, width: 22, textAlign: 'center', flexShrink: 0 },
  leaderName: {
    flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  leaderScore: {
    fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontFamily: numberFontFamily, flexShrink: 0,
  },
  leaderEmpty: { fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '4px 0', margin: 0 },
  youBadge: {
    fontSize: 10, fontWeight: 800, color: 'var(--accent)', background: 'var(--bg-accent-soft)',
    padding: '1px 5px', borderRadius: 4, marginLeft: 2,
  },

  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 13,
    backdropFilter: 'blur(10px)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'background 220ms ease',
  },
  filterGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  filterBtn: {
    padding: '7px 14px',
    borderRadius: 999,
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 150ms ease, color 150ms ease',
    letterSpacing: 0.2,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
    gap: 16,
    alignItems: 'stretch',
  },
  empty: {
    gridColumn: '1/-1',
    padding: 28,
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 16,
  },
}
