import React, { useState } from 'react'
import { bodyFontFamily, headingFontFamily } from '../theme/typography'

type Toggle = { key: string; label: string; description: string }

const TOGGLES: Toggle[] = [
  { key: 'sound',        label: 'Sound Effects',    description: 'Play in-game sounds and click audio.' },
  { key: 'music',        label: 'Background Music',  description: 'Ambient grove music during gameplay.' },
  { key: 'reduceMotion', label: 'Reduce Motion',     description: 'Limit animations for accessibility.' },
  { key: 'particles',    label: 'Particle Effects',  description: 'Wind particles and sparkle bursts.' },
]

function loadSettings(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem('ww_settings')
    return raw ? JSON.parse(raw) : { sound: true, music: true, reduceMotion: false, particles: true }
  } catch {
    return { sound: true, music: true, reduceMotion: false, particles: true }
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, boolean>>(loadSettings)
  const [saved, setSaved] = useState(false)

  const toggle = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem('ww_settings', JSON.stringify(next))
      return next
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.pageTitle}>Settings</h2>
        {saved && <span style={s.savedBadge}>✓ Saved</span>}
      </div>

      <div style={s.section}>
        <h3 style={s.sectionTitle}>Game Preferences</h3>
        <div style={s.toggleList}>
          {TOGGLES.map((t) => (
            <div key={t.key} style={s.toggleRow}>
              <div style={s.toggleInfo}>
                <p style={s.toggleLabel}>{t.label}</p>
                <p style={s.toggleDesc}>{t.description}</p>
              </div>
              <button
                style={{ ...s.toggleBtn, ...(settings[t.key] ? s.toggleOn : s.toggleOff) }}
                onClick={() => toggle(t.key)}
                aria-pressed={settings[t.key]}
              >
                <span style={{ ...s.toggleThumb, transform: settings[t.key] ? 'translateX(20px)' : 'translateX(0)' }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div style={s.section}>
        <h3 style={s.sectionTitle}>About</h3>
        <div style={s.aboutCard}>
          <p style={s.aboutLine}><strong>Whisperwind Grove</strong> — Cozy mini-game platform</p>
          <p style={s.aboutLine}>Version 0.1.0 · Built with React + Phaser 3</p>
          <p style={s.aboutLine}>© 2025 Whisperwind Grove</p>
        </div>
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 580 },
  header: { display: 'flex', alignItems: 'center', gap: 14 },
  pageTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 32, color: 'var(--text-h)' },
  savedBadge: {
    fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)',
    background: 'var(--bg-accent-soft)', border: '1px solid var(--border-focus)',
    borderRadius: 8, padding: '4px 10px', fontFamily: bodyFontFamily,
  },
  section: { display: 'flex', flexDirection: 'column', gap: 14 },
  sectionTitle: { margin: 0, fontFamily: headingFontFamily, fontSize: 20, color: 'var(--text-secondary)' },
  toggleList: {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-muted)',
    gap: 16,
  },
  toggleInfo: { display: 'flex', flexDirection: 'column', gap: 3 },
  toggleLabel: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-body)', fontFamily: bodyFontFamily },
  toggleDesc: { margin: 0, fontSize: 13, color: 'var(--text-muted)', fontFamily: bodyFontFamily },
  toggleBtn: {
    position: 'relative',
    width: 44,
    height: 24,
    borderRadius: 12,
    border: 'none',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 200ms ease',
    padding: 0,
  },
  toggleOn:  { background: 'var(--accent)' },
  toggleOff: { background: 'var(--border-strong)' },
  toggleThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'transform 200ms ease',
  },
  aboutCard: {
    background: 'var(--bg-surface)',
    borderRadius: 14,
    border: '1px solid var(--border)',
    padding: '18px 22px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: 'var(--shadow-sm)',
  },
  aboutLine: { margin: 0, fontSize: 14, color: 'var(--text-secondary)', fontFamily: bodyFontFamily },
}
