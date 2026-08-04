import React from 'react'
import { uiFontFamily, titleFontFamily } from '../../theme/typography'

type Props = {
  onContinue: () => void
}

const MECHANICS = [
  {
    icon: '🌿',
    title: 'Notice Before Acting',
    body: 'Read the sapling’s changing need, then offer the care it is actually asking for.',
  },
  {
    icon: '🔮',
    title: 'Spirit Orbs',
    body: 'Care actions use one orb. A quiet visit is always possible, and kind words can restore energy.',
  },
  {
    icon: '⚡',
    title: 'Forest Events',
    body: 'Droughts, blights, frosts, and storms erupt without warning. Counter them in time — or face the consequences.',
  },
  {
    icon: '✦',
    title: 'One Bound Guardian',
    body: 'Your chosen guardian stays with this sapling for its whole journey and strengthens one kind of care.',
  },
  {
    icon: '🧺',
    title: 'Gentle Harvest',
    body: 'At maturity, watch for ripeness and gather fruit patiently. Hurrying the branch reduces your care bonus.',
  },
]

export default function GameDescriptionPanel({ onContinue }: Props) {
  return (
    <div className="ww-sapling-description-wrap" style={s.wrap}>
      <div className="ww-sapling-description-card" style={s.card}>
        <p style={s.overline}>Welcome to</p>
        <h2 style={s.title}>Spirit Sapling</h2>
        <p style={s.body}>
          A grove-tending game about attention, patience, and trust. Choose a guardian, learn what your sapling
          is communicating, and grow together toward a sacred harvest.
        </p>

        <div className="ww-sapling-mechanic-grid" style={s.mechanicGrid}>
          {MECHANICS.map(({ icon, title, body }) => (
            <div key={title} style={s.mechanicCard}>
              <span style={s.mechanicIcon}>{icon}</span>
              <div>
                <p style={s.mechanicTitle}>{title}</p>
                <p style={s.mechanicBody}>{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={s.lockedNote}>
          <span style={s.lockedNoteIcon}>🔒</span>
          <p style={s.lockedNoteText}>
            Two hidden guardians — <strong>The Wanderer</strong> and <strong>The Silent One</strong> — can be unlocked
            through specific challenges. Check the guardian selection screen to track your progress.
          </p>
        </div>

        <div className="ww-sapling-how-row" style={s.howRow}>
          <div style={s.howItem}>
            <span style={s.howNum}>1</span>
            <span style={s.howText}>Choose your guardian</span>
          </div>
          <div style={s.howArrow}>→</div>
          <div style={s.howItem}>
            <span style={s.howNum}>2</span>
            <span style={s.howText}>Nurture the sapling</span>
          </div>
          <div style={s.howArrow}>→</div>
          <div style={s.howItem}>
            <span style={s.howNum}>3</span>
            <span style={s.howText}>Collect the harvest</span>
          </div>
        </div>

        <button style={s.btn} onClick={onContinue}>
          Begin Your Journey →
        </button>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 16px',
    overflow: 'hidden',
  },
  card: {
    width: 'min(680px, 100%)',
    background: 'rgba(30, 20, 12, 0.82)',
    backdropFilter: 'blur(18px)',
    borderRadius: 22,
    border: '1px solid rgba(242,204,143,0.22)',
    boxShadow: '0 24px 52px rgba(0,0,0,0.55)',
    padding: '28px 32px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
  },
  overline: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    fontWeight: 700,
    color: '#c4a96e',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  title: {
    margin: 0,
    fontFamily: titleFontFamily,
    fontSize: 36,
    color: '#FFF6DF',
    textAlign: 'center',
    lineHeight: 1.1,
  },
  body: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 14,
    color: '#e8dcc4',
    lineHeight: 1.6,
    textAlign: 'center',
  },
  mechanicGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10,
  },
  mechanicCard: {
    display: 'flex',
    gap: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: '10px 12px',
    alignItems: 'flex-start',
  },
  mechanicIcon: {
    fontSize: 20,
    lineHeight: 1,
    flexShrink: 0,
    marginTop: 1,
  },
  mechanicTitle: {
    margin: '0 0 3px',
    fontFamily: uiFontFamily,
    fontSize: 13,
    fontWeight: 700,
    color: '#f2cc8f',
    lineHeight: 1.2,
  },
  mechanicBody: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    color: '#c4bd8e',
    lineHeight: 1.45,
  },
  lockedNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(242,204,143,0.08)',
    border: '1px solid rgba(242,204,143,0.18)',
    borderRadius: 12,
    padding: '10px 14px',
  },
  lockedNoteIcon: { fontSize: 16, flexShrink: 0, lineHeight: 1, marginTop: 1 },
  lockedNoteText: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 12,
    color: '#d9c9a3',
    lineHeight: 1.5,
  },
  howRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  howItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  howNum: {
    width: 28, height: 28,
    borderRadius: '50%',
    background: 'rgba(242,204,143,0.22)',
    border: '1px solid rgba(242,204,143,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: uiFontFamily,
    fontSize: 13,
    fontWeight: 700,
    color: '#f2cc8f',
  } as React.CSSProperties,
  howText: {
    fontFamily: uiFontFamily,
    fontSize: 12,
    color: '#c4bd8e',
    textAlign: 'center',
  },
  howArrow: {
    fontFamily: uiFontFamily,
    fontSize: 16,
    color: 'rgba(242,204,143,0.4)',
    marginTop: -16,
  },
  btn: {
    width: '100%',
    padding: '13px 0',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #8B6B3A, #5A3E20)',
    color: '#FFF6DF',
    fontFamily: uiFontFamily,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.3,
    boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
  },
}
