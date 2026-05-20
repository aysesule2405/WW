import React, { useCallback, useRef, useState } from 'react'
import { readableFontFamily, uiFontFamily, titleFontFamily } from '../theme/typography'
import { useTheme } from '../context/ThemeContext'
import { THEME_META, type ColorTheme } from '../context/themeTypes'
import { audioManager } from '../lib/AudioManager'
import { compactSurface, inputSurface, pageShell, primaryButton, uiRadius, uiSpace, uiType, uiWidth } from '../theme/uiTokens'
import {
  loadDashboardBackground,
  loadUserSettings,
  resetAllSettings,
  saveDashboardBackground,
  saveUserSettings,
  type TextSize,
  type UserSettings,
} from '../lib/userSettings'
import { changePassword, getGameSessions, getProfile, getProgressSummary } from '../lib/api'
import { useAuth } from '../context/AuthContext'

// ── Toast ──────────────────────────────────────────────────────────────────────

type ToastKind = 'ok' | 'error'
function useToast() {
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const show = useCallback((msg: string, kind: ToastKind = 'ok') => {
    if (timer.current) clearTimeout(timer.current)
    setToast({ msg, kind })
    timer.current = setTimeout(() => setToast(null), 2600)
  }, [])
  return { toast, show }
}

// ── Section shell ──────────────────────────────────────────────────────────────

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section style={s.section}>
      <div style={s.sectionHeader}>
        <h3 style={s.sectionTitle}>{title}</h3>
        {desc && <p style={s.sectionDesc}>{desc}</p>}
      </div>
      {children}
    </section>
  )
}

// ── Toggle row ─────────────────────────────────────────────────────────────────

function ToggleRow({
  label, desc, checked, onChange,
}: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={s.toggleRow}>
      <div style={s.toggleInfo}>
        <p style={s.toggleLabel}>{label}</p>
        <p style={s.toggleDesc}>{desc}</p>
      </div>
      <button
        style={{ ...s.toggleBtn, ...(checked ? s.toggleOn : s.toggleOff) }}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        role="switch"
      >
        <span style={{ ...s.toggleThumb, transform: checked ? 'translateX(20px)' : 'translateX(0)' }} />
      </button>
    </div>
  )
}

// ── Volume row ─────────────────────────────────────────────────────────────────

