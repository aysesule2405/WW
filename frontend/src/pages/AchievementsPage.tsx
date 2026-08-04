import React, { useEffect, useMemo, useRef, useState } from 'react'
import { bodyFontFamily, headingFontFamily, numberFontFamily } from '../theme/typography'
import { getAchievements } from '../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
type Category = 'drift' | 'sapling' | 'delivery' | 'halfmoon' | 'grove' | 'secret'
type StatusFilter = 'all' | 'earned' | 'locked'

type Achievement = {
  code: string
  title: string
  description: string
  icon?: string
  rarity?: Rarity
  category?: Category
  earned: boolean
  awardedAt: string | null
  secret?: boolean
  hint?: string
  future?: boolean
}

// ── Static challenge definitions ───────────────────────────────────────────────

type Challenge = {
  code: string
  title: string
  description: string
  icon: string
  game: string
  rarity: Rarity
  goalLabel: string
  future?: boolean
}

const CHALLENGES: Challenge[] = [
  {
    code: 'ch_drift_dawn_run',
    title: 'Sunrise Run',
    description: 'Complete a Spirit Drift session in the Dawn atmosphere before the week ends.',
    icon: '🌅', game: 'Spirit Drift', rarity: 'rare', goalLabel: 'Dawn atmosphere',
    future: true,
  },
  {
    code: 'ch_drift_high_score_week',
    title: 'Wind Sprint',
    description: 'Beat your personal best in Spirit Drift this week.',
    icon: '🌀', game: 'Spirit Drift', rarity: 'common', goalLabel: 'New personal best',
    future: true,
  },
  {
    code: 'ch_delivery_speed',
    title: 'Express Delivery',
    description: 'Complete a Delivery on the Wind run in under 50 seconds.',
    icon: '⚡', game: 'Delivery on the Wind', rarity: 'rare', goalLabel: 'Under 50 seconds',
    future: true,
  },
  {
    code: 'ch_delivery_all_maps',
    title: 'Grand Tour',
    description: 'Complete one delivery on every available map this week.',
    icon: '🧭', game: 'Delivery on the Wind', rarity: 'epic', goalLabel: 'All maps cleared',
    future: true,
  },
  {
    code: 'ch_sapling_harmony_chain',
    title: 'Harmony Streak',
    description: 'Earn the harmony bonus in 3 consecutive Spirit Sapling sessions.',
    icon: '🌸', game: 'Spirit Sapling', rarity: 'epic', goalLabel: '3-session harmony streak',
    future: true,
  },
  {
    code: 'ch_sapling_hidden',
    title: 'Seed Hunter',
    description: 'Find 5 hidden seeds scattered through the sapling grove.',
    icon: '🌰', game: 'Spirit Sapling', rarity: 'rare', goalLabel: '5 hidden seeds',
    future: true,
  },
  {
    code: 'ch_halfmoon_special',
    title: 'Card Mastery',
    description: 'Play 3 special cards in a single Half Moon session.',
    icon: '✴️', game: 'Rise of the Half Moon', rarity: 'epic', goalLabel: '3 special cards',
    future: true,
  },
  {
    code: 'ch_halfmoon_win_streak',
    title: 'Lunar Dominance',
    description: 'Win 3 Half Moon games in a row.',
    icon: '👑', game: 'Rise of the Half Moon', rarity: 'rare', goalLabel: '3-win streak',
    future: true,
  },
  {
    code: 'ch_grove_variety',
    title: 'Grove Explorer',
    description: 'Play all 4 grove games at least once today.',
    icon: '🗺️', game: 'All Games', rarity: 'rare', goalLabel: 'All 4 games today',
    future: true,
  },
]

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORY_TABS: { key: Category | 'all'; label: string; icon: string }[] = [
  { key: 'all',      label: 'All',          icon: '🏆' },
  { key: 'grove',    label: 'Grove',        icon: '🌲' },
  { key: 'drift',    label: 'Spirit Drift', icon: '🌊' },
  { key: 'sapling',  label: 'Sapling',      icon: '🌱' },
  { key: 'delivery', label: 'Delivery',     icon: '📦' },
  { key: 'halfmoon', label: 'Half Moon',    icon: '🌙' },
  { key: 'secret',   label: 'Secrets',      icon: '🔮' },
]

