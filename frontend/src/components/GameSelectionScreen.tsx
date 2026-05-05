import React, { useState, useEffect, useMemo, useRef } from 'react'
import GameCard from './GameCard'
import games from './gameData'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

type Props = {
  onSelect?: (id: string) => void
  onLogout?: () => void
}

type FilterKey = 'all' | 'playable' | 'coming-soon'

type LeaderboardEntry = {
  userId: number
  username: string
  avatarUrl?: string
  score: number
}

export const GameSelectionScreen: React.FC<Props> = ({ onSelect }) => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [filter, setFilter] = useState<FilterKey>('all')
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const parallaxFrameRef = useRef<number | null>(null)

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [myBests, setMyBests] = useState<Record<string, number | null>>({})

  const playableCount = useMemo(() => games.filter((g) => g.available).length, [])
  const comingSoonCount = games.length - playableCount
  const featuredGame = useMemo(() => games.find((g) => g.available) ?? games[0], [])
  const visibleGames = useMemo(() => {
    if (filter === 'playable')    return games.filter((g) => g.available)
    if (filter === 'coming-soon') return games.filter((g) => !g.available)
    return games
  }, [filter])

  useEffect(() => {
    fetch('/api/v1/games/spirit-drift/leaderboard?limit=5')
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .catch(() => setLeaderboard([]))
      .finally(() => setLeaderboardLoading(false))
  }, [])

  useEffect(() => {
    if (!user) return
    const slugs = games.filter((g) => g.available).map((g) => g.id)
    Promise.all(
      slugs.map((slug) =>
        fetch(`/api/v1/games/${slug}/me`, { headers: { Authorization: `Bearer ${user.token}` } })
          .then((r) => r.json())
          .then((d) => ({ slug, score: d.best?.score ?? null }))
          .catch(() => ({ slug, score: null }))
      )
    ).then((results) => {
      const map: Record<string, number | null> = {}
      results.forEach(({ slug, score }) => { map[slug] = score })
      setMyBests(map)
    })
  }, [user])

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

  // Theme-sensitive values
  const blendColor = isDark ? 'rgba(14,20,8,0.90)' : 'rgba(232,224,200,0.84)'
  const welcomeBg  = isDark ? 'rgba(28,36,20,0.94)' : 'rgba(255,255,255,0.72)'
  const panelBg    = isDark ? 'rgba(28,36,20,0.96)' : 'rgba(255,255,255,0.84)'
  const filterBg   = isDark ? 'rgba(24,32,16,0.90)' : 'rgba(255,255,255,0.72)'

  return (
    <div
      style={{
        minHeight: '100vh',
        padding: 24,
        backgroundImage: `url('/assets/whisperwind-grove.jpg')`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundBlendMode: 'multiply',
        backgroundColor: blendColor,
        backgroundPosition: `${50 + parallax.x * 2}% ${50 + parallax.y * 2}%`,
        fontFamily: bodyFontFamily,
        color: 'var(--text-body)',
        boxSizing: 'border-box',
        transition: 'background-color 250ms ease, background-position 300ms ease-out',
      }}
      onMouseMove={handleParallaxMove}
      onMouseLeave={() => setParallax({ x: 0, y: 0 })}
    >
      <div style={s.shell}>

        {/* Welcome bar */}
        <div style={{ ...s.welcomeBar, background: welcomeBg }}>
          <div>
            <p style={{ ...s.welcomeTitle, color: 'var(--text-h)' }}>
              Welcome back, {user?.username ?? 'traveller'} 🌿
            </p>
            <p style={{ ...s.welcomeSub, color: 'var(--text-muted)' }}>
              Whisperwind Grove · Cozy mini-game platform
            </p>
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

        {/* Hero + panels */}
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
            {/* Best scores */}
            <section style={{ ...s.panel, background: panelBg }}>
              <h3 style={{ ...s.panelTitle, color: 'var(--text-h)' }}>Your Best Scores</h3>
              {games.filter((g) => g.available).map((g) => (
                <div key={g.id} style={{ ...s.scoreRow, background: 'var(--bg-badge)', border: '1px solid var(--border-muted)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-body)' }}>{g.title}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>
                    {myBests[g.id] != null ? `${myBests[g.id]} pts` : '—'}
                  </span>
                </div>
              ))}
            </section>

            {/* Leaderboard */}
            <section style={s.leaderPanel}>
              <div style={s.leaderHeader}>
                <h3 style={s.leaderTitle}>Spirit Drift</h3>
                <span style={s.leaderSub}>TOP 5</span>
              </div>
              {leaderboardLoading ? (
                <p style={s.leaderEmpty}>Loading…</p>
              ) : leaderboard.length === 0 ? (
                <p style={s.leaderEmpty}>No scores yet — be first!</p>
              ) : (
                leaderboard.map((entry, i) => (
                  <div key={entry.userId} style={s.leaderRow}>
                    <span style={s.leaderRank}>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}</span>
                    <div style={s.leaderAvatar}>{entry.username?.[0]?.toUpperCase()}</div>
                    <span style={s.leaderName}>{entry.username}</span>
                    <span style={s.leaderScore}>{entry.score}</span>
                  </div>
                ))
              )}
            </section>
          </aside>
        </div>

        {/* Filter bar */}
        <div style={{ ...s.filterBar, background: filterBg }}>
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

        {/* Game grid */}
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
  welcomeTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 24, lineHeight: 1.1 },
  welcomeSub:   { margin: '3px 0 0', fontSize: 13, lineHeight: 1 },
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
  heroTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 36, color: '#f8efda', lineHeight: 1 },
  heroDesc:  { margin: 0, fontSize: 15, opacity: 0.9, lineHeight: 1.45 },
  heroActions: { display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
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
  panelTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 19 },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 10px',
    borderRadius: 8,
  },
  leaderPanel: {
    borderRadius: 15,
    border: '1px solid rgba(173,193,120,0.2)',
    background: 'linear-gradient(180deg, rgba(22,34,14,0.96), rgba(16,26,10,0.98))',
    boxShadow: 'var(--shadow-md)',
    padding: '14px 16px',
    color: '#d4e8b4',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  leaderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' },
  leaderTitle:  { margin: 0, fontFamily: headingFontFamily, fontSize: 19 },
  leaderSub:    { fontSize: 11, opacity: 0.6, letterSpacing: 0.5 },
  leaderRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 8px', borderRadius: 8, background: 'rgba(255,255,255,0.06)',
  },
  leaderRank:   { fontSize: 12, opacity: 0.65, width: 20, textAlign: 'center', flexShrink: 0 },
  leaderAvatar: {
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg,#ADC178,#6C584C)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, fontWeight: 700, color: '#fff',
  },
  leaderName:   { flex: 1, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  leaderScore:  { fontSize: 14, fontWeight: 700 },
  leaderEmpty:  { fontSize: 13, opacity: 0.55, textAlign: 'center', padding: '4px 0', margin: 0 },

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
