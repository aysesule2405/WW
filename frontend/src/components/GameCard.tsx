import React from 'react'
import type { GameInfo } from './gameData'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'

type Status = 'playable' | 'coming-soon' | 'in-progress'

type Props = {
  game: GameInfo
  onPlay?: (id: string) => void
  revealDelayMs?: number
  status?: Status
}

const STATUS_CONFIG: Record<Status, { label: string; bg: string; color: string; dot: string }> = {
  'playable':    { label: 'Playable',    bg: 'rgba(90,160,48,0.18)',  color: '#2E6810', dot: '#5AA030' },
  'coming-soon': { label: 'Coming Soon', bg: 'rgba(108,88,76,0.14)',  color: 'var(--text-secondary)', dot: 'var(--bark)' },
  'in-progress': { label: 'In Progress', bg: 'rgba(200,134,10,0.16)', color: '#7A4A00', dot: '#C8860A' },
}

const GAME_META: Record<string, { mode: string; duration: string }> = {
  'spirit-drift':         { mode: 'Arcade',   duration: '~1 min' },
  'delivery-on-the-wind': { mode: 'Strategy', duration: '~2 min' },
  'spirit-sapling':       { mode: 'Nurture',  duration: '~3 min' },
}

export default function GameCard({ game, onPlay, revealDelayMs = 0, status }: Props) {
  const resolvedStatus: Status = status ?? (game.available ? 'playable' : 'coming-soon')
  const st = STATUS_CONFIG[resolvedStatus]
  const meta = GAME_META[game.id] ?? { mode: 'Game', duration: '~? min' }
  const bgImage = game.gameBg ?? game.thumbnail

  return (
    <div
      style={{ ...s.card, animationDelay: `${revealDelayMs}ms` }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-7px)'
        el.style.boxShadow = 'var(--shadow-hover)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'var(--shadow-md)'
      }}
    >
      {/* 16/9 image */}
      <div style={s.imageWrap}>
        {bgImage ? (
          <img src={bgImage} alt={game.title} style={s.image} />
        ) : (
          <div style={s.imageFallback}>
            <span style={s.fallbackText}>{game.title}</span>
          </div>
        )}
        <div style={s.imageOverlay} />
        <div style={{ ...s.statusBadge, background: st.bg, color: st.color }}>
          <span style={{ ...s.statusDot, background: st.dot }} />
          {st.label}
        </div>
      </div>

      {/* Body */}
      <div style={s.body}>
        <div style={s.metaRow}>
          <span style={s.badge}>{meta.mode}</span>
          <span style={s.badge}>⏱ {meta.duration}</span>
        </div>
        <h3 style={s.title}>{game.title}</h3>
        <p style={s.description}>{game.description}</p>
        <div style={s.footer}>
          {resolvedStatus === 'playable' ? (
            <button
              style={s.playBtn}
              onClick={() => onPlay?.(game.id)}
              onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.97)' }}
              onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            >
              Play Now
            </button>
          ) : resolvedStatus === 'in-progress' ? (
            <div style={s.altPill}>In Development 🌱</div>
          ) : (
            <div style={s.altPill}>Coming Soon ✦</div>
          )}
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: 'var(--bg-surface)',
    borderRadius: 18,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-md)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 200ms ease, box-shadow 220ms ease, background 220ms ease, border-color 220ms ease',
    animation: 'card-reveal 560ms cubic-bezier(0.22, 1, 0.36, 1) both',
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    background: 'var(--bg-muted)',
    overflow: 'hidden',
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #d9e6bf, #adc178)',
  },
  fallbackText: {
    fontFamily: headingFontFamily,
    fontSize: 22,
    color: '#4A3020',
    textAlign: 'center',
    padding: '0 16px',
  },
  imageOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.3) 100%)',
    pointerEvents: 'none',
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    fontFamily: bodyFontFamily,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.25)',
    lineHeight: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    flexShrink: 0,
  },
  body: {
    padding: '14px 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    flex: 1,
  },
  metaRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  badge: {
    borderRadius: 999,
    border: '1px solid var(--border)',
    background: 'var(--bg-badge)',
    color: 'var(--text-secondary)',
    fontFamily: bodyFontFamily,
    fontSize: 12,
    padding: '4px 9px',
    lineHeight: 1,
  },
  title: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 22,
    color: 'var(--text-h)',
    lineHeight: 1.1,
  },
  description: {
    margin: 0,
    fontFamily: bodyFontFamily,
    fontSize: 14,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    flex: 1,
  },
  footer: { marginTop: 'auto', paddingTop: 4 },
  playBtn: {
    width: '100%',
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    color: 'var(--text-on-dark)',
    fontFamily: bodyFontFamily,
    fontSize: 15,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(58,88,32,0.3)',
    transition: 'transform 120ms ease',
    letterSpacing: 0.3,
  },
  altPill: {
    textAlign: 'center',
    padding: '9px 0',
    borderRadius: 10,
    border: '1px dashed var(--border-strong)',
    color: 'var(--text-muted)',
    fontFamily: bodyFontFamily,
    fontSize: 14,
    fontStyle: 'italic',
  },
}
