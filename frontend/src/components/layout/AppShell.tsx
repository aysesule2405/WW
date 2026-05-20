import { useEffect, useState } from 'react'
import Sidebar from './Sidebar'
import type { SidebarSection } from './Sidebar'
import { useAuth } from '../../context/AuthContext'
import ProfilePage from '../../pages/ProfilePage'
import SettingsPage from '../../pages/SettingsPage'
import ProgressPage from '../../pages/ProgressPage'
import LeaderboardPage from '../../pages/LeaderboardPage'
import AchievementsPage from '../../pages/AchievementsPage'
import CommunityPage from '../../pages/CommunityPage'
import GameSelectionScreen from '../GameSelectionScreen'
import {
  SETTINGS_EVENT,
  loadDashboardBackground,
  loadUserSettings,
  type UserSettings,
} from '../../lib/userSettings'

type Props = {
  onSelect: (id: string) => void
  onLogout: () => void
}

export default function AppShell({ onSelect, onLogout }: Props) {
  const { user } = useAuth()
  const [section, setSection] = useState<SidebarSection>('games')
  const [settings, setSettings] = useState<UserSettings>(loadUserSettings)
  const [background, setBackground] = useState(loadDashboardBackground)

  useEffect(() => {
    const refresh = () => {
      setSettings(loadUserSettings())
      setBackground(loadDashboardBackground())
    }
    window.addEventListener(SETTINGS_EVENT, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(SETTINGS_EVENT, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      position: 'relative',
      backgroundColor: 'var(--bg-page)',
      backgroundImage: background
        ? `linear-gradient(var(--bg-photo-blend), var(--bg-photo-blend)), url('${background}')`
        : undefined,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      transition: 'background 250ms ease',
    }}>
      {settings.particles && !settings.reduceMotion && <ShellParticles />}
      <Sidebar
        active={section}
        onChange={setSection}
        username={user?.username ?? ''}
        onLogout={onLogout}
      />
      <main style={{ flex: 1, overflowY: 'auto', minWidth: 0, position: 'relative', zIndex: 1, zoom: ({ sm: 0.9, md: 1.0, lg: 1.12 } as const)[settings.textSize ?? 'md'] }}>
        {section === 'games'       && <GameSelectionScreen onSelect={onSelect} onLogout={onLogout} />}
        {section === 'community'   && <CommunityPage />}
        {section === 'progress'    && <ProgressPage />}
        {section === 'achievements' && <AchievementsPage />}
        {section === 'leaderboard' && <LeaderboardPage />}
        {section === 'profile'     && <ProfilePage />}
        {section === 'settings'    && <SettingsPage />}
      </main>
    </div>
  )
}

type Particle = {
  src: string
  top?: string; bottom?: string; left?: string; right?: string
  width: number; opacity: number; anim: string
}

const PARTICLES: Particle[] = [
  // ─ Willow leaves — top canopy
  { src: '/assets/animation/willow-leaves.gif', top: '0%',   left: '15%',  width: 148, opacity: 0.24, anim: 'float-spirit 9s ease-in-out 0s infinite' },
  { src: '/assets/animation/willow-leaves.gif', top: '1%',   left: '71%',  width: 116, opacity: 0.18, anim: 'float-spirit 11.5s ease-in-out 3.2s infinite' },
  // ─ Lily leaves — mid sides
  { src: '/assets/animation/lily-leaf-1.gif',   top: '32%',  left: '1%',   width: 126, opacity: 0.21, anim: 'float-spirit 12s ease-in-out 1.8s infinite' },
  { src: '/assets/animation/lily-leaf-2.gif',   top: '50%',  left: '91%',  width: 118, opacity: 0.19, anim: 'float-spirit 10.5s ease-in-out 4.2s infinite' },
  { src: '/assets/animation/lily-leaf-1.gif',   top: '76%',  left: '5%',   width: 98,  opacity: 0.16, anim: 'float-spirit 13s ease-in-out 6s infinite' },
  // ─ Wind — atmospheric drift
  { src: '/assets/animation/wind.gif',          top: '55%',  left: '74%',  width: 155, opacity: 0.17, anim: 'ww-drift 11s ease-in-out 1s infinite' },
  { src: '/assets/animation/wind.gif',          top: '22%',  left: '44%',  width: 108, opacity: 0.10, anim: 'ww-drift 14s ease-in-out 5.5s infinite' },
  // ─ Shines / sparkles
  { src: '/assets/animation/shine-1.gif',       top: '17%',  left: '61%',  width: 58,  opacity: 0.34, anim: 'ww-twinkle 7s ease-in-out 0.5s infinite' },
  { src: '/assets/animation/shine-2.gif',       top: '74%',  left: '40%',  width: 52,  opacity: 0.25, anim: 'ww-twinkle 8.5s ease-in-out 2s infinite' },
  { src: '/assets/animation/shine-3.gif',       top: '43%',  left: '87%',  width: 46,  opacity: 0.30, anim: 'ww-twinkle 6.5s ease-in-out 3s infinite' },
  { src: '/assets/animation/shine-1.gif',       top: '88%',  left: '21%',  width: 42,  opacity: 0.20, anim: 'ww-twinkle 9s ease-in-out 1.2s infinite' },
  // ─ Ladies — bottom, gentle sway
  { src: '/assets/animation/lady-1.gif',        bottom: '0%', left: '6%',  width: 88,  opacity: 0.22, anim: 'ww-sway 10s ease-in-out 0.8s infinite' },
  { src: '/assets/animation/lady-2.gif',        bottom: '0%', left: '83%', width: 94,  opacity: 0.19, anim: 'ww-sway 11s ease-in-out 2.5s infinite' },
  { src: '/assets/animation/lady-3.gif',        bottom: '0%', left: '47%', width: 84,  opacity: 0.16, anim: 'ww-sway 12.5s ease-in-out 4s infinite' },
]

function ShellParticles() {
  return (
    <div style={particleStyles.wrap} aria-hidden="true">
      {PARTICLES.map((p, i) => (
        <img
          key={i}
          src={p.src}
          alt=""
          style={{
            ...particleStyles.image,
            top: p.top, bottom: p.bottom,
            left: p.left, right: p.right,
            width: p.width,
            opacity: p.opacity,
            animation: p.anim,
          }}
        />
      ))}
    </div>
  )
}

const particleStyles: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'fixed',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  image: {
    position: 'absolute',
    height: 'auto',
    filter: 'drop-shadow(0 4px 16px rgba(120,160,80,0.28))',
  },
}
