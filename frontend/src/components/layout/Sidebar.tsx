import type { CSSProperties } from 'react'
import { headingFontFamily, bodyFontFamily } from '../../theme/typography'
import { useTheme } from '../../context/ThemeContext'

export type SidebarSection = 'games' | 'progress' | 'profile' | 'settings'

type NavItem = { id: SidebarSection; icon: string; label: string }

const NAV_ITEMS: NavItem[] = [
  { id: 'games',    icon: '🏕️', label: 'Grove'    },
  { id: 'progress', icon: '🌿', label: 'Progress' },
  { id: 'profile',  icon: '👤', label: 'Profile'  },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

type Props = {
  active: SidebarSection
  onChange: (s: SidebarSection) => void
  username: string
  onLogout: () => void
}

export default function Sidebar({ active, onChange, username, onLogout }: Props) {
  const { theme, toggleTheme } = useTheme()
  const avatarLetter = username?.[0]?.toUpperCase() ?? '?'
  const isDark = theme === 'dark'

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
              style={{ ...s.navBtn, ...(isActive ? s.navBtnActive : {}) }}
              onClick={() => onChange(item.id)}
            >
              <span style={s.navIcon}>{item.icon}</span>
              <span style={{ ...s.navLabel, color: isActive ? '#D4EAB4' : '#B8A88A' }}>
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
        <button style={s.themeBtn} onClick={toggleTheme} title="Toggle theme">
          <span style={s.themeTrack}>
            <span style={{ ...s.themeThumb, transform: isDark ? 'translateX(20px)' : 'translateX(0)' }} />
          </span>
          <span style={s.themeLabel}>
            {isDark ? '🌙 Dark' : '☀️ Light'}
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
    background: 'linear-gradient(180deg, #1A2212 0%, #121808 100%)',
    borderRight: '1px solid rgba(173,193,120,0.12)',
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
    borderBottom: '1px solid rgba(173,193,120,0.1)',
  },
  logoImg: {
    width: 36,
    height: 36,
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 8px rgba(173,193,120,0.55))',
    flexShrink: 0,
  },
  logoTitle: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 16,
    color: '#D4EAB4',
    lineHeight: 1.1,
  },
  logoSub: {
    margin: 0,
    fontFamily: headingFontFamily,
    fontSize: 14,
    color: 'rgba(173,193,120,0.60)',
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
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: bodyFontFamily,
    transition: 'background 160ms ease',
    textAlign: 'left',
    width: '100%',
  },
  navBtnActive: {
    background: 'rgba(173,193,120,0.15)',
    boxShadow: 'inset 3px 0 0 #ADC178',
  },
  navIcon: { fontSize: 18, lineHeight: 1, flexShrink: 0 },
  navLabel: { fontSize: 15, fontWeight: 600, lineHeight: 1 },
  activePip: {
    position: 'absolute',
    right: 10,
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#ADC178',
    boxShadow: '0 0 8px rgba(173,193,120,0.7)',
  },
  spacer: { flex: 1 },

  // Theme toggle
  themeRow: {
    padding: '8px 14px 4px',
  },
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(173,193,120,0.15)',
    background: 'rgba(173,193,120,0.08)',
    cursor: 'pointer',
    fontFamily: bodyFontFamily,
  },
  themeTrack: {
    position: 'relative',
    display: 'inline-block',
    width: 40,
    height: 20,
    borderRadius: 10,
    background: 'rgba(173,193,120,0.25)',
    flexShrink: 0,
    border: '1px solid rgba(173,193,120,0.3)',
  },
  themeThumb: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: '50%',
    background: '#ADC178',
    transition: 'transform 200ms ease',
  },
  themeLabel: {
    fontSize: 13,
    color: '#C8B89A',
    fontWeight: 600,
    lineHeight: 1,
  },

  footer: {
    padding: '12px 14px 4px',
    borderTop: '1px solid rgba(173,193,120,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  userRow: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ADC178, #6C584C)',
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
    color: '#C8B89A',
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
    border: '1px solid rgba(180,60,60,0.28)',
    background: 'rgba(200,60,60,0.08)',
    color: '#CC8888',
    fontFamily: bodyFontFamily,
    fontSize: 13,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
  },
}