const RARITY_STYLE: Record<Rarity, { border: string; glow: string; badge: string; label: string }> = {
  common:    { border: 'var(--border)',            glow: 'none',                                      badge: '#7a8a9a', label: 'Common'    },
  rare:      { border: '#4a9fe0',                  glow: '0 0 0 2px rgba(74,159,224,0.18)',           badge: '#4a9fe0', label: 'Rare'      },
  epic:      { border: '#9b6fdf',                  glow: '0 0 0 2px rgba(155,111,223,0.22)',          badge: '#9b6fdf', label: 'Epic'      },
  legendary: { border: '#d4960c',                  glow: '0 0 0 3px rgba(212,150,12,0.28)',           badge: '#d4960c', label: 'Legendary' },
}

// ── Konami code easter egg ─────────────────────────────────────────────────────

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

function useKonami(onActivate: () => void) {
  const seq = useRef<string[]>([])
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      seq.current.push(e.key)
      if (seq.current.length > KONAMI.length) seq.current.shift()
      if (seq.current.join(',') === KONAMI.join(',')) {
        seq.current = []
        onActivate()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onActivate])
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(value: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function rarityOf(a: Achievement): Rarity {
  return a.rarity ?? 'common'
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KonamiToast({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3800); return () => clearTimeout(t) }, [onDone])
  return (
    <div style={s.konamiToast}>
      <div style={s.konamiInner}>
        <span style={{ fontSize: 36, lineHeight: 1 }}>🌀</span>
        <div>
          <p style={s.konamiTitle}>Ancient Ritual Activated</p>
          <p style={s.konamiSub}>The old spirits remember... ↑↑↓↓←→←→BA</p>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ value, max, color = 'var(--accent)' }: { value: number; max: number; color?: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))
  return (
    <div style={s.progressTrack}>
      <div style={{ ...s.progressFill, width: `${pct}%`, background: color }} />
    </div>
  )
}

function RarityBadge({ rarity }: { rarity: Rarity }) {
  const rs = RARITY_STYLE[rarity]
  return (
    <span style={{ ...s.rarityBadge, background: rs.badge + '22', color: rs.badge, border: `1px solid ${rs.badge}55` }}>
      {rs.label}
    </span>
  )
}

function AchievementCard({ a }: { a: Achievement }) {
  const rarity = rarityOf(a)
  const rs = RARITY_STYLE[rarity]
  const isSecretLocked = a.secret && !a.earned
  const icon = isSecretLocked ? '🔮' : (a.icon ?? (a.earned ? '🏆' : '🔒'))

  return (
    <article style={{
      ...s.card,
      ...(a.earned ? s.cardEarned : s.cardLocked),
      borderColor: a.earned ? rs.border : 'var(--border)',
      boxShadow: a.earned ? rs.glow : 'none',
    }}>
      {/* Icon */}
      <div style={{
        ...s.cardIcon,
        background: a.earned ? rs.badge + '22' : 'var(--bg-badge)',
        fontSize: isSecretLocked ? 20 : 24,
      }}>
        {icon}
      </div>

      {/* Body */}
      <div style={s.cardBody}>
        <div style={s.cardTitleRow}>
          <h4 style={{ ...s.cardTitle, color: a.earned ? 'var(--text-h)' : 'var(--text-muted)' }}>
            {isSecretLocked ? '???' : a.title}
          </h4>
          {a.future && <span style={s.futureBadge}>Soon</span>}
        </div>
        <p style={s.cardDesc}>
          {isSecretLocked ? (a.hint ?? 'This secret is waiting to be discovered.') : a.description}
        </p>
        <div style={s.cardFooter}>
          <RarityBadge rarity={rarity} />
          <span style={{ ...s.cardMeta, color: a.earned ? 'var(--accent-dark)' : 'var(--text-muted)' }}>
            {a.earned ? `✓ ${formatDate(a.awardedAt)}` : a.future ? 'Not yet available' : 'Locked'}
          </span>
        </div>
      </div>
    </article>
  )
}

