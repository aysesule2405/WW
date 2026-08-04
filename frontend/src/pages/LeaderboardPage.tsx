import React, { useEffect, useState } from 'react'
import { bodyFontFamily, headingFontFamily, numberFontFamily } from '../theme/typography'
import { getScoreLeaderboard, getDeliveryLeaderboard, mediaUrl, type AvatarConfig } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { AvatarSvg, DEFAULT_RICH_AVATAR, type RichAvatarConfig } from '../components/AvatarCreator'

// ── Types ─────────────────────────────────────────────────────────────────────

type Row = {
  rank: number
  userId: string
  username: string
  avatarUrl?: string | null
  avatarConfig?: AvatarConfig | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
  value: number
  achievedAt: string
}

type Board = {
  slug: string
  title: string
  icon: string
  kind: 'score' | 'time'
  rows: Row[]
  loading: boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDAL = ['🥇', '🥈', '🥉']
const AVATAR_PALETTE = ['#4a7c59', '#6b5c3e', '#5c6b9e', '#7a3c5c', '#3c6b7a', '#7a6b3c', '#3c5c7a']

function rowAvatarColor(name: string) {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length]
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

function parseRichAvatar(raw: string | null | undefined): RichAvatarConfig | null {
  if (!raw) return null
  try {
    const parsed = { ...DEFAULT_RICH_AVATAR, ...JSON.parse(raw) }
    return JSON.stringify(parsed) !== JSON.stringify(DEFAULT_RICH_AVATAR) ? parsed : null
  } catch { return null }
}

function PlayerAvatar({
  username,
  avatarUrl,
  avatarConfig,
  richAvatarConfig,
  avatarPreference,
  size = 28,
  ringColor,
}: {
  username: string
  avatarUrl?: string | null
  avatarConfig?: AvatarConfig | null
  richAvatarConfig?: string | null
  avatarPreference?: 'photo' | 'rich' | null
  size?: number
  ringColor?: string
}) {
  const ring: React.CSSProperties = ringColor
    ? { border: `2px solid ${ringColor}` }
    : { border: '1px solid var(--border)' }

  const richAvatar = parseRichAvatar(richAvatarConfig)
  const showRich = avatarPreference === 'rich' ? !!richAvatar : richAvatar && !avatarUrl

  if (showRich && richAvatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, lineHeight: 0, ...ring }}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }
  if (avatarUrl) {
    return (
      <img
        src={mediaUrl(avatarUrl)}
        alt=""
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, ...ring }}
      />
    )
  }
  if (richAvatar) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, lineHeight: 0, ...ring }}>
        <AvatarSvg config={richAvatar} size={size} />
      </div>
    )
  }
  if (avatarConfig) {
    const cfg = avatarConfig
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: `radial-gradient(circle at 35% 25%, #fff5, transparent 34%), ${cfg.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.5), flexShrink: 0, ...ring }}>
        {cfg.face}
      </div>
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: rowAvatarColor(username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.36), fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '0.03em', ...ring }}>
      {username.slice(0, 2).toUpperCase()}
    </div>
  )
}

// ── Podium ────────────────────────────────────────────────────────────────────

const PODIUM_HEIGHTS = [78, 56, 42] // 1st, 2nd, 3rd
const PODIUM_GRADIENTS = [
  'linear-gradient(180deg,#f9c846,#d4960c)',
  'linear-gradient(180deg,#d0d8e0,#9aabb8)',
  'linear-gradient(180deg,#d4a070,#a06040)',
]
const PODIUM_RING_COLORS = ['#d4960c', '#9aabb8', '#a06040']

function PodiumBlock({ row, pos, isSelf }: { row: Row; pos: 0 | 1 | 2; isSelf: boolean }) {
  const blockH = PODIUM_HEIGHTS[pos]
  const ringColor = isSelf ? 'var(--accent)' : PODIUM_RING_COLORS[pos]

  return (
    <div className="ww-podium-block" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: pos === 0 ? '0 0 140px' : '0 0 110px' }}>
      {/* Avatar + medal */}
      <div style={{ position: 'relative' }}>
        <PlayerAvatar
          username={row.username}
          avatarUrl={row.avatarUrl}
          avatarConfig={row.avatarConfig}
          richAvatarConfig={row.richAvatarConfig}
          avatarPreference={row.avatarPreference}
          size={pos === 0 ? 52 : 40}
          ringColor={ringColor}
        />
        <span style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', fontSize: pos === 0 ? 20 : 16, lineHeight: 1 }}>
          {MEDAL[pos]}
        </span>
      </div>
      {/* Name + score */}
      <div style={{ textAlign: 'center', paddingTop: 10 }}>
        <p style={{ margin: 0, fontSize: pos === 0 ? 13 : 12, fontWeight: 700, color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: pos === 0 ? 130 : 100 }}>
          {row.username}
        </p>
        <p style={{ margin: '2px 0 0', fontFamily: numberFontFamily, fontSize: pos === 0 ? 15 : 13, fontWeight: 700, color: 'var(--accent)' }}>
          {row.value}
        </p>
      </div>
      {/* Podium block */}
      <div style={{ width: '100%', height: blockH, borderRadius: '8px 8px 0 0', background: PODIUM_GRADIENTS[pos], boxShadow: '0 2px 8px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
        <span style={{ fontFamily: headingFontFamily, fontSize: pos === 0 ? 18 : 15, color: 'rgba(255,255,255,0.85)', fontWeight: 700 }}>
          {pos + 1 === 1 ? '1st' : pos + 1 === 2 ? '2nd' : '3rd'}
        </span>
      </div>
    </div>
  )
}

function Podium({ board, selfUsername }: { board: Board; selfUsername: string | null }) {
  if (board.rows.length < 3) return null
  const first = board.rows[0]
  const second = board.rows[1]
  const third = board.rows[2]

  return (
    <div style={sl.podiumWrap}>
      {/* order: 2nd, 1st, 3rd */}
      <div className="ww-podium-row" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
        <PodiumBlock row={second} pos={1} isSelf={selfUsername !== null && second.username === selfUsername} />
        <PodiumBlock row={first}  pos={0} isSelf={selfUsername !== null && first.username === selfUsername} />
        <PodiumBlock row={third}  pos={2} isSelf={selfUsername !== null && third.username === selfUsername} />
      </div>
    </div>
  )
}

// ── Score bar row ─────────────────────────────────────────────────────────────

function LeaderboardRow({ row, board, maxValue, isSelf }: {
  row: Row
  board: Board
  maxValue: number
  isSelf: boolean
}) {
  const barRatio = board.kind === 'time'
    ? maxValue === row.value ? 0.08 : (maxValue - row.value) / Math.max(1, maxValue - (board.rows[board.rows.length - 1]?.value ?? 0))
    : maxValue === 0 ? 0 : row.value / maxValue
  const barPct = Math.max(4, barRatio * 100)

  const valueLabel = board.kind === 'time' ? formatTime(row.value) : `${row.value} pts`

  return (
    <div className="ww-leaderboard-row" style={{ ...sl.lbRow, ...(isSelf ? sl.lbRowSelf : {}) }}>
      {/* Rank */}
      <div style={sl.lbRank}>
        {row.rank <= 3
          ? <span style={{ fontSize: 18, lineHeight: 1 }}>{MEDAL[row.rank - 1]}</span>
          : <span style={{ fontFamily: numberFontFamily, fontSize: 13, color: 'var(--text-muted)' }}>#{row.rank}</span>
        }
      </div>
      {/* Avatar */}
      <PlayerAvatar
        username={row.username}
        avatarUrl={row.avatarUrl}
        avatarConfig={row.avatarConfig}
        richAvatarConfig={row.richAvatarConfig}
        avatarPreference={row.avatarPreference}
        size={28}
      />
      {/* Name + bar */}
      <div style={sl.lbNameBar}>
        <span style={{ fontSize: 13, fontWeight: 600, color: isSelf ? 'var(--accent)' : 'var(--text-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.username}{isSelf ? ' (you)' : ''}
        </span>
        <div style={sl.lbBarTrack}>
          <div style={{ ...sl.lbBarFill, width: `${barPct}%`, background: isSelf ? 'var(--accent)' : 'linear-gradient(90deg, var(--chart-accent-strong), var(--chart-accent))' }} />
        </div>
      </div>
      {/* Value + date */}
      <div style={sl.lbValueCol}>
        <span style={{ fontFamily: numberFontFamily, fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>{valueLabel}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(row.achievedAt)}</span>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useAuth()
  const selfUsername = user?.username ?? null

  const [boards, setBoards] = useState<Board[]>([
    { kind: 'score', slug: 'spirit-drift',         title: 'Spirit Drift',         icon: '🌊', rows: [], loading: true },
    { kind: 'time',  slug: 'delivery-on-the-wind', title: 'Delivery on the Wind', icon: '📦', rows: [], loading: true },
    { kind: 'score', slug: 'spirit-sapling',       title: 'Spirit Sapling',       icon: '🌱', rows: [], loading: true },
    { kind: 'score', slug: 'half-moon',            title: 'Rise of the Half Moon',icon: '🌙', rows: [], loading: true },
  ])
  const [activeSlug, setActiveSlug] = useState('spirit-drift')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const update = (slug: string, rows: Row[]) =>
      setBoards((prev) => prev.map((b) => b.slug === slug ? { ...b, rows, loading: false } : b))

    getScoreLeaderboard('spirit-drift', 50).then((res) => {
      const raw = (res.leaderboard ?? []) as Array<{ rank: number; userId: string; username: string; avatarUrl?: string | null; avatarConfig?: AvatarConfig | null; score: number; achievedAt: string }>
      update('spirit-drift', raw.map((r) => ({ rank: r.rank, userId: r.userId, username: r.username, avatarUrl: r.avatarUrl, avatarConfig: r.avatarConfig, value: r.score, achievedAt: r.achievedAt })))
    })
    getDeliveryLeaderboard().then((res) => {
      const raw = (res.leaderboard ?? []) as Array<{ rank: number; userId: string; username: string; avatarUrl?: string | null; avatarConfig?: AvatarConfig | null; bestTimeSeconds: number; achievedAt: string }>
      update('delivery-on-the-wind', raw.map((r) => ({ rank: r.rank, userId: r.userId, username: r.username, avatarUrl: r.avatarUrl, avatarConfig: r.avatarConfig, value: r.bestTimeSeconds, achievedAt: r.achievedAt })))
    })
    getScoreLeaderboard('spirit-sapling', 50).then((res) => {
      const raw = (res.leaderboard ?? []) as Array<{ rank: number; userId: string; username: string; avatarUrl?: string | null; avatarConfig?: AvatarConfig | null; score: number; achievedAt: string }>
      update('spirit-sapling', raw.map((r) => ({ rank: r.rank, userId: r.userId, username: r.username, avatarUrl: r.avatarUrl, avatarConfig: r.avatarConfig, value: r.score, achievedAt: r.achievedAt })))
    })
    getScoreLeaderboard('half-moon', 50).then((res) => {
      const raw = (res.leaderboard ?? []) as Array<{ rank: number; userId: string; username: string; avatarUrl?: string | null; avatarConfig?: AvatarConfig | null; score: number; achievedAt: string }>
      update('half-moon', raw.map((r) => ({ rank: r.rank, userId: r.userId, username: r.username, avatarUrl: r.avatarUrl, avatarConfig: r.avatarConfig, value: r.score, achievedAt: r.achievedAt })))
    })
  }, [])

  const activeBoard = boards.find((b) => b.slug === activeSlug) ?? boards[0]

  const filtered = search.trim().length === 0
    ? activeBoard.rows
    : activeBoard.rows.filter((r) => r.username.toLowerCase().includes(search.trim().toLowerCase()))

  // Self rank detection
  const selfRow = selfUsername ? activeBoard.rows.find((r) => r.username === selfUsername) : null

  // For bar calculation: max value in filtered set (or whole board for consistent scale)
  const maxValue = activeBoard.kind === 'time'
    ? Math.max(...activeBoard.rows.map((r) => r.value), 1)
    : Math.max(...activeBoard.rows.map((r) => r.value), 1)

  return (
    <div className="ww-responsive-page ww-leaderboard-page" style={sl.page}>
      <h2 style={sl.pageTitle}>Grove Leaderboard</h2>
      <p style={sl.pageSub}>Honoring the dedicated spirits of the Whispering Grove.</p>

      {/* Tab bar */}
      <div className="ww-scroll-tabs" style={sl.tabBar}>
        {boards.map((b) => {
          const isActive = b.slug === activeSlug
          return (
            <button
              key={b.slug}
              style={{ ...sl.tab, ...(isActive ? sl.tabActive : {}) }}
              onClick={() => { setActiveSlug(b.slug); setSearch('') }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>{b.icon}</span>
              <span style={{ fontSize: 13 }}>{b.title}</span>
              {isActive && !b.loading && (
                <span style={sl.tabBadge}>{b.rows.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Panel */}
      <div className="ww-leaderboard-panel" style={sl.panel}>
        {activeBoard.loading ? (
          <p style={sl.empty}>Loading…</p>
        ) : activeBoard.rows.length === 0 ? (
          <p style={sl.empty}>No entries yet — be the first!</p>
        ) : (
          <>
            {/* Self rank banner */}
            {selfRow && (
              <div style={sl.selfBanner}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>
                  {selfRow.rank <= 3 ? MEDAL[selfRow.rank - 1] : '🎮'}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-body)' }}>
                  Your rank in <strong>{activeBoard.title}</strong>: #{selfRow.rank}
                  {selfRow.rank === 1 && ' — Top of the Grove!'}
                  {selfRow.rank === 2 && ' — So close to the top!'}
                  {selfRow.rank === 3 && ' — On the podium!'}
                </span>
              </div>
            )}

            {/* Podium (top 3) */}
            <Podium board={activeBoard} selfUsername={selfUsername} />

            {/* Search */}
            <div className="ww-leaderboard-search" style={sl.searchRow}>
              <div style={sl.searchWrap}>
                <span style={sl.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search players…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={sl.searchInput}
                />
                {search.length > 0 && (
                  <button style={sl.searchClear} onClick={() => setSearch('')} aria-label="Clear search">
                    ✕
                  </button>
                )}
              </div>
              <span style={sl.searchCount}>
                {filtered.length} {filtered.length === 1 ? 'player' : 'players'}
              </span>
            </div>

            {/* Rows list (skip top 3 in unfiltered view, show all in search) */}
            <div style={sl.rowList}>
              {filtered.length === 0 ? (
                <p style={sl.empty}>No players match "{search}"</p>
              ) : (
                (search.trim() ? filtered : filtered.slice(3)).map((row) => (
                  <LeaderboardRow
                    key={row.userId}
                    row={row}
                    board={activeBoard}
                    maxValue={maxValue}
                    isSelf={selfUsername !== null && row.username === selfUsername}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sl: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    display: 'flex', flexDirection: 'column', gap: 20,
    maxWidth: 880, fontFamily: bodyFontFamily,
  },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  pageSub:   { margin: '-14px 0 0', fontSize: 13, color: 'var(--text-muted)' },

  // Tabs
  tabBar: {
    display: 'flex', gap: 8, flexWrap: 'wrap',
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 999,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    cursor: 'pointer', fontFamily: bodyFontFamily,
    color: 'var(--text-muted)', transition: 'all 150ms',
    boxShadow: 'var(--shadow-sm)',
  },
  tabActive: {
    background: 'var(--bg-accent-soft)',
    border: '1px solid var(--border-focus)',
    color: 'var(--text-body)',
    fontWeight: 700,
  },
  tabBadge: {
    background: 'var(--accent)',
    color: 'var(--bg-surface)',
    borderRadius: 999, fontSize: 11, fontWeight: 700,
    padding: '1px 7px', fontFamily: numberFontFamily,
  },

  // Panel
  panel: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 18,
    boxShadow: 'var(--shadow-sm)',
    padding: '20px 24px',
    display: 'flex', flexDirection: 'column', gap: 18,
  },

  // Self banner
  selfBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'var(--bg-accent-soft)',
    border: '1px solid var(--border-focus)',
    borderRadius: 12, padding: '10px 16px',
  },

  // Podium
  podiumWrap: {
    padding: '8px 0 0',
    borderBottom: '1px solid var(--border-muted)',
    paddingBottom: 20,
  },

  // Search
  searchRow: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  searchWrap: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--bg-input)', border: '1px solid var(--border)',
    borderRadius: 999, padding: '6px 14px',
  },
  searchIcon: { fontSize: 14, flexShrink: 0 },
  searchInput: {
    flex: 1, border: 'none', outline: 'none', background: 'transparent',
    fontFamily: bodyFontFamily, fontSize: 13, color: 'var(--text-body)',
  },
  searchClear: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    color: 'var(--text-muted)', fontSize: 12, padding: '0 2px',
    lineHeight: 1,
  },
  searchCount: {
    fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
  },

  // Row list
  rowList: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  lbRow: {
    display: 'grid',
    gridTemplateColumns: '44px 34px 1fr 120px',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 10,
    transition: 'background 120ms',
  },
  lbRowSelf: {
    background: 'var(--bg-accent-soft)',
    border: '1px solid var(--border-focus)',
    borderRadius: 10,
  },
  lbRank: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36,
  },
  lbNameBar: {
    display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0,
  },
  lbBarTrack: {
    height: 6, borderRadius: 999,
    background: 'var(--chart-track)',
    border: '1px solid var(--border-muted)',
    overflow: 'hidden',
  },
  lbBarFill: {
    height: '100%', borderRadius: 999,
    transition: 'width 400ms ease',
  },
  lbValueCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1,
  },

  empty: { margin: 0, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' },
}
