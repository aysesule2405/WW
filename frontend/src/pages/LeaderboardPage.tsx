import React, { useEffect, useState } from 'react'
import { bodyFontFamily, headingFontFamily, numberFontFamily } from '../theme/typography'
import { getScoreLeaderboard, getDeliveryLeaderboard } from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type ScoreRow = {
  rank: number
  userId: string
  username: string
  score: number
  achievedAt: string
}

type TimeRow = {
  rank: number
  userId: string
  username: string
  bestTimeSeconds: number
  achievedAt: string
}

type GameBoard =
  | { kind: 'score'; slug: string; title: string; icon: string; rows: ScoreRow[]; loading: boolean }
  | { kind: 'time';  slug: string; title: string; icon: string; rows: TimeRow[];  loading: boolean }

// ── Constants ─────────────────────────────────────────────────────────────────

const MEDAL = ['🥇', '🥈', '🥉']

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RankBadge({ rank }: { rank: number }) {
  if (rank <= 3) return <span style={s.medal}>{MEDAL[rank - 1]}</span>
  return <span style={s.rankNum}>{rank}</span>
}

function ScoreTable({ rows }: { rows: ScoreRow[] }) {
  if (rows.length === 0) return <p style={s.empty}>No entries yet — be the first!</p>
  return (
    <div style={s.table}>
      <div style={s.tableHead}>
        <span style={s.colRank}>#</span>
        <span style={s.colName}>Player</span>
        <span style={s.colScore}>Score</span>
        <span style={s.colDate}>Date</span>
      </div>
      {rows.map((row) => (
        <div key={row.userId} style={{ ...s.tableRow, ...(row.rank <= 3 ? s.tableRowTop : {}) }}>
          <span style={s.colRank}><RankBadge rank={row.rank} /></span>
          <span style={s.colName}>{row.username}</span>
          <span style={s.colScore}>{row.score} pts</span>
          <span style={s.colDate}>{formatDate(row.achievedAt)}</span>
        </div>
      ))}
    </div>
  )
}

function TimeTable({ rows }: { rows: TimeRow[] }) {
  if (rows.length === 0) return <p style={s.empty}>No entries yet — be the first!</p>
  return (
    <div style={s.table}>
      <div style={s.tableHead}>
        <span style={s.colRank}>#</span>
        <span style={s.colName}>Player</span>
        <span style={s.colScore}>Best Time</span>
        <span style={s.colDate}>Date</span>
      </div>
      {rows.map((row) => (
        <div key={row.userId} style={{ ...s.tableRow, ...(row.rank <= 3 ? s.tableRowTop : {}) }}>
          <span style={s.colRank}><RankBadge rank={row.rank} /></span>
          <span style={s.colName}>{row.username}</span>
          <span style={s.colScore}>{formatTime(row.bestTimeSeconds)}</span>
          <span style={s.colDate}>{formatDate(row.achievedAt)}</span>
        </div>
      ))}
    </div>
  )
}

function GameSection({ board }: { board: GameBoard }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={s.section}>
      <button style={s.sectionHeader} onClick={() => setOpen((v) => !v)}>
        <div style={s.sectionLeft}>
          <span style={s.sectionIcon}>{board.icon}</span>
          <div>
            <p style={s.sectionTitle}>{board.title}</p>
            <p style={s.sectionSub}>
              {board.kind === 'time' ? 'Fastest completions' : 'Highest scores'}
            </p>
          </div>
        </div>
        <span style={s.arrow}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={s.sectionBody}>
          {board.loading ? (
            <p style={s.empty}>Loading…</p>
          ) : board.kind === 'score' ? (
            <ScoreTable rows={board.rows} />
          ) : (
            <TimeTable rows={board.rows} />
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [boards, setBoards] = useState<GameBoard[]>([
    { kind: 'score', slug: 'spirit-drift',         title: 'Spirit Drift',          icon: '🌊', rows: [], loading: true },
    { kind: 'time',  slug: 'delivery-on-the-wind', title: 'Delivery on the Wind',  icon: '📦', rows: [], loading: true },
    { kind: 'score', slug: 'spirit-sapling',       title: 'Spirit Sapling',        icon: '🌱', rows: [], loading: true },
    { kind: 'score', slug: 'half-moon',            title: 'Rise of the Half Moon', icon: '🌙', rows: [], loading: true },
  ])

  useEffect(() => {
    const update = (slug: string, data: Partial<GameBoard>) =>
      setBoards((prev) => prev.map((b) => (b.slug === slug ? { ...b, ...data } as GameBoard : b)))

    getScoreLeaderboard('spirit-drift', 25).then((res) =>
      update('spirit-drift', { rows: res.leaderboard ?? [], loading: false })
    )
    getDeliveryLeaderboard().then((res) =>
      update('delivery-on-the-wind', { rows: res.leaderboard ?? [], loading: false })
    )
    getScoreLeaderboard('spirit-sapling', 25).then((res) =>
      update('spirit-sapling', { rows: res.leaderboard ?? [], loading: false })
    )
    getScoreLeaderboard('half-moon', 25).then((res) =>
      update('half-moon', { rows: res.leaderboard ?? [], loading: false })
    )
  }, [])

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Grove Leaderboard</h2>
      <p style={s.pageSub}>Honoring the dedicated spirits of the Whispering Grove.</p>

      <div style={s.boardList}>
        {boards.map((board) => (
          <GameSection key={board.slug} board={board} />
        ))}
      </div>
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

  boardList: { display: 'flex', flexDirection: 'column', gap: 10 },

  section: {
    background: 'var(--bg-surface)', borderRadius: 16,
    border: '1px solid var(--border)', overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  sectionHeader: {
    width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', background: 'transparent', border: 'none',
    cursor: 'pointer', textAlign: 'left', gap: 12,
  },
  sectionLeft:  { display: 'flex', alignItems: 'center', gap: 12 },
  sectionIcon:  { fontSize: 26, lineHeight: 1 },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-body)', fontFamily: bodyFontFamily },
  sectionSub:   { margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' },
  arrow:        { fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 },

  sectionBody: {
    borderTop: '1px solid var(--border-muted)',
    padding: '12px 20px 16px',
  },

  table: { display: 'flex', flexDirection: 'column', gap: 0 },
  tableHead: {
    display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px',
    padding: '6px 10px',
    borderBottom: '1px solid var(--border-muted)',
    fontSize: 11, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700,
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '40px 1fr 100px 100px',
    padding: '9px 10px',
    borderBottom: '1px solid var(--border-muted)',
    alignItems: 'center',
    fontSize: 14, color: 'var(--text-body)',
    transition: 'background 120ms',
  },
  tableRowTop: { background: 'rgba(173,193,120,0.06)' },

  colRank:  { display: 'flex', alignItems: 'center' },
  colName:  { fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 },
  colScore: { fontWeight: 700, color: 'var(--accent)', fontFamily: numberFontFamily, fontSize: 15 },
  colDate:  { fontSize: 12, color: 'var(--text-muted)' },

  medal:   { fontSize: 20, lineHeight: 1 },
  rankNum: { fontSize: 14, color: 'var(--text-muted)', fontFamily: numberFontFamily },

  empty: { margin: 0, fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' },
}
