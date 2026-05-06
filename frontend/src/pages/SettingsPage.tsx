import React, { useState } from 'react'
import { uiFontFamily, titleFontFamily } from '../theme/typography'
import { useTheme } from '../context/ThemeContext'
import { THEME_META, GAME_THEMES, type ColorTheme } from '../context/themeTypes'
import { audioManager } from '../lib/AudioManager'
import {
  loadDashboardBackground,
  loadUserSettings,
  saveDashboardBackground,
  saveUserSettings,
  type UserSettings,
} from '../lib/userSettings'

type Toggle = { key: keyof UserSettings; label: string; description: string }

const TOGGLES: Toggle[] = [
  { key: 'sound',        label: 'Sound Effects',   description: 'Play in-game sounds and click audio.' },
  { key: 'music',        label: 'Background Music', description: 'Ambient grove music during gameplay.' },
  { key: 'reduceMotion', label: 'Reduce Motion',    description: 'Limit animations for accessibility.' },
  { key: 'particles',    label: 'Particle Effects', description: 'Wind particles and sparkle bursts.' },
]

const THEME_ORDER: ColorTheme[] = ['light', 'dark', 'sapling', 'delivery', 'drift', 'halfmoon', 'dashboard']
const BG_COUNT = 9

export default function SettingsPage() {
  const { theme, setTheme, mode, toggleMode } = useTheme()
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings)
  const [saved, setSaved] = useState(false)
  const [dashBg, setDashBg] = useState<string>(loadDashboardBackground)

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 1800) }

  const toggle = (key: string) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key as keyof UserSettings] }
      saveUserSettings(next)
      audioManager.syncSettings()
      return next
    })
    flash()
  }

  const pickBg = (num: number) => {
    const val = `/assets/backgrounds/dashboard-background/bg_selection_${num}.png`
    setDashBg(val)
    saveDashboardBackground(val)
    flash()
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h2 style={s.pageTitle}>Settings</h2>
        {saved && <span style={s.savedBadge}>✓ Saved</span>}
      </div>

      {/* ── Appearance / Themes ───────────────────────────────────── */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Appearance</h3>
        <p style={s.sectionDesc}>Choose a color theme for the Whisperwind dashboard.</p>
        <div style={s.themeGrid}>
          {THEME_ORDER.map((t) => {
            const meta = THEME_META[t]
            const active = theme === t
            return (
              <button
                key={t}
                style={{
                  ...s.themeCard,
                  ...(active ? s.themeCardActive : {}),
                }}
                onClick={() => setTheme(t)}
                aria-pressed={active}
                title={meta.label}
              >
                {/* Color swatches */}
                <div style={s.swatchRow}>
                  {meta.colors.map((c, i) => (
                    <span key={i} style={{ ...s.swatch, background: c }} />
                  ))}
                </div>
                <span style={s.themeIcon}>{meta.icon}</span>
                <span style={s.themeLabel}>{meta.label}</span>
                {active && <span style={s.activeCheck}>✓</span>}
              </button>
            )
          })}
        </div>

        {/* Light / Dark mode toggle — only for game themes */}
        {GAME_THEMES.includes(theme) && (
          <div style={s.modeRow}>
            <div style={s.toggleInfo}>
              <p style={s.toggleLabel}>Theme Mode</p>
              <p style={s.toggleDesc}>Switch between dark and light variants of the selected theme.</p>
            </div>
            <div style={s.modePills}>
              {(['dark', 'light'] as const).map((m) => (
                <button
                  key={m}
                  style={{
                    ...s.modePill,
                    ...(mode === m ? s.modePillActive : {}),
                  }}
                  onClick={() => { if (mode !== m) toggleMode() }}
                  aria-pressed={mode === m}
                >
                  {m === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Dashboard Background ──────────────────────────────────── */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Dashboard Background</h3>
        <p style={s.sectionDesc}>Choose a background image for the main game selection screen.</p>
        <div style={s.bgGrid}>
          {Array.from({ length: BG_COUNT }, (_, i) => i + 1).map((num) => {
            const val = `/assets/backgrounds/dashboard-background/bg_selection_${num}.png`
            const active = dashBg === val
            return (
              <button
                key={num}
                style={{ ...s.bgThumb, ...(active ? s.bgThumbActive : {}) }}
                onClick={() => pickBg(num)}
                aria-pressed={active}
                title={`Background ${num}`}
              >
                <img
                  src={val}
                  alt={`Background option ${num}`}
                  style={s.bgImg}
                />
                {active && <span style={s.bgCheck}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Game Preferences ──────────────────────────────────────── */}
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
                <span style={{
                  ...s.toggleThumb,
                  transform: settings[t.key] ? 'translateX(20px)' : 'translateX(0)',
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── About ─────────────────────────────────────────────────── */}
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
  page: {
    padding: '28px 32px',
    display: 'flex', flexDirection: 'column', gap: 28,
    maxWidth: 680,
    fontFamily: uiFontFamily,
  },
  header: { display: 'flex', alignItems: 'center', gap: 14 },
  pageTitle: { margin: 0, fontFamily: titleFontFamily, fontSize: 32, color: 'var(--text-h)' },
  savedBadge: {
    fontSize: 13, fontWeight: 700, color: 'var(--accent-dark)',
    background: 'var(--bg-accent-soft)', border: '1px solid var(--border-focus)',
    borderRadius: 8, padding: '4px 10px', fontFamily: uiFontFamily,
  },

  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: {
    margin: 0, fontFamily: titleFontFamily, fontSize: 20, color: 'var(--text-secondary)',
  },
  sectionDesc: {
    margin: 0, fontSize: 14, color: 'var(--text-muted)', fontFamily: uiFontFamily,
  },

  /* Theme grid */
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))',
    gap: 10,
  },
  themeCard: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '14px 10px 12px',
    borderRadius: 14,
    border: '2px solid var(--border)',
    background: 'var(--bg-surface)',
    cursor: 'pointer',
    fontFamily: uiFontFamily,
    transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease',
    boxShadow: 'var(--shadow-sm)',
  },
  themeCardActive: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 3px rgba(var(--accent), 0.15), var(--shadow-md)',
    transform: 'translateY(-2px)',
  },
  swatchRow: {
    display: 'flex', gap: 4, marginBottom: 2,
  },
  swatch: {
    width: 18, height: 18, borderRadius: 5,
    border: '1px solid rgba(0,0,0,0.15)',
    flexShrink: 0,
  },
  themeIcon: { fontSize: 22, lineHeight: 1 },
  themeLabel: {
    fontSize: 12, fontWeight: 600, color: 'var(--text-body)',
    textAlign: 'center', lineHeight: 1.25,
  },
  activeCheck: {
    position: 'absolute', top: 8, right: 10,
    fontSize: 12, fontWeight: 700, color: 'var(--accent)',
  },

  /* Mode toggle row */
  modeRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px',
    background: 'var(--bg-surface)',
    borderRadius: 14,
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
    gap: 16,
    flexWrap: 'wrap',
  },
  modePills: { display: 'flex', gap: 8 },
  modePill: {
    padding: '7px 16px',
    borderRadius: 999,
    border: '2px solid var(--border)',
    background: 'var(--bg-badge)',
    color: 'var(--text-secondary)',
    fontFamily: uiFontFamily,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 160ms ease',
  },
  modePillActive: {
    borderColor: 'var(--accent)',
    background: 'var(--bg-accent-soft)',
    color: 'var(--accent-dark)',
  },

  /* Background grid */
  bgGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 10,
  },
  bgThumb: {
    position: 'relative',
    padding: 0,
    border: '3px solid var(--border)',
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
    aspectRatio: '16/9',
    background: 'var(--bg-surface)',
    transition: 'border-color 180ms ease, transform 120ms ease, box-shadow 180ms ease',
    boxShadow: 'var(--shadow-sm)',
  },
  bgThumbActive: {
    borderColor: 'var(--accent)',
    transform: 'translateY(-2px)',
    boxShadow: '0 0 0 3px rgba(var(--accent), 0.2), var(--shadow-md)',
  },
  bgImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  bgCheck: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 13,
    fontWeight: 700,
    color: '#fff',
    background: 'var(--accent)',
    borderRadius: '50%',
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  /* Toggles */
  toggleList: {
    background: 'var(--bg-surface)',
    borderRadius: 16,
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-muted)', gap: 16,
  },
  toggleInfo:  { display: 'flex', flexDirection: 'column', gap: 3 },
  toggleLabel: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-body)', fontFamily: uiFontFamily },
  toggleDesc:  { margin: 0, fontSize: 13, color: 'var(--text-muted)', fontFamily: uiFontFamily },
  toggleBtn: {
    position: 'relative',
    width: 44, height: 24,
    borderRadius: 12, border: 'none',
    cursor: 'pointer', flexShrink: 0,
    transition: 'background 200ms ease',
    padding: 0,
  },
  toggleOn:  { background: 'var(--accent)' },
  toggleOff: { background: 'var(--border-strong)' },
  toggleThumb: {
    position: 'absolute',
    top: 3, left: 3,
    width: 18, height: 18,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
    transition: 'transform 200ms ease',
  },

  /* About */
  aboutCard: {
    background: 'var(--bg-surface)',
    borderRadius: 14,
    border: '1px solid var(--border)',
    padding: '18px 22px',
    display: 'flex', flexDirection: 'column', gap: 6,
    boxShadow: 'var(--shadow-sm)',
  },
  aboutLine: { margin: 0, fontSize: 14, color: 'var(--text-secondary)', fontFamily: uiFontFamily },
}
