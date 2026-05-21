import { useEffect, useRef, useState } from 'react'
import { bodyFontFamily, headingFontFamily, readableFontFamily } from '../theme/typography'

// ─── Types ────────────────────────────────────────────────────────────────────

type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

type Notif = {
  id: number
  code: string
  title: string
  description: string
  icon: string
  rarity: Rarity
}

// ─── Rarity palette ───────────────────────────────────────────────────────────

const RARITY_COLOR: Record<Rarity, string> = {
  common:    '#6AAF60',
  rare:      '#5A8FD4',
  epic:      '#9A60D4',
  legendary: '#E6A817',
}
const RARITY_LABEL: Record<Rarity, string> = {
  common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary',
}

const AUTO_DISMISS_MS = 6500

// ─── Single card ─────────────────────────────────────────────────────────────

function Card({ notif, onClose }: { notif: Notif; onClose: () => void }) {
  const rarity = (notif.rarity ?? 'common') as Rarity
  const color  = RARITY_COLOR[rarity] ?? RARITY_COLOR.common

  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      padding: '14px 40px 16px 14px',
      width: 'min(330px, calc(100vw - 36px))',
      borderRadius: 14,
      background: 'linear-gradient(135deg, rgba(26,42,20,0.97) 0%, rgba(58,38,16,0.97) 100%)',
      border: `1.5px solid ${color}55`,
      boxShadow: `0 18px 42px rgba(0,0,0,0.48), 0 0 22px ${color}33`,
      color: '#FFF6DF',
      pointerEvents: 'auto',
      overflow: 'hidden',
      animation: 'achievement-toast-in 360ms cubic-bezier(0.16,1,0.3,1) both',
    }}>
      {/* Top accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}66)`,
      }} />

      {/* Shrinking progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, height: 2,
        background: `${color}88`,
        animation: `ww-toast-progress ${AUTO_DISMISS_MS}ms linear both`,
      }} />

      {/* Icon bubble */}
      <div style={{
        width: 46, height: 46, borderRadius: 12, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}22`,
        border: `1px solid ${color}44`,
        fontSize: 26,
        animation: 'bloom-pulse 2.6s ease-in-out infinite',
        filter: `drop-shadow(0 2px 8px ${color}55)`,
      }}>
        {notif.icon}
      </div>

      {/* Text */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          margin: '0 0 2px',
          fontFamily: readableFontFamily,
          fontSize: 10,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color,
        }}>
          Achievement · {RARITY_LABEL[rarity]}
        </p>
        <h3 style={{
          margin: '0 0 4px',
          fontFamily: headingFontFamily,
          fontSize: 17,
          lineHeight: 1.1,
          color: '#FFF6DF',
        }}>
          {notif.title}
        </h3>
        <p style={{
          margin: 0,
          fontFamily: bodyFontFamily,
          fontSize: 12,
          lineHeight: 1.4,
          color: 'rgba(255,246,223,0.78)',
        }}>
          {notif.description}
        </p>
      </div>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: 8, right: 10,
          border: 'none', background: 'transparent',
          color: 'rgba(255,246,223,0.55)', fontSize: 20,
          cursor: 'pointer', lineHeight: 1, padding: 2,
          transition: 'color 120ms',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#ff9090' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,246,223,0.55)' }}
      >
        ×
      </button>
    </div>
  )
}

// ─── Global container — mount once in AppShell ────────────────────────────────

export default function AchievementToast() {
  const [toasts, setToasts] = useState<Notif[]>([])
  const nextId = useRef(0)

  const dismiss = (id: number) => setToasts((p) => p.filter((t) => t.id !== id))

  useEffect(() => {
    const handler = (e: Event) => {
      const a = (e as CustomEvent).detail
      if (!a?.title) return
      const id = nextId.current++
      const notif: Notif = {
        id,
        code:        a.code        ?? '',
        title:       a.title       ?? 'Achievement Unlocked',
        description: a.description ?? '',
        icon:        a.icon        ?? '🏅',
        rarity:      a.rarity      ?? 'common',
      }
      setToasts((p) => [...p.slice(-4), notif])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    }
    window.addEventListener('ww-achievement', handler)
    return () => window.removeEventListener('ww-achievement', handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <Card key={t.id} notif={t} onClose={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

// Kept for backward compat — game components that still import this type won't break
export type UnlockedAchievement = {
  code: string; title: string; description: string; iconUrl?: string | null
}