function VolumeRow({
  label, desc, enabled, volume, onToggle, onVolume,
}: {
  label: string; desc: string
  enabled: boolean; volume: number
  onToggle: () => void; onVolume: (v: number) => void
}) {
  const pct = Math.round(volume * 100)
  const iconOff = '🔇'
  const iconOn  = pct < 40 ? '🔉' : '🔊'

  return (
    <div style={s.volumeRow}>
      <div style={s.toggleInfo}>
        <p style={s.toggleLabel}>{label}</p>
        <p style={s.toggleDesc}>{desc}</p>
      </div>
      <div style={s.volumeControls}>
        <button
          style={{ ...s.toggleBtn, ...(enabled ? s.toggleOn : s.toggleOff) }}
          onClick={onToggle}
          aria-pressed={enabled}
          role="switch"
        >
          <span style={{ ...s.toggleThumb, transform: enabled ? 'translateX(20px)' : 'translateX(0)' }} />
        </button>
        <div style={{ ...s.sliderWrap, opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? 'auto' : 'none' }}>
          <span style={s.volIcon}>{enabled ? iconOn : iconOff}</span>
          <input
            type="range"
            min={0} max={100} step={1}
            value={pct}
            onChange={(e) => onVolume(Number(e.target.value) / 100)}
            style={s.slider}
            aria-label={`${label} volume`}
          />
          <span style={s.volPct}>{pct}%</span>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

const THEME_ORDER: ColorTheme[] = ['light', 'sapling', 'delivery', 'drift', 'halfmoon', 'ember', 'petal', 'frost']
const BG_COUNT = 9
const TEXT_SIZES: { key: TextSize; label: string; hint: string }[] = [
  { key: 'sm', label: 'S',  hint: 'Small' },
  { key: 'md', label: 'M',  hint: 'Medium (default)' },
  { key: 'lg', label: 'L',  hint: 'Large' },
]

export default function SettingsPage() {
  const { theme, setTheme, mode, toggleMode } = useTheme()
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings)
  const [dashBg, setDashBg] = useState<string>(loadDashboardBackground)
  const { toast, show: showToast } = useToast()

  // Change-password form state
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew]         = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwSaving, setPwSaving]   = useState(false)

  // Export state
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const update = (patch: Partial<UserSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveUserSettings(next)
      audioManager.syncSettings()
      return next
    })
    showToast('Saved')
  }

  const pickBg = (num: number) => {
    const val = `/assets/backgrounds/dashboard-background/bg_selection_${num}.png`
    setDashBg(val)
    saveDashboardBackground(val)
    showToast('Saved')
  }

  const handleVolumeChange = (key: 'sfxVolume' | 'musicVolume', raw: number) => {
    const rounded = Math.round(raw * 100) / 100
    setSettings((prev) => {
      const next = { ...prev, [key]: rounded }
      saveUserSettings(next)
      if (key === 'musicVolume') audioManager.setMusicVolume(rounded)
      return next
    })
  }

  const handlePasswordChange = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pwNew !== pwConfirm) { showToast('Passwords do not match', 'error'); return }
    if (pwNew.length < 6)    { showToast('New password must be at least 6 characters', 'error'); return }
    setPwSaving(true)
    try {
      await changePassword(pwCurrent, pwNew)
      setPwCurrent(''); setPwNew(''); setPwConfirm('')
      showToast('Password changed successfully')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not change password', 'error')
    } finally {
      setPwSaving(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const slugs = ['spirit-drift', 'delivery-on-the-wind', 'spirit-sapling', 'half-moon']
      const [profile, summary, ...sessionGroups] = await Promise.all([
        getProfile().catch(() => null),
        getProgressSummary().catch(() => null),
        ...slugs.map((s) => getGameSessions(s, 500).catch(() => ({ sessions: [] }))),
      ])
      const sessions = Object.fromEntries(slugs.map((s, i) => [s, sessionGroups[i]?.sessions ?? []]))
      const data = { exportedAt: new Date().toISOString(), profile, summary, sessions }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `whisperwind-grove-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('Data exported')
    } catch {
      showToast('Export failed', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleReset = () => {
    if (!resetting) { setResetting(true); return }
    resetAllSettings()
    setSettings(loadUserSettings())
    setDashBg(loadDashboardBackground())
    audioManager.syncSettings()
    setResetting(false)
    showToast('Settings reset to defaults')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={s.page}>
      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, ...(toast.kind === 'error' ? s.toastError : s.toastOk) }}>
          {toast.kind === 'ok' ? '✓' : '⚠'} {toast.msg}
        </div>
      )}

      <div style={s.pageHeader}>
        <h2 style={s.pageTitle}>Settings</h2>
        <p style={s.pageSub}>Personalise your grove experience. All preferences save instantly.</p>
      </div>

      {/* ── Appearance ───────────────────────────────────────────────────────── */}
      <Section title="Appearance" desc="Choose a color theme and light/dark mode for the dashboard and all pages.">
        <div style={s.themeGrid}>
          {THEME_ORDER.map((t) => {
            const meta = THEME_META[t]
            const active = theme === t
            return (
              <button
                key={t}
                style={{ ...s.themeCard, ...(active ? s.themeCardActive : {}) }}
                onClick={() => setTheme(t)}
                aria-pressed={active}
                title={meta.label}
              >
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

        <div style={s.modeRow}>
          <div style={s.toggleInfo}>
            <p style={s.toggleLabel}>Mode</p>
            <p style={s.toggleDesc}>Switch between light and dark variants of the selected theme.</p>
          </div>
          <div style={s.modePills}>
            {(['light', 'dark'] as const).map((m) => (
              <button
                key={m}
                style={{ ...s.modePill, ...(mode === m ? s.modePillActive : {}) }}
                onClick={() => { if (mode !== m) toggleMode() }}
                aria-pressed={mode === m}
              >
                {m === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Dashboard Background ─────────────────────────────────────────────── */}
      <Section title="Dashboard Background" desc="Choose the artwork behind the main game selection screen.">
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
                <img src={val} alt={`Background option ${num}`} style={s.bgImg} />
                {active && <span style={s.bgCheck}>✓</span>}
              </button>
            )
          })}
        </div>
      </Section>

      {/* ── Audio ────────────────────────────────────────────────────────────── */}
      <Section title="Audio" desc="Control sound effects and music independently, with per-channel volume.">
        <div style={s.toggleList}>
          <VolumeRow
            label="Sound Effects"
            desc="In-game actions, button cues, and guardian speech."
            enabled={settings.sound}
            volume={settings.sfxVolume}
            onToggle={() => update({ sound: !settings.sound })}
            onVolume={(v) => handleVolumeChange('sfxVolume', v)}
          />
          <VolumeRow
            label="Music"
            desc="Ambient music across the dashboard and game worlds."
            enabled={settings.music}
            volume={settings.musicVolume}
            onToggle={() => update({ music: !settings.music })}
            onVolume={(v) => handleVolumeChange('musicVolume', v)}
          />
        </div>
      </Section>

      {/* ── Accessibility ────────────────────────────────────────────────────── */}
      <Section title="Accessibility" desc="Adjust text size and motion preferences to suit your needs.">
        <div style={s.toggleList}>
          {/* Text size */}
          <div style={{ ...s.toggleRow, alignItems: 'center' }}>
            <div style={s.toggleInfo}>
              <p style={s.toggleLabel}>Text Size</p>
              <p style={s.toggleDesc}>Scale the UI text. Takes effect immediately across all pages.</p>
            </div>
            <div style={s.textSizePills}>
              {TEXT_SIZES.map(({ key, label, hint }) => (
                <button
                  key={key}
                  title={hint}
                  style={{ ...s.textSizePill, ...(settings.textSize === key ? s.textSizePillActive : {}) }}
                  onClick={() => update({ textSize: key })}
                  aria-pressed={settings.textSize === key}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            label="Reduced Motion"
            desc="Limit looping animation and motion-heavy visual effects across the app."
            checked={settings.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />

          <ToggleRow
            label="Ambient Motion Effects"
            desc="Show drifting leaves, sparkles, and soft background character motion."
            checked={settings.particles}
            onChange={(v) => update({ particles: v })}
          />
        </div>
      </Section>

      {/* ── Privacy ──────────────────────────────────────────────────────────── */}
      <Section title="Privacy" desc="Control how your activity appears to other grove players.">
        <div style={s.toggleList}>
          <ToggleRow
            label="Show me on Leaderboard"
            desc="Highlight your entry in grove leaderboards. Turning this off hides your highlight from others."
            checked={settings.leaderboardVisible}
            onChange={(v) => update({ leaderboardVisible: v })}
          />
        </div>
      </Section>

      {/* ── Account ──────────────────────────────────────────────────────────── */}
      <Section title="Account" desc={user ? `Signed in as ${user.username}` : 'Manage your account credentials.'}>
        <form style={s.pwForm} onSubmit={handlePasswordChange}>
          <p style={s.pwFormTitle}>Change Password</p>
          <div style={s.pwFields}>
            <label style={s.fieldLabel}>
              Current password
              <input
                type="password"
                value={pwCurrent}
                onChange={(e) => setPwCurrent(e.target.value)}
                style={s.fieldInput}
                autoComplete="current-password"
                required
                placeholder="Enter current password"
              />
            </label>
            <label style={s.fieldLabel}>
              New password
              <input
                type="password"
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                style={s.fieldInput}
                autoComplete="new-password"
                required
                minLength={6}
                placeholder="At least 6 characters"
              />
            </label>
            <label style={s.fieldLabel}>
              Confirm new password
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                style={s.fieldInput}
                autoComplete="new-password"
                required
                placeholder="Repeat new password"
              />
            </label>
          </div>
          <button
            type="submit"
            style={{ ...s.actionBtn, opacity: pwSaving ? 0.65 : 1 }}
            disabled={pwSaving}
          >
            {pwSaving ? 'Saving…' : '🔒 Update Password'}
          </button>
        </form>
      </Section>

      {/* ── Data ─────────────────────────────────────────────────────────────── */}
      <Section title="Your Data" desc="Export a copy of your progress or reset all local preferences.">
        <div style={s.dataButtons}>
          <div style={s.dataRow}>
            <div style={s.toggleInfo}>
              <p style={s.toggleLabel}>Export My Data</p>
              <p style={s.toggleDesc}>
                Download a JSON file with your profile, progress summary, and full session history across all games.
              </p>
            </div>
            <button
              style={{ ...s.actionBtn, opacity: exporting ? 0.65 : 1 }}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? 'Exporting…' : '⬇ Download JSON'}
            </button>
          </div>

          <div style={{ ...s.dataRow, borderBottom: 'none' }}>
            <div style={s.toggleInfo}>
              <p style={s.toggleLabel}>Reset All Settings</p>
              <p style={s.toggleDesc}>
                Clear all theme, audio, and accessibility preferences and restore defaults.
                Your game progress and account are not affected.
              </p>
            </div>
            <button
              style={{
                ...s.actionBtn,
                background: resetting ? '#c04040' : 'var(--bg-danger-soft)',
                color: resetting ? '#fff' : '#c04040',
                border: '1px solid rgba(192,64,64,0.35)',
                boxShadow: 'none',
              }}
              onClick={handleReset}
            >
              {resetting ? '⚠ Click again to confirm' : '↺ Reset to Defaults'}
            </button>
          </div>
        </div>
      </Section>

      {/* ── About ────────────────────────────────────────────────────────────── */}
      <Section title="About Whisperwind Grove">
        <div style={s.aboutCard}>
          {/* Hero line */}
          <div style={s.aboutHero}>
            <span style={s.aboutHeroIcon}>🏕️</span>
            <div>
              <p style={s.aboutHeroTitle}>Whisperwind Grove</p>
              <p style={s.aboutHeroSub}>A cozy mini-game platform · Version 0.1.0</p>
            </div>
          </div>

          {/* Origin story */}
          <div style={s.aboutSection}>
            <p style={s.aboutSectionHeading}>✨ The Beginning</p>
            <p style={s.aboutBody}>
              Whisperwind Grove started as a personal project born out of a simple wish — to build a space that felt
              warm, unhurried, and genuinely fun to come back to. I wanted games that didn't punish you for stopping,
              and a platform that felt like wandering into a quiet forest rather than logging into a leaderboard grind.
            </p>
          </div>

          {/* The journey */}
          <div style={s.aboutSection}>
            <p style={s.aboutSectionHeading}>🌱 The Journey</p>
            <p style={s.aboutBody}>
              Building this solo meant learning everything end to end — designing game logic in Phaser 3,
              wiring up a real backend with authentication, scores, and achievements, and crafting a
              multi-theme design system that could hold eight visual worlds without breaking. Every feature
              you see — the guardian trees, the wind physics in Spirit Drift, the delivery route timer,
              the Half Moon card system — was puzzled out one piece at a time.
            </p>
            <p style={s.aboutBody}>
              The community board, the progress tracking, the achievement catalog, the animated particles
              drifting across the dashboard — none of it was planned from the start. It grew organically,
              each small addition making the grove feel a little more alive.
            </p>
          </div>

          {/* Games */}
          <div style={s.aboutSection}>
            <p style={s.aboutSectionHeading}>🎮 The Games</p>
            <div style={s.aboutGamesGrid}>
              {[
                { icon: '🌊', name: 'Spirit Drift',           note: 'Flow with the wind and find your rhythm' },
                { icon: '🌱', name: 'Spirit Sapling',         note: 'Grow sacred trees with guardian spirits' },
                { icon: '📦', name: 'Delivery on the Wind',   note: 'Race the breeze through the grove' },
                { icon: '🌙', name: 'Rise of the Half Moon',  note: 'A strategy card game under moonlight' },
              ].map((g) => (
                <div key={g.name} style={s.aboutGameChip}>
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{g.icon}</span>
                  <div>
                    <p style={s.aboutGameName}>{g.name}</p>
                    <p style={s.aboutGameNote}>{g.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stack */}
          <div style={s.aboutSection}>
            <p style={s.aboutSectionHeading}>🛠 Built With</p>
            <div style={s.aboutChips}>
              {['React', 'TypeScript', 'Phaser 3', 'Node.js', 'Express', 'MongoDB', 'Vite'].map((tech) => (
                <span key={tech} style={s.aboutTechChip}>{tech}</span>
              ))}
            </div>
          </div>

          <p style={s.aboutFooter}>
            Made with care, curiosity, and a lot of late nights. 🍃<br />
            © 2025 Whisperwind Grove — Ayse Sule
          </p>
        </div>
      </Section>
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  page: {
    ...pageShell(uiWidth.form),
    display: 'flex', flexDirection: 'column', gap: uiSpace.xl,
    fontFamily: uiFontFamily,
  },

  // Toast
  toast: {
    position: 'fixed', top: 20, right: 24, zIndex: 9999,
    padding: '10px 18px', borderRadius: uiRadius.md,
    fontSize: uiType.small, fontWeight: 700, fontFamily: uiFontFamily,
    boxShadow: 'var(--shadow-md)',
    animation: 'fadeIn 0.2s ease',
  },
  toastOk: {
    background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)',
    border: '1px solid var(--border-focus)',
  },
  toastError: {
    background: 'var(--bg-danger-soft)', color: '#c04040',
    border: '1px solid rgba(192,64,64,0.35)',
  },

  // Page header
  pageHeader: { display: 'flex', flexDirection: 'column', gap: 4 },
  pageTitle: { margin: 0, fontFamily: titleFontFamily, fontSize: uiType.pageTitle, color: 'var(--text-h)', lineHeight: 1 },
  pageSub: { margin: 0, color: 'var(--text-muted)', fontSize: uiType.small, fontFamily: readableFontFamily },

  // Section
  section: { display: 'flex', flexDirection: 'column', gap: uiSpace.sm },
  sectionHeader: { display: 'flex', flexDirection: 'column', gap: 3 },
  sectionTitle: { margin: 0, fontFamily: titleFontFamily, fontSize: uiType.sectionTitle, color: 'var(--text-secondary)', lineHeight: 1.1 },
  sectionDesc: { margin: 0, fontSize: uiType.small, color: 'var(--text-muted)', fontFamily: readableFontFamily, lineHeight: 1.4 },

  // Theme grid
  themeGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 148px), 1fr))', gap: uiSpace.sm,
  },
  themeCard: {
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    padding: '14px 10px 12px', borderRadius: uiRadius.lg,
    border: '2px solid var(--border)', background: 'var(--bg-surface)',
    cursor: 'pointer', fontFamily: uiFontFamily,
    transition: 'border-color 180ms ease, box-shadow 180ms ease, transform 120ms ease',
    boxShadow: 'var(--shadow-sm)',
  },
  themeCardActive: {
    borderColor: 'var(--accent)',
    boxShadow: '0 0 0 3px var(--bg-accent-soft), var(--shadow-md)',
    transform: 'translateY(-2px)',
  },
  swatchRow: { display: 'flex', gap: 4, marginBottom: 2 },
  swatch: { width: 18, height: 18, borderRadius: 5, border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 },
  themeIcon: { fontSize: 22, lineHeight: 1 },
  themeLabel: { fontSize: 12, fontWeight: 600, color: 'var(--text-body)', textAlign: 'center', lineHeight: 1.25 },
  activeCheck: { position: 'absolute', top: 8, right: 10, fontSize: 12, fontWeight: 700, color: 'var(--accent)' },

  // Mode row
  modeRow: {
    ...compactSurface,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', gap: uiSpace.md, flexWrap: 'wrap',
  },
  modePills: { display: 'flex', gap: 8 },
  modePill: {
    padding: '7px 16px', borderRadius: 999,
    border: '2px solid var(--border)', background: 'var(--bg-badge)',
    color: 'var(--text-secondary)', fontFamily: uiFontFamily,
    fontSize: uiType.small, fontWeight: 600, cursor: 'pointer',
    transition: 'all 160ms ease',
  },
  modePillActive: { borderColor: 'var(--accent)', background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)' },

  // Background grid
  bgGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: uiSpace.sm,
  },
  bgThumb: {
    position: 'relative', padding: 0,
    border: '3px solid var(--border)', borderRadius: uiRadius.lg,
    overflow: 'hidden', cursor: 'pointer', aspectRatio: '16/9',
    background: 'var(--bg-surface)', transition: 'border-color 180ms ease, transform 120ms ease, box-shadow 180ms ease',
    boxShadow: 'var(--shadow-sm)',
  },
  bgThumbActive: { borderColor: 'var(--accent)', transform: 'translateY(-2px)', boxShadow: '0 0 0 3px var(--bg-accent-soft), var(--shadow-md)' },
  bgImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
  bgCheck: {
    position: 'absolute', top: 6, right: 8, fontSize: 13, fontWeight: 700, color: '#fff',
    background: 'var(--accent)', borderRadius: '50%', width: 20, height: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  // Toggle list (shared container)
  toggleList: {
    ...compactSurface,
    borderRadius: uiRadius.xl,
    overflow: 'hidden',
  },
  toggleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border-muted)',
    gap: uiSpace.md, flexWrap: 'wrap',
  },
  volumeRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border-muted)',
    gap: uiSpace.md, flexWrap: 'wrap',
  },
  volumeControls: { display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 },
  sliderWrap: { display: 'flex', alignItems: 'center', gap: 8, minWidth: 160, transition: 'opacity 200ms' },
  volIcon: { fontSize: 16, lineHeight: 1, flexShrink: 0 },
  slider: { flex: 1, accentColor: 'var(--accent)', height: 4, cursor: 'pointer' },
  volPct: { fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' },

  toggleInfo:  { display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 },
  toggleLabel: { margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-body)', fontFamily: uiFontFamily },
  toggleDesc:  { margin: 0, fontSize: uiType.small, color: 'var(--text-muted)', fontFamily: readableFontFamily, lineHeight: 1.35 },
  toggleBtn: {
    position: 'relative', width: 44, height: 24,
    borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
    transition: 'background 200ms ease', padding: 0,
  },
  toggleOn:  { background: 'var(--accent)' },
  toggleOff: { background: 'var(--border-strong)' },
  toggleThumb: {
    position: 'absolute', top: 3, left: 3, width: 18, height: 18,
    borderRadius: '50%', background: '#fff',
    boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 200ms ease',
  },

  // Text size pills
  textSizePills: { display: 'flex', gap: 6, flexShrink: 0 },
  textSizePill: {
    width: 36, height: 36, borderRadius: uiRadius.md,
    border: '2px solid var(--border)', background: 'var(--bg-badge)',
    color: 'var(--text-secondary)', fontFamily: uiFontFamily,
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
    transition: 'all 160ms ease', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  textSizePillActive: { borderColor: 'var(--accent)', background: 'var(--bg-accent-soft)', color: 'var(--accent-dark)' },

  // Password form
  pwForm: {
    ...compactSurface,
    padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: uiSpace.sm,
  },
  pwFormTitle: { margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', fontFamily: uiFontFamily },
  pwFields: { display: 'flex', flexDirection: 'column', gap: 10 },
  fieldLabel: {
    display: 'flex', flexDirection: 'column', gap: 5,
    fontSize: uiType.small, fontWeight: 600, color: 'var(--text-muted)', fontFamily: uiFontFamily,
  },
  fieldInput: {
    ...inputSurface,
    padding: '10px 13px',
    fontSize: uiType.body,
    fontFamily: readableFontFamily,
  },

  // Action button
  actionBtn: {
    ...primaryButton,
    padding: '10px 18px',
    fontSize: uiType.small,
    fontWeight: 700,
    fontFamily: uiFontFamily,
    alignSelf: 'flex-start',
    transition: 'opacity 150ms',
  },

  // Data section
  dataButtons: { ...compactSurface, borderRadius: uiRadius.xl, overflow: 'hidden' },
  dataRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 20px', borderBottom: '1px solid var(--border-muted)',
    gap: uiSpace.md, flexWrap: 'wrap',
  },

  // About
  aboutLine: { margin: 0, fontSize: uiType.small, color: 'var(--text-secondary)', fontFamily: readableFontFamily, lineHeight: 1.4 },
  aboutCard: {
    ...compactSurface,
    padding: '22px 24px',
    display: 'flex', flexDirection: 'column', gap: 20,
  },
  aboutHero: {
    display: 'flex', alignItems: 'center', gap: 14,
    paddingBottom: 18, borderBottom: '1px solid var(--border-muted)',
  },
  aboutHeroIcon: {
    fontSize: 36, lineHeight: 1,
    width: 56, height: 56, borderRadius: uiRadius.lg,
    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 4px 14px color-mix(in srgb, var(--accent-dark) 30%, transparent)',
  },
  aboutHeroTitle: {
    margin: 0, fontFamily: titleFontFamily, fontSize: 22, color: 'var(--text-h)', lineHeight: 1.1,
  },
  aboutHeroSub: {
    margin: '4px 0 0', fontSize: uiType.small, color: 'var(--text-muted)', fontFamily: readableFontFamily,
  },
  aboutSection: { display: 'flex', flexDirection: 'column', gap: 8 },
  aboutSectionHeading: {
    margin: 0, fontFamily: uiFontFamily, fontSize: 14, fontWeight: 700,
    color: 'var(--accent-dark)', letterSpacing: '0.02em',
  },
  aboutBody: {
    margin: 0, fontSize: uiType.small, color: 'var(--text-body)',
    fontFamily: readableFontFamily, lineHeight: 1.65,
  },
  aboutGamesGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8,
  },
  aboutGameChip: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '10px 14px', borderRadius: uiRadius.md,
    background: 'var(--bg-badge)', border: '1px solid var(--border-muted)',
  },
  aboutGameName: {
    margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-body)', fontFamily: uiFontFamily,
  },
  aboutGameNote: {
    margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: readableFontFamily, lineHeight: 1.35,
  },
  aboutChips: { display: 'flex', flexWrap: 'wrap', gap: 7 },
  aboutTechChip: {
    padding: '4px 11px', borderRadius: uiRadius.pill,
    background: 'var(--bg-accent-soft)', border: '1px solid var(--border-focus)',
    color: 'var(--accent-dark)', fontSize: 12, fontWeight: 700, fontFamily: uiFontFamily,
  },
  aboutFooter: {
    margin: 0, fontSize: 12, color: 'var(--text-muted)',
    fontFamily: readableFontFamily, lineHeight: 1.6,
    paddingTop: 14, borderTop: '1px solid var(--border-muted)',
    fontStyle: 'italic',
  },
}