function ChallengeCard({ ch }: { ch: Challenge }) {
  const rs = RARITY_STYLE[ch.rarity]
  return (
    <article style={{ ...s.card, borderColor: ch.future ? 'var(--border)' : rs.border, opacity: ch.future ? 0.65 : 1, boxShadow: ch.future ? 'none' : rs.glow }}>
      <div style={{ ...s.cardIcon, background: rs.badge + '22', fontSize: 22 }}>
        {ch.icon}
      </div>
      <div style={s.cardBody}>
        <div style={s.cardTitleRow}>
          <h4 style={{ ...s.cardTitle, color: 'var(--text-h)' }}>{ch.title}</h4>
          {ch.future
            ? <span style={s.futureBadge}>Soon</span>
            : <span style={{ ...s.futureBadge, background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)', border: '1px solid var(--border-focus)' }}>Active</span>
          }
        </div>
        <p style={s.cardDesc}>{ch.description}</p>
        <div style={s.cardFooter}>
          <RarityBadge rarity={ch.rarity} />
          <span style={{ ...s.cardMeta, color: 'var(--text-muted)' }}>
            {ch.game} · {ch.goalLabel}
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Category progress pill ─────────────────────────────────────────────────────

function CategoryPill({
  tab, achievements, active, onClick,
}: {
  tab: typeof CATEGORY_TABS[number]
  achievements: Achievement[]
  active: boolean
  onClick: () => void
}) {
  const items = (tab.key === 'all' ? achievements : achievements.filter((a) => a.category === tab.key))
    .filter((a) => !a.future)
  const earned = items.filter((a) => a.earned).length
  const total  = items.length
  return (
    <button
      style={{ ...s.catTab, ...(active ? s.catTabActive : {}) }}
      onClick={onClick}
      aria-pressed={active}
    >
      <span style={{ fontSize: 15 }}>{tab.icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{tab.label}</span>
      <span style={{ ...s.catBadge, ...(active ? s.catBadgeActive : {}) }}>{earned}/{total}</span>
    </button>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'achievements' | 'challenges'>('achievements')
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showKonami, setShowKonami] = useState(false)

  useKonami(() => setShowKonami(true))

  useEffect(() => {
    getAchievements()
      .then((res) => setAchievements(res.achievements ?? []))
      .finally(() => setLoading(false))
  }, [])

  const availableAchievements = achievements.filter((a) => !a.future)
  const earnedCount = availableAchievements.filter((a) => a.earned).length
  const totalCount  = availableAchievements.length
  const lockedCount = Math.max(0, totalCount - earnedCount)
  const futureCount = achievements.filter((a) => a.future).length
  const pct = totalCount === 0 ? 0 : Math.round((earnedCount / totalCount) * 100)
  const latestEarned = [...availableAchievements]
    .filter((a) => a.earned && a.awardedAt)
    .sort((a, b) => new Date(b.awardedAt ?? 0).getTime() - new Date(a.awardedAt ?? 0).getTime())[0]

  const filtered = useMemo(() => {
    const categoryItems = activeCategory === 'all'
      ? achievements
      : achievements.filter((a) => (a.category ?? 'grove') === activeCategory)
    if (statusFilter === 'earned') return categoryItems.filter((a) => a.earned && !a.future)
    if (statusFilter === 'locked') return categoryItems.filter((a) => !a.earned && !a.future)
    return categoryItems
  }, [achievements, activeCategory, statusFilter])

  // Sort: earned first (by date desc), then locked non-secret, then locked secret, then future
  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aFuture = a.future ? 1 : 0
    const bFuture = b.future ? 1 : 0
    if (aFuture !== bFuture) return aFuture - bFuture
    if (a.earned && !b.earned) return -1
    if (!a.earned && b.earned) return 1
    if (a.earned && b.earned) return new Date(b.awardedAt ?? 0).getTime() - new Date(a.awardedAt ?? 0).getTime()
    // Both locked: non-secret before secret
    if (a.secret && !b.secret) return 1
    if (!a.secret && b.secret) return -1
    return 0
  }), [filtered])

  return (
    <div className="ww-responsive-page ww-achievements-page" style={s.page}>
      {showKonami && <KonamiToast onDone={() => setShowKonami(false)} />}

      {/* ── Header ── */}
      <div className="ww-responsive-page-header" style={s.header}>
        <div>
          <h2 style={s.pageTitle}>Achievements</h2>
          <p style={s.pageSub}>Milestones and challenges across the grove.</p>
        </div>
        <div style={s.counterBlock}>
          <span style={s.counterValue}>{earnedCount}</span>
          <span style={s.counterDenom}>/{totalCount}</span>
          <span style={s.counterLabel}>unlocked</span>
        </div>
      </div>

      {/* ── Overall progress ── */}
      <div className="ww-achievement-overview" style={s.overviewCard}>
        <div style={s.overallProgress}>
          <div style={s.overallProgressRow}>
            <span style={s.overallLabel}>Available achievement completion</span>
            <span style={{ ...s.overallLabel, color: 'var(--accent-dark)', fontWeight: 700 }}>{pct}%</span>
          </div>
          <ProgressBar value={earnedCount} max={totalCount} />
          <p style={s.progressNote}>Coming-soon achievements are excluded, so reaching 100% is always possible.</p>
        </div>
        <div className="ww-achievement-summary" style={s.summaryGrid}>
          <div style={s.summaryItem}><strong>{earnedCount}</strong><span>Earned</span></div>
          <div style={s.summaryItem}><strong>{lockedCount}</strong><span>Ready to pursue</span></div>
          <div style={s.summaryItem}><strong>{futureCount}</strong><span>Growing soon</span></div>
        </div>
        {latestEarned && (
          <div className="ww-achievement-latest" style={s.latestUnlock}>
            <span style={s.latestIcon}>{latestEarned.icon ?? '🏆'}</span>
            <div>
              <span style={s.latestLabel}>Latest unlock</span>
              <strong style={s.latestTitle}>{latestEarned.title}</strong>
            </div>
            <span style={s.latestDate}>{formatDate(latestEarned.awardedAt)}</span>
          </div>
        )}
      </div>

      {/* ── Page tabs ── */}
      <div className="ww-scroll-tabs" style={s.pageTabs}>
        {(['achievements', 'challenges'] as const).map((tab) => (
          <button
            key={tab}
            style={{ ...s.pageTab, ...(activeTab === tab ? s.pageTabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'achievements' ? '🏆 Achievements' : '⚔️ Challenge roadmap'}
          </button>
        ))}
      </div>

      {activeTab === 'achievements' ? (
        <>
          {/* ── Category filter ── */}
          <div className="ww-scroll-tabs" style={s.catBar}>
            {CATEGORY_TABS.map((tab) => (
              <CategoryPill
                key={tab.key}
                tab={tab}
                achievements={achievements}
                active={activeCategory === tab.key}
                onClick={() => setActiveCategory(tab.key)}
              />
            ))}
          </div>

          <div className="ww-achievement-toolbar" style={s.statusBar}>
            <span style={s.statusLabel}>{sorted.length} shown</span>
            <div style={s.statusPills}>
              {(['all', 'earned', 'locked'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  style={{ ...s.statusPill, ...(statusFilter === status ? s.statusPillActive : {}) }}
                  onClick={() => setStatusFilter(status)}
                  aria-pressed={statusFilter === status}
                >
                  {status === 'all' ? 'All' : status === 'earned' ? '✓ Earned' : '○ Locked'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <p style={s.hint}>Loading achievements…</p>
          ) : sorted.length === 0 ? (
            <p style={s.hint}>Nothing here yet.</p>
          ) : (
            <div className="ww-achievement-grid" style={s.grid}>
              {sorted.map((a) => <AchievementCard key={a.code} a={a} />)}
            </div>
          )}
        </>
      ) : (
        <>
          {/* ── Challenges section ── */}
          <div style={s.challengeNote}>
            <span style={{ fontSize: 18 }}>⚔️</span>
            <div>
              <p style={s.challengeNoteTitle}>Challenge roadmap</p>
              <p style={s.challengeNoteDesc}>
                These planned rotations are shown as previews. They will become active once weekly progress and expiry are stored server-side.
              </p>
            </div>
          </div>
          <div className="ww-achievement-grid" style={s.grid}>
            {CHALLENGES.map((ch) => <ChallengeCard key={ch.code} ch={ch} />)}
          </div>
        </>
      )}

      {/* ── Easter egg hint (always visible, bottom of achievements tab) ── */}
      {activeTab === 'achievements' && !loading && (
        <p style={s.easterHint}>
          🌿 Some secrets can only be found by those who look at the right hour... or know an ancient sequence.
        </p>
      )}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    padding: '28px 32px',
    maxWidth: 1020,
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    fontFamily: bodyFontFamily,
  },

  // Header
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap',
  },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 34, color: 'var(--text-h)' },
  pageSub:   { margin: '2px 0 0', fontSize: 14, color: 'var(--text-muted)' },
  counterBlock: {
    display: 'flex', alignItems: 'baseline', gap: 2,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 14, padding: '10px 18px', boxShadow: 'var(--shadow-sm)',
    flexShrink: 0,
  },
  counterValue: { fontFamily: numberFontFamily, fontSize: 30, color: 'var(--accent)', lineHeight: 1 },
  counterDenom: { fontFamily: numberFontFamily, fontSize: 18, color: 'var(--text-muted)' },
  counterLabel: { fontSize: 12, color: 'var(--text-muted)', marginLeft: 6, alignSelf: 'center' },

  // Progress
  overallProgress: { display: 'flex', flexDirection: 'column', gap: 6 },
  overallProgressRow: { display: 'flex', justifyContent: 'space-between' },
  overallLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 },
  progressTrack: {
    height: 8, borderRadius: 999,
    background: 'var(--chart-track)',
    border: '1px solid var(--border-muted)',
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999, transition: 'width 600ms ease' },
  overviewCard: {
    display: 'flex', flexDirection: 'column', gap: 14,
    padding: '16px 18px', borderRadius: 16,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  progressNote: { margin: 0, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  summaryItem: {
    display: 'flex', flexDirection: 'column', gap: 2,
    padding: '10px 12px', borderRadius: 11,
    background: 'var(--bg-badge)', border: '1px solid var(--border-muted)',
    color: 'var(--text-muted)', fontSize: 11,
  },
  latestUnlock: {
    display: 'grid', gridTemplateColumns: '38px minmax(0, 1fr) auto', alignItems: 'center', gap: 10,
    padding: '10px 12px', borderRadius: 12,
    background: 'var(--bg-accent-soft)', border: '1px solid var(--border-focus)',
  },
  latestIcon: { fontSize: 24, lineHeight: 1 },
  latestLabel: { display: 'block', color: 'var(--text-muted)', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 },
  latestTitle: { display: 'block', color: 'var(--text-h)', fontFamily: headingFontFamily, fontSize: 16 },
  latestDate: { color: 'var(--text-muted)', fontSize: 11 },

  // Page tabs
  pageTabs: { display: 'flex', gap: 8, borderBottom: '2px solid var(--border-muted)', paddingBottom: 0 },
  pageTab: {
    padding: '8px 18px', borderRadius: '10px 10px 0 0',
    background: 'transparent', border: '1px solid transparent',
    color: 'var(--text-muted)', fontFamily: bodyFontFamily,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 150ms',
  },
  pageTabActive: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderBottomColor: 'var(--bg-surface)',
    color: 'var(--text-body)',
    marginBottom: -2,
  },

  // Category filter
  catBar: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  catTab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 12px', borderRadius: 999,
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    color: 'var(--text-muted)', fontFamily: bodyFontFamily,
    cursor: 'pointer', transition: 'all 150ms',
    boxShadow: 'var(--shadow-sm)',
  },
  catTabActive: {
    background: 'var(--bg-accent-soft)',
    border: '1px solid var(--border-focus)',
    color: 'var(--text-body)',
  },
  catBadge: {
    fontFamily: numberFontFamily, fontSize: 11, fontWeight: 700,
    background: 'var(--bg-badge)', color: 'var(--text-muted)',
    borderRadius: 999, padding: '1px 7px',
  },
  catBadgeActive: { background: 'var(--accent)', color: 'var(--bg-surface)' },
  statusBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
    padding: '8px 10px', borderRadius: 12,
    background: 'var(--bg-surface)', border: '1px solid var(--border-muted)',
  },
  statusLabel: { fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 },
  statusPills: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  statusPill: {
    padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border)',
    background: 'var(--bg-badge)', color: 'var(--text-muted)',
    fontFamily: bodyFontFamily, fontSize: 11, fontWeight: 700, cursor: 'pointer',
  },
  statusPillActive: { background: 'var(--bg-accent-soft)', borderColor: 'var(--border-focus)', color: 'var(--accent-dark)' },

  // Cards
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
    gap: 12,
  },
  card: {
    display: 'flex', gap: 14, padding: '14px 16px',
    borderRadius: 14, border: '1px solid var(--border)',
    background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)',
    transition: 'box-shadow 200ms, border-color 200ms',
  },
  cardEarned: { opacity: 1 },
  cardLocked: { opacity: 0.82 },
  cardIcon: {
    width: 48, height: 48, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardBody: { minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 4 },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 17, lineHeight: 1.2 },
  cardDesc: { margin: 0, fontSize: 12, lineHeight: 1.4, color: 'var(--text-secondary)', flex: 1 },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  cardMeta: { fontSize: 11, fontWeight: 700 },

  rarityBadge: {
    fontSize: 10, fontWeight: 700, borderRadius: 4,
    padding: '2px 7px', letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    flexShrink: 0,
  },
  futureBadge: {
    fontSize: 10, fontWeight: 700, borderRadius: 4,
    padding: '2px 7px', letterSpacing: '0.04em',
    background: 'var(--bg-badge)', color: 'var(--text-muted)',
    border: '1px solid var(--border-muted)',
    flexShrink: 0,
  },

  // Challenges note
  challengeNote: {
    display: 'flex', alignItems: 'flex-start', gap: 14,
    background: 'var(--bg-accent-soft)', border: '1px solid var(--border-focus)',
    borderRadius: 14, padding: '14px 18px',
  },
  challengeNoteTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 16, color: 'var(--text-h)' },
  challengeNoteDesc: { margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 },

  // Easter egg hint
  easterHint: {
    margin: 0, fontSize: 12, color: 'var(--text-muted)',
    fontStyle: 'italic', textAlign: 'center' as const,
    paddingTop: 8,
  },

  // Konami toast
  konamiToast: {
    position: 'fixed' as const,
    top: 24, left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    pointerEvents: 'none' as const,
    animation: 'slideDown 0.4s ease',
  },
  konamiInner: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'linear-gradient(135deg, #2a1508, #4a2a08)',
    border: '2px solid #d4960c',
    borderRadius: 16, padding: '14px 22px',
    boxShadow: '0 0 0 4px rgba(212,150,12,0.2), 0 8px 32px rgba(0,0,0,0.4)',
    minWidth: 280,
  },
  konamiTitle: {
    margin: 0, fontFamily: headingFontFamily, fontSize: 18,
    color: '#f9c846', lineHeight: 1,
  },
  konamiSub: {
    margin: '5px 0 0', fontSize: 12, color: '#d4b870',
    fontFamily: bodyFontFamily, letterSpacing: '0.05em',
  },

  hint: { margin: 0, color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 14 },
}
