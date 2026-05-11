import React, { useState } from 'react'
import { readableFontFamily, uiFontFamily, titleFontFamily } from '../theme/typography'
import { useTheme } from '../context/ThemeContext'
import { THEME_META, GAME_THEMES, type ColorTheme } from '../context/themeTypes'
import { audioManager } from '../lib/AudioManager'
import { compactSurface, pageShell, uiRadius, uiSpace, uiType, uiWidth } from '../theme/uiTokens'
import {
  loadDashboardBackground,
  loadUserSettings,
  saveDashboardBackground,
  saveUserSettings,
  type UserSettings,
} from '../lib/userSettings'

type Toggle = { key: keyof UserSettings; label: string; description: string }

const TOGGLES: Toggle[] = [
  { key: 'sound',        label: 'Sound Effects',          description: 'Play in-game actions, button cues, and guardian speech.' },
  { key: 'music',        label: 'Menu and Game Music',    description: 'Control ambient music across the dashboard and game worlds.' },
  { key: 'reduceMotion', label: 'Reduced Motion Mode',    description: 'Limit looping animation and motion-heavy visual effects.' },
  { key: 'particles',    label: 'Ambient Motion Effects', description: 'Show drifting leaves, sparkles, and soft background character motion.' },
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
        <div>
          <h2 style={s.pageTitle}>Settings</h2>
          <p style={s.pageSub}>Tune the grove so it feels right to play in.</p>
        </div>
        {saved && <span style={s.savedBadge}>Saved</span>}
      </div>

      {/* ── Appearance / Themes ───────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Appearance</h3>
        <p style={s.sectionDesc}>Choose a color theme for the dashboard, profile, progress, and leaderboard screens.</p>
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
      </section>

      {/* ── Dashboard Background ──────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Dashboard Background</h3>
        <p style={s.sectionDesc}>Choose the artwork behind the main game selection screen.</p>
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
      </section>

      {/* ── Game Preferences ──────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>Game Preferences</h3>
        <p style={s.sectionDesc}>These controls update immediately and are saved on this device.</p>
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
      </section>

      {/* ── About ─────────────────────────────────────────────────── */}
      <section style={s.section}>
        <h3 style={s.sectionTitle}>About</h3>
        <div style={s.aboutCard}>
          <p style={s.aboutLine}><strong>Whisperwind Grove</strong> — Cozy mini-game platform</p>
          <p style={s.aboutLine}>Version 0.1.0 · Built with React + Phaser 3</p>
          <p style={s.aboutLine}>© 2025 Whisperwind Grove</p>
        </div>
      </section>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: {
    ...pageShell(uiWidth.form),
    display: 'flex', flexDirection: 'column', gap: uiSpace.xl,
    fontFamily: uiFontFamily,
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: uiSpace.md, flexWrap: 'wrap' },
  pageTitle: { margin: 0, fontFamily: titleFontFamily, fontSize: uiType.pageTitle, color: 'var(--text-h)', lineHeight: 1 },
  pageSub: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: uiType.small, fontFamily: readableFontFamily },
  savedBadge: {
    fontSize: uiType.small, fontWeight: 700, color: 'var(--accent-dark)',
    background: 'var(--bg-accent-soft)', border: '1px solid var(--border-focus)',
    borderRadius: uiRadius.md, padding: '5px 11px', fontFamily: readableFontFamily,
  },

  section: { display: 'flex', flexDirection: 'column', gap: uiSpace.sm },
  sectionTitle: {
    margin: 0, fontFamily: titleFontFamily, fontSize: uiType.sectionTitle, color: 'var(--text-secondary)', lineHeight: 1.1,
  },
  sectionDesc: {
    margin: 0, fontSize: uiType.small, color: 'var(--text-muted)', fontFamily: readableFontFamily, lineHeight: 1.4,
  },

  /* Theme grid */
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 148px), 1fr))',
    gap: uiSpace.sm,
  },
  themeCard: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '14px 10px 12px',
    borderRadius: uiRadius.lg,
    border: '2px solid var(--border)',
    background: 'var(--bg-surface)',
    cursor: 'pointer',
    fontFamily: uiFontFamily,
    transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease',
    boxShadow: 'var(--shadow-sm)',
  },
  themeCardActive: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 3px var(--bg-accent-soft), var(--shadow-md)',
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
    ...compactSurface,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px',
    gap: uiSpace.md,
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
    fontSize: uiType.small,
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: uiSpace.sm,
  },
  bgThumb: {
    position: 'relative',
    padding: 0,
    border: '3px solid var(--border)',
    borderRadius: uiRadius.lg,
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
    boxShadow: '0 0 0 3px var(--bg-accent-soft), var(--shadow-md)',
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
    ...compactSurface,
    borderRadius: uiRadius.xl,
    overflow: 'hidden',
  },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border-muted)', gap: uiSpace.md,
    flexWrap: 'wrap',
  },
  toggleInfo:  { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 },
  toggleLabel: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-body)', fontFamily: uiFontFamily },
  toggleDesc:  { margin: 0, fontSize: uiType.small, color: 'var(--text-muted)', fontFamily: readableFontFamily, lineHeight: 1.35 },
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
    ...compactSurface,
    padding: '18px 22px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  aboutLine: { margin: 0, fontSize: uiType.small, color: 'var(--text-secondary)', fontFamily: readableFontFamily, lineHeight: 1.4 },
}
