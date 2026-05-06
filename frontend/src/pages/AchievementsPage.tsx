import React, { useEffect, useMemo, useState } from 'react'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'
import { getAchievements } from '../lib/api'

type Achievement = {
  code: string
  title: string
  description: string
  earned: boolean
  awardedAt: string | null
}

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAchievements()
      .then((res) => setAchievements(res.achievements ?? []))
      .finally(() => setLoading(false))
  }, [])

  const earnedCount = achievements.filter((achievement) => achievement.earned).length
  const groups = useMemo(() => {
    const sapling = achievements.filter((achievement) => achievement.code.startsWith('sapling_'))
    const games = achievements.filter((achievement) => !achievement.code.startsWith('sapling_'))
    return [
      { title: 'Spirit Sapling', items: sapling },
      { title: 'Game Feats', items: games },
    ]
  }, [achievements])

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h2 style={s.pageTitle}>Achievements</h2>
          <p style={s.pageSub}>Milestones earned across the grove.</p>
        </div>
        <div style={s.counter}>
          <span style={s.counterValue}>{earnedCount}</span>
          <span style={s.counterLabel}>Unlocked</span>
        </div>
      </div>

      {loading ? (
        <p style={s.hint}>Loading achievements...</p>
      ) : (
        <div style={s.groups}>
          {groups.map((group) => (
            <section key={group.title} style={s.group}>
              <h3 style={s.groupTitle}>{group.title}</h3>
              <div style={s.grid}>
                {group.items.map((achievement) => (
                  <article
                    key={achievement.code}
                    style={{
                      ...s.card,
                      ...(achievement.earned ? s.cardEarned : s.cardLocked),
                    }}
                  >
                    <div style={s.badgeIcon}>{achievement.earned ? '🏆' : '🔒'}</div>
                    <div style={s.cardCopy}>
                      <h4 style={s.cardTitle}>{achievement.title}</h4>
                      <p style={s.cardDesc}>{achievement.description}</p>
                      <p style={s.cardMeta}>
                        {achievement.earned ? `Unlocked ${formatDate(achievement.awardedAt)}` : 'Locked'}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    maxWidth: 980,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    fontFamily: bodyFontFamily,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 34, color: 'var(--text-h)' },
  pageSub: { margin: '2px 0 0', fontSize: 14, color: 'var(--text-muted)' },
  counter: {
    minWidth: 110,
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    padding: '10px 14px',
    textAlign: 'center',
    boxShadow: 'var(--shadow-sm)',
  },
  counterValue: { display: 'block', fontFamily: headingFontFamily, fontSize: 30, color: 'var(--accent)' },
  counterLabel: { display: 'block', fontSize: 12, color: 'var(--text-muted)' },
  hint: { margin: 0, color: 'var(--text-muted)' },
  groups: { display: 'flex', flexDirection: 'column', gap: 24 },
  group: { display: 'flex', flexDirection: 'column', gap: 12 },
  groupTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 24, color: 'var(--text-secondary)' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 12,
  },
  card: {
    display: 'flex',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    border: '1px solid var(--border)',
    background: 'var(--bg-surface)',
    boxShadow: 'var(--shadow-sm)',
  },
  cardEarned: { opacity: 1 },
  cardLocked: { opacity: 0.58, filter: 'grayscale(0.35)' },
  badgeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-accent-soft)',
    flexShrink: 0,
    fontSize: 22,
  },
  cardCopy: { minWidth: 0 },
  cardTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 20, color: 'var(--text-h)' },
  cardDesc: { margin: '3px 0 7px', fontSize: 13, lineHeight: 1.35, color: 'var(--text-secondary)' },
  cardMeta: { margin: 0, fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 },
}
