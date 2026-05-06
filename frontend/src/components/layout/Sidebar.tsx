import type { CSSProperties } from 'react'
import { headingFontFamily, bodyFontFamily } from '../../theme/typography'
import { useTheme } from '../../context/ThemeContext'
import { GAME_THEMES } from '../../context/themeTypes'

export type SidebarSection = 'games' | 'progress' | 'achievements' | 'leaderboard' | 'profile' | 'settings'

type NavItem = { id: SidebarSection; icon: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { id: 'games',       icon: '🏕️', label: 'Grove'       },
  { id: 'progress',    icon: '🌿', label: 'Progress'    },
  { id: 'achievements', icon: '🏅', label: 'Achievements' },
  { id: 'leaderboard', icon: '🏆', label: 'Leaderboard' },
  { id: 'profile',     icon: '👤', label: 'Profile'     },
  { id: 'settings',    icon: '⚙️', label: 'Settings'    },
]

type Props = {
  active: SidebarSection
  onChange: (s: SidebarSection) => void
  username: string
  onLogout: () => void
}

export default function Sidebar({ active, onChange, username, onLogout }: Props) {
  const { isDark, theme, mode, toggleTheme } = useTheme()
  const isGameTheme  = GAME_THEMES.includes(theme)
  const toggleIsDark = isGameTheme ? mode === 'dark' : isDark
  const avatarLetter = username?.[0]?.toUpperCase() ?? '?'

  return (
    <aside style={s.sidebar}>
      {/* Logo */}
      <div style={s.logoArea}>
        <img
          src="/assets/grove-logo.png"
          alt="logo"
          style={s.logoImg}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div>
          <p style={s.logoTitle}>Whisperwind</p>
          <p style={s.logoSub}>Grove</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              style={{
                ...s.navBtn,
                background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                boxShadow: isActive ? 'inset 3px 0 0 var(--sidebar-pip)' : 'none',
              }}
              onClick={() => onChange(item.id)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span style={{
                ...s.navLabel,
                color: isActive ? 'var(--sidebar-highlight)' : 'var(--sidebar-muted)',
              }}>
                {item.label}
              </span>
              {isActive && <div style={s.activePip} />}
            </button>
          )
        })}
      </nav>

      <div style={s.spacer} />

      {/* Theme toggle */}
      <div style={s.themeRow}>
        <button style={s.themeBtn} onClick={toggleTheme} title="Toggle light / dark">
          <span style={s.themeTrack}>
            <span style={{
              ...s.themeThumb,
              transform: toggleIsDark ? 'translateX(20px)' : 'translateX(0)',
            }} />
          </span>
          <span style={s.themeLabel}>
            {toggleIsDark ? '🌙 Dark' : '☀️ Light'}
          </span>
        </button>
      </div>

      {/* User footer */}
      <div style={s.footer}>
        <div style={s.userRow}>
          <div style={s.avatar}>{avatarLetter}</div>
          <span style={s.userName}>{username}</span>
        </div>
        <button style={s.logoutBtn} onClick={onLogout}>Sign out</button>
      </div>
    </aside>
  )
}

const s: Record<string, CSSProperties> = {
  sidebar: {
    width: 210,
    minWidth: 210,
    height: '100vh',
    position: 'sticky',
    top: 0,
    background: 'var(--sidebar-bg)',
    borderRight: '1px solid var(--sidebar-border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 16px 0',
    boxSizing: 'border-box',
    flexShrink: 0,
    zIndex: 30,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '20px 18px 16px',
    borderBottom: '1px solid var(--sidebar-border)',
  },
  logoImg: {
    width: 36,
    height: 36,
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--sidebar-pip) 60%, transparent))',
    flexShrink: 0,
  },
  logoTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 16,
    color: 'var(--sidebar-highlight)',
    lineHeight: 1.1,
  },
  logoSub: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 14,
    color: 'var(--sidebar-muted)',
    lineHeight: 1,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '14px 10px 0',
  },
  navBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    fontFamily: bodyFontFamily,
    transition: 'background 160ms ease',
    textAlign: 'left',
    width: '100%',
  },
  navIcon: { fontSize: 18, lineHeight: 1, flexShrink: 0 },
  navLabel: { fontSize: 15, fontWeight: 600, lineHeight: 1 },
  activePip: {
    position: 'absolute',
    right: 10,
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--sidebar-pip)',
    boxShadow: '0 0 8px color-mix(in srgb, var(--sidebar-pip) 70%, transparent)',
  },
  spacer: { flex: 1 },

  /* Theme toggle */
  themeRow: { padding: '8px 14px 4px' },
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid var(--sidebar-border)',
    background: 'var(--sidebar-active-bg)',
    cursor: 'pointer',
    fontFamily: bodyFontFamily,
  },
  themeTrack: {
    position: 'relative',
    display: 'inline-block',
    width: 40,
    height: 20,
    borderRadius: 10,
    background: 'var(--sidebar-border)',
    flexShrink: 0,
    border: '1px solid var(--sidebar-border)',
  },
  themeThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: 'var(--sidebar-pip)',
    transition: 'transform 200ms ease',
  },
  themeLabel: {
    fontSize: 13,
    color: 'var(--sidebar-muted)',
    fontWeight: 600,
    lineHeight: 1,
  },

  /* Footer */
  footer: {
    padding: '12px 14px 4px',
    borderTop: '1px solid var(--sidebar-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--sidebar-pip), var(--sidebar-muted))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  userName: {
    fontSize: 14,
    color: 'var(--sidebar-muted)',
    fontWeight: 600,
    fontFamily: bodyFontFamily,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: 120,
  },
  logoutBtn: {
    padding: '7px 12px',
    borderRadius: 8,
    border: '1px solid rgba(200,60,60,0.28)',
    background: 'rgba(200,60,60,0.08)',
    color: '#CC8888',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
}
