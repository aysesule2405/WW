import React from 'react'
import { uiFontFamily, titleFontFamily } from '../../theme/typography'

type Props = {
  onContinue: () => void
}

const STATS = [
  { icon: '🌱', label: 'Saplings grown' },
  { icon: '🍑', label: 'Fruits collected' },
  { icon: '✨', label: 'Harmony bonus' },
  { icon: '🏆', label: 'Final score' },
]

export default function GameDescriptionPanel({ onContinue }: Props) {
  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <p style={s.overline}>Welcome to</p>
        <h2 style={s.title}>Spirit Sapling</h2>
        <p style={s.body}>
          A gentle growth game where you guide a small magical sapling through care, timing,
          and guardian support. Choose a guardian to shape your play style, nurture your sapling
          with water, sunlight, and kind words, and collect fruits before the journey ends.
        </p>

        <div style={s.guardianNote}>
          <span style={s.guardianIcon}>🦌</span>
          <p style={s.guardianText}>
            Each guardian brings a unique voice and energy. Your guardian will speak to the sapling,
            and the sapling listens — kind words make it grow.
          </p>
        </div>

        <div style={s.statGrid}>
          {STATS.map(({ icon, label }) => (
            <div key={label} style={s.statItem}>
              <span style={s.statIcon}>{icon}</span>
              <span style={s.statLabel}>{label}</span>
            </div>
          ))}
        </div>

        <div style={s.howRow}>
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
          Choose Your Guardian →
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
    width: 'min(660px, 100%)',
    background: 'rgba(30, 20, 12, 0.78)',
    backdropFilter: 'blur(18px)',
    borderRadius: 22,
    border: '1px solid rgba(242,204,143,0.22)',
    boxShadow: '0 24px 52px rgba(0,0,0,0.55)',
    padding: '28px 32px 24px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
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
  guardianNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    background: 'rgba(242,204,143,0.1)',
    border: '1px solid rgba(242,204,143,0.2)',
    borderRadius: 12,
    padding: '12px 16px',
  },
  guardianIcon: { fontSize: 24, flexShrink: 0, lineHeight: 1 },
  guardianText: {
    margin: 0,
    fontFamily: uiFontFamily,
    fontSize: 13,
    color: '#d9c9a3',
    lineHeight: 1.5,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 8,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: '10px 6px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  statIcon: { fontSize: 20, lineHeight: 1 },
  statLabel: {
    fontFamily: uiFontFamily,
    fontSize: 11,
    color: '#c4bd8e',
    textAlign: 'center',
    lineHeight: 1.3,
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
