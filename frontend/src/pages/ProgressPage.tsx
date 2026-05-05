import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'
import games from '../components/gameData'

type BestEntry = { slug: string; title: string; score: number | null }

export default function ProgressPage() {
  const { user } = useAuth()
  const [bests, setBests] = useState<BestEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const slugs = games.filter((g) => g.available).map((g) => ({ slug: g.id, title: g.title }))
    Promise.all(
      slugs.map(({ slug, title }) =>
        fetch(`/api/v1/games/${slug}/me`, { headers: { Authorization: `Bearer ${user.token}` } })
          .then((r) => r.json())
          .then((d) => ({ slug, title, score: d.best?.score ?? null }))
          .catch(() => ({ slug, title, score: null }))
      )
    ).then((results) => {
      setBests(results)
      setLoading(false)
    })
  }, [user])

  const totalPlayed = bests.filter((b) => b.score !== null).length

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Your Progress</h2>

      <div style={s.statRow}>
        <div style={s.statCell}>
          <p style={s.statValue}>{totalPlayed}</p>
          <p style={s.statLabel}>Games Played</p>
        </div>
        <div style={s.statCell}>
          <p style={s.statValue}>{bests.length}</p>
          <p style={s.statLabel}>Total Worlds</p>
        </div>
        <div style={s.statCell}>
          <p style={s.statValue}>{bests.length - totalPlayed}</p>
          <p style={s.statLabel}>Unexplored</p>
        </div>
      </div>

      <h3 style={s.sectionTitle}>Personal Bests</h3>

      {loading ? (
        <p style={s.hint}>Loading scores…</p>
      ) : (
        <div style={s.scoreList}>
          {bests.map((b) => (
            <div key={b.slug} style={s.scoreRow}>
              <div style={s.scoreLeft}>
                <span style={s.scoreDot} />
                <span style={s.scoreGame}>{b.title}</span>
              </div>
              <span style={b.score !== null ? s.scoreValue : s.scoreEmpty}>
                {b.score !== null ? `${b.score} pts` : 'Not played yet'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!user && (
        <p style={s.hint}>Sign in to track your scores across sessions.</p>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 640 },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  statRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 },
  statCell: {
    background: 'var(--bg-surface)',
    borderRadius: 14, border: '1px solid var(--border)',
    padding: '16px 12px', textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  statValue: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)', lineHeight: 1 },
  statLabel: { margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)', fontFamily: bodyFontFamily },
  sectionTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 20, color: 'var(--text-secondary)' },
  scoreList: {
    background: 'var(--bg-surface)',
    borderRadius: 16, border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  scoreRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '15px 20px',
    borderBottom: '1px solid var(--border-muted)',
    gap: 12,
  },
  scoreLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  scoreDot: {
    width: 10, height: 10, borderRadius: '50%',
    background: 'linear-gradient(135deg, #ADC178, #6C584C)',
    flexShrink: 0,
  },
  scoreGame: { fontSize: 15, color: 'var(--text-body)', fontWeight: 600, fontFamily: bodyFontFamily },
  scoreValue: { fontSize: 16, fontWeight: 700, color: 'var(--accent)', fontFamily: headingFontFamily },
  scoreEmpty: { fontSize: 14, color: 'var(--text-placeholder)', fontStyle: 'italic', fontFamily: bodyFontFamily },
  hint: { fontSize: 14, color: 'var(--text-muted)', fontFamily: bodyFontFamily, margin: 0 },
}
